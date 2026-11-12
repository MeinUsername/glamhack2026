package app

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"google.golang.org/api/iterator"
)

const (
	maxUploadBytes = 1 << 20 // 1 MB
	maxNameRunes   = 120
)

// fileDoc lives in the "files" collection and references the object in the bucket.
type fileDoc struct {
	OwnerID     string    `firestore:"owner_id"`
	Name        string    `firestore:"name"`
	ContentType string    `firestore:"content_type"`
	Size        int64     `firestore:"size"`
	Object      string    `firestore:"object"`
	CreatedAt   time.Time `firestore:"created_at"`
}

// userError is an error whose message is shown to the user.
type userError string

func (e userError) Error() string { return string(e) }

const errTooLarge = userError("Die Datei ist größer als 1 MB.")

func (s *server) dashboard(w http.ResponseWriter, r *http.Request) {
	u, ok := s.currentUser(r)
	if !ok {
		redirect(w, r, "/login")
		return
	}
	files, err := s.listFiles(r, u.ID)
	if err != nil {
		log.Printf("list files: %v", err)
		http.Error(w, "Interner Fehler", http.StatusInternalServerError)
		return
	}
	s.render(w, "dashboard", pageData{User: u.Email, Files: files})
}

// uploadForm is the htmx endpoint: it returns the refreshed file section.
func (s *server) uploadForm(w http.ResponseWriter, r *http.Request) {
	u, ok := s.currentUser(r)
	if !ok {
		redirect(w, r, "/login")
		return
	}
	msg := "Datei hochgeladen."
	if _, _, err := s.saveUpload(w, r, u.ID); err != nil {
		var ue userError
		if errors.As(err, &ue) {
			msg = string(ue)
		} else {
			log.Printf("upload: %v", err)
			msg = "Interner Fehler beim Hochladen."
		}
	}
	files, err := s.listFiles(r, u.ID)
	if err != nil {
		log.Printf("list files: %v", err)
	}
	s.renderPartial(w, "filesSection", pageData{User: u.Email, Message: msg, Files: files})
}

// apiUpload is the JSON endpoint used by the Vue app.
func (s *server) apiUpload(w http.ResponseWriter, r *http.Request) {
	u, ok := s.currentUser(r)
	if !ok {
		writeJSONError(w, http.StatusUnauthorized, "nicht angemeldet")
		return
	}
	id, doc, err := s.saveUpload(w, r, u.ID)
	if err != nil {
		var ue userError
		if errors.As(err, &ue) {
			writeJSONError(w, http.StatusBadRequest, ue.Error())
			return
		}
		log.Printf("api upload: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "interner Fehler")
		return
	}
	writeJSON(w, http.StatusCreated, toView(id, doc))
}

// saveUpload enforces the 1 MB limit, writes the bytes to the bucket and stores
// a reference document in Firestore. If the reference fails, the object is removed.
func (s *server) saveUpload(w http.ResponseWriter, r *http.Request, uid string) (string, fileDoc, error) {
	// Allow some multipart overhead on top of the file limit.
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadBytes+64<<10)
	if err := r.ParseMultipartForm(maxUploadBytes); err != nil {
		var mbe *http.MaxBytesError
		if errors.As(err, &mbe) {
			return "", fileDoc{}, errTooLarge
		}
		return "", fileDoc{}, userError("Ungültiges Formular.")
	}
	f, hdr, err := r.FormFile("file")
	if err != nil {
		return "", fileDoc{}, userError("Bitte wähle eine Datei aus.")
	}
	defer f.Close()

	if hdr.Size > maxUploadBytes {
		return "", fileDoc{}, errTooLarge
	}
	data, err := io.ReadAll(io.LimitReader(f, maxUploadBytes+1))
	if err != nil {
		return "", fileDoc{}, fmt.Errorf("read upload: %w", err)
	}
	if len(data) > maxUploadBytes {
		return "", fileDoc{}, errTooLarge
	}
	if len(data) == 0 {
		return "", fileDoc{}, userError("Die Datei ist leer.")
	}

	ctx := r.Context()
	objectName := uid + "/" + randomHex(16)
	wr := s.bucket.Object(objectName).NewWriter(ctx)
	wr.ContentType = http.DetectContentType(data)
	if _, err := wr.Write(data); err != nil {
		_ = wr.Close()
		return "", fileDoc{}, fmt.Errorf("write object: %w", err)
	}
	if err := wr.Close(); err != nil {
		return "", fileDoc{}, fmt.Errorf("close object: %w", err)
	}

	doc := fileDoc{
		OwnerID:     uid,
		Name:        sanitizeName(hdr.Filename),
		ContentType: wr.ContentType,
		Size:        int64(len(data)),
		Object:      objectName,
		CreatedAt:   time.Now().UTC(),
	}
	ref, _, err := s.db.Collection("files").Add(ctx, doc)
	if err != nil {
		_ = s.bucket.Object(objectName).Delete(ctx) // do not leave orphaned objects
		return "", fileDoc{}, fmt.Errorf("store reference: %w", err)
	}
	return ref.ID, doc, nil
}

// download streams a file to its owner only.
func (s *server) download(w http.ResponseWriter, r *http.Request) {
	u, ok := s.currentUser(r)
	if !ok {
		http.Error(w, "nicht angemeldet", http.StatusUnauthorized)
		return
	}
	ctx := r.Context()
	snap, err := s.db.Collection("files").Doc(r.PathValue("id")).Get(ctx)
	if err != nil {
		if isNotFound(err) {
			http.NotFound(w, r)
			return
		}
		http.Error(w, "Interner Fehler", http.StatusInternalServerError)
		return
	}
	var d fileDoc
	if err := snap.DataTo(&d); err != nil || d.OwnerID != u.ID {
		http.NotFound(w, r) // same answer for "not yours" as for "does not exist"
		return
	}
	rd, err := s.bucket.Object(d.Object).NewReader(ctx)
	if err != nil {
		log.Printf("download object: %v", err)
		http.Error(w, "Interner Fehler", http.StatusInternalServerError)
		return
	}
	defer rd.Close()

	w.Header().Set("Content-Type", d.ContentType)
	w.Header().Set("Content-Length", strconv.FormatInt(d.Size, 10))
	w.Header().Set("Content-Disposition", mime.FormatMediaType("attachment", map[string]string{"filename": d.Name}))
	w.Header().Set("X-Content-Type-Options", "nosniff")
	_, _ = io.Copy(w, rd)
}

func (s *server) apiMe(w http.ResponseWriter, r *http.Request) {
	u, ok := s.currentUser(r)
	if !ok {
		writeJSONError(w, http.StatusUnauthorized, "nicht angemeldet")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"email": u.Email})
}

func (s *server) apiListFiles(w http.ResponseWriter, r *http.Request) {
	u, ok := s.currentUser(r)
	if !ok {
		writeJSONError(w, http.StatusUnauthorized, "nicht angemeldet")
		return
	}
	files, err := s.listFiles(r, u.ID)
	if err != nil {
		log.Printf("api list: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "interner Fehler")
		return
	}
	if files == nil {
		files = []fileView{}
	}
	writeJSON(w, http.StatusOK, files)
}

// listFiles returns the user's files, newest first. Filtering on one field and
// sorting in memory avoids a composite Firestore index.
func (s *server) listFiles(r *http.Request, uid string) ([]fileView, error) {
	iter := s.db.Collection("files").Where("owner_id", "==", uid).Documents(r.Context())
	defer iter.Stop()

	var out []fileView
	for {
		snap, err := iter.Next()
		if errors.Is(err, iterator.Done) {
			break
		}
		if err != nil {
			return nil, err
		}
		var d fileDoc
		if err := snap.DataTo(&d); err != nil {
			return nil, err
		}
		out = append(out, toView(snap.Ref.ID, d))
	}
	sort.Slice(out, func(i, j int) bool { return out[i].created > out[j].created })
	return out, nil
}

func toView(id string, d fileDoc) fileView {
	return fileView{
		ID:        id,
		Name:      d.Name,
		Bytes:     d.Size,
		Size:      humanSize(d.Size),
		CreatedAt: d.CreatedAt.Format("02.01.2006 15:04"),
		created:   d.CreatedAt.UnixNano(),
	}
}

func humanSize(n int64) string {
	if n < 1024 {
		return fmt.Sprintf("%d B", n)
	}
	return fmt.Sprintf("%.1f KB", float64(n)/1024)
}

// sanitizeName keeps only the base name and strips control characters and quotes.
func sanitizeName(name string) string {
	name = filepath.Base(strings.ReplaceAll(name, `\`, "/"))
	name = strings.Map(func(r rune) rune {
		if r < 32 || r == 127 || r == '"' {
			return -1
		}
		return r
	}, name)
	if name == "" || name == "." || name == "/" {
		name = "datei"
	}
	if utf8.RuneCountInString(name) > maxNameRunes {
		name = string([]rune(name)[:maxNameRunes])
	}
	return name
}

func randomHex(nbytes int) string {
	b := make([]byte, nbytes)
	if _, err := rand.Read(b); err != nil {
		panic(err) // crypto/rand failing means the platform is broken
	}
	return hex.EncodeToString(b)
}
