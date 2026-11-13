package app

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

// Limits of an idea page. The text and device limits are our own choices (plan F-002, T1),
// not part of the spec.
const (
	maxIdeaImages       = 5
	maxIdeaImageBytes   = 5 << 20  // 5 MiB per image
	maxIdeaBodyBytes    = 26 << 20 // 5 images plus text, under the Cloud Run limit of 32 MiB
	maxIdeaTextRunes    = 5000
	maxDeviceRunes      = 50
	maxDevicesPerIdea   = 50
	equipmentSuggestMax = 10
)

var budgetSizes = map[string]bool{"S": true, "M": true, "L": true, "XL": true}

// ideaDoc lives in the "ideas" collection.
type ideaDoc struct {
	Title          string     `firestore:"title"`
	Description    string     `firestore:"description"`
	Audience       string     `firestore:"audience"`
	Goal           string     `firestore:"goal"`
	Sustainability string     `firestore:"sustainability"`
	Accessibility  string     `firestore:"accessibility"`
	Space          spaceDoc   `firestore:"space"`
	Equipment      []string   `firestore:"equipment"`
	Categories     []string   `firestore:"categories"`
	Budget         *string    `firestore:"budget"`
	Images         []imageDoc `firestore:"images"`
	CreatedBy      string     `firestore:"created_by"`
	CreatedAt      time.Time  `firestore:"created_at"`
}

type spaceDoc struct {
	AreaM2   *float64 `firestore:"area_m2"`
	VolumeM3 *float64 `firestore:"volume_m3"`
}

type imageDoc struct {
	Object      string `firestore:"object"`
	ContentType string `firestore:"content_type"`
	Size        int64  `firestore:"size"`
}

// equipmentDoc is the catalog entry for the autocomplete. The document ID is the name key.
type equipmentDoc struct {
	Name    string `firestore:"name"`
	NameKey string `firestore:"name_key"`
}

// ideaInput is the JSON part ("data") of the multipart upload. Numbers arrive as text
// so that "2,5" and "2.5" are both accepted.
type ideaInput struct {
	Title          string `json:"title"`
	Description    string `json:"description"`
	Audience       string `json:"audience"`
	Goal           string `json:"goal"`
	Sustainability string `json:"sustainability"`
	Accessibility  string `json:"accessibility"`
	Space          struct {
		AreaM2   string `json:"areaM2"`
		VolumeM3 string `json:"volumeM3"`
	} `json:"space"`
	Equipment  []string `json:"equipment"`
	Budget     string   `json:"budget"`
	Categories []string `json:"categories"`
}

// ideaView is an idea as returned by GET /api/ideas/{id}.
type ideaView struct {
	ID             string      `json:"id"`
	Title          string      `json:"title"`
	Description    string      `json:"description"`
	Audience       string      `json:"audience"`
	Goal           string      `json:"goal"`
	Sustainability string      `json:"sustainability"`
	Accessibility  string      `json:"accessibility"`
	Space          spaceView   `json:"space"`
	Equipment      []string    `json:"equipment"`
	Categories     []string    `json:"categories"`
	Budget         *string     `json:"budget"`
	Images         []imageView `json:"images"`
	CreatedAt      string      `json:"createdAt"`
}

type spaceView struct {
	AreaM2   *float64 `json:"areaM2"`
	VolumeM3 *float64 `json:"volumeM3"`
}

type imageView struct {
	ContentType string `json:"contentType"`
	Bytes       int64  `json:"bytes"`
}

// validateIdeaInput checks the JSON input without touching Firestore and returns the
// document to store. The empty input is valid: no field is required.
func validateIdeaInput(in ideaInput) (ideaDoc, []equipmentDoc, error) {
	texts := map[string]string{
		"Title":          in.Title,
		"Description":    in.Description,
		"Audience":       in.Audience,
		"Goal":           in.Goal,
		"Sustainability": in.Sustainability,
		"Accessibility":  in.Accessibility,
	}
	for field, v := range texts {
		if utf8.RuneCountInString(v) > maxIdeaTextRunes {
			return ideaDoc{}, nil, userError(fmt.Sprintf("%s is longer than %d characters.", field, maxIdeaTextRunes))
		}
	}

	var doc ideaDoc
	doc.Title = strings.TrimSpace(in.Title)
	doc.Description = strings.TrimSpace(in.Description)
	doc.Audience = strings.TrimSpace(in.Audience)
	doc.Goal = strings.TrimSpace(in.Goal)
	doc.Sustainability = strings.TrimSpace(in.Sustainability)
	doc.Accessibility = strings.TrimSpace(in.Accessibility)

	area, err := parseArea(in.Space.AreaM2, "Area")
	if err != nil {
		return ideaDoc{}, nil, err
	}
	volume, err := parseArea(in.Space.VolumeM3, "Volume")
	if err != nil {
		return ideaDoc{}, nil, err
	}
	doc.Space = spaceDoc{AreaM2: area, VolumeM3: volume}

	switch b := strings.TrimSpace(in.Budget); {
	case b == "":
		doc.Budget = nil
	case budgetSizes[b]:
		doc.Budget = &b
	default:
		return ideaDoc{}, nil, userError("Budget must be S, M, L, XL or empty.")
	}

	equipment, catalog, err := normalizeEquipment(in.Equipment)
	if err != nil {
		return ideaDoc{}, nil, err
	}
	doc.Equipment = equipment
	categories, err := normalizeCategories(in.Categories)
	if err != nil {
		return ideaDoc{}, nil, err
	}
	doc.Categories = categories
	return doc, catalog, nil
}

// ideaCategories are the valid category keys in the order of the spec table (F-009).
var ideaCategories = []string{"affirmative", "reproductive", "deconstructive", "transformation"}

// normalizeCategories accepts only the four keys (case-sensitive), drops duplicates and
// keeps the order of the first occurrences. nil and an empty list are valid.
func normalizeCategories(raw []string) ([]string, error) {
	valid := map[string]bool{}
	for _, c := range ideaCategories {
		valid[c] = true
	}
	seen := map[string]bool{}
	out := []string{}
	for _, c := range raw {
		if !valid[c] {
			return nil, userError(fmt.Sprintf("Unknown category %q.", c))
		}
		if seen[c] {
			continue
		}
		seen[c] = true
		out = append(out, c)
	}
	return out, nil
}

// parseArea reads a non-negative number; "" means not given. Comma and point both work.
func parseArea(raw, field string) (*float64, error) {
	s := strings.TrimSpace(strings.ReplaceAll(raw, ",", "."))
	if s == "" {
		return nil, nil
	}
	v, err := strconv.ParseFloat(s, 64)
	if err != nil || math.IsNaN(v) || math.IsInf(v, 0) || v < 0 {
		return nil, userError(field + " must be a number of zero or more.")
	}
	return &v, nil
}

// normalizeEquipment trims the device names, drops empty ones and duplicates (ignoring
// case), and returns the names for the idea plus the catalog entries.
func normalizeEquipment(raw []string) ([]string, []equipmentDoc, error) {
	seen := map[string]bool{}
	names := []string{}
	var catalog []equipmentDoc
	for _, r := range raw {
		name := strings.TrimSpace(r)
		if name == "" {
			continue
		}
		if utf8.RuneCountInString(name) > maxDeviceRunes {
			return nil, nil, userError(fmt.Sprintf("A device name is longer than %d characters.", maxDeviceRunes))
		}
		key := nameKey(name)
		if seen[key] {
			continue
		}
		seen[key] = true
		names = append(names, name)
		catalog = append(catalog, equipmentDoc{Name: name, NameKey: key})
	}
	if len(names) > maxDevicesPerIdea {
		return nil, nil, userError(fmt.Sprintf("An idea can have at most %d devices.", maxDevicesPerIdea))
	}
	return names, catalog, nil
}

// nameKey is the lowercase, trimmed form of a device name; it is the catalog's document ID.
func nameKey(name string) string {
	return strings.ToLower(strings.TrimSpace(name))
}

// apiCreateIdea handles POST /api/ideas (multipart: "data" JSON, "images" files).
func (s *server) apiCreateIdea(w http.ResponseWriter, r *http.Request) {
	u, ok := s.currentUser(r)
	if !ok {
		writeJSONError(w, http.StatusUnauthorized, "not signed in")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, maxIdeaBodyBytes)
	if err := r.ParseMultipartForm(maxIdeaBodyBytes); err != nil {
		var mbe *http.MaxBytesError
		if errors.As(err, &mbe) {
			writeJSONError(w, http.StatusRequestEntityTooLarge, "The request is too large.")
			return
		}
		writeJSONError(w, http.StatusBadRequest, "Invalid form.")
		return
	}

	var in ideaInput
	if raw := r.FormValue("data"); raw != "" {
		if err := json.Unmarshal([]byte(raw), &in); err != nil {
			writeJSONError(w, http.StatusBadRequest, "Invalid data.")
			return
		}
	}
	doc, catalog, err := validateIdeaInput(in)
	if err != nil {
		writeUserError(w, err)
		return
	}
	images, err := readIdeaImages(r.MultipartForm)
	if err != nil {
		writeUserError(w, err)
		return
	}

	ctx := r.Context()
	ref := s.db.Collection("ideas").NewDoc() // the ID is needed before the images are stored
	stored, err := s.storeIdeaImages(ctx, ref.ID, images)
	if err != nil {
		log.Printf("idea images: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "internal error")
		return
	}
	doc.Images = stored
	doc.CreatedBy = u.ID
	doc.CreatedAt = time.Now().UTC()

	err = s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		// Firestore wants all reads before the first write.
		var missing []equipmentDoc
		for _, e := range catalog {
			snap, err := tx.Get(s.db.Collection("equipment").Doc(e.NameKey))
			if err != nil && !isNotFound(err) {
				return err
			}
			if err != nil || !snap.Exists() {
				missing = append(missing, e)
			}
		}
		if err := tx.Set(ref, doc); err != nil {
			return err
		}
		for _, e := range missing {
			if err := tx.Set(s.db.Collection("equipment").Doc(e.NameKey), e); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		log.Printf("create idea: %v", err)
		s.deleteObjects(ctx, stored) // do not leave orphaned images
		writeJSONError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"id": ref.ID})
}

// readIdeaImages checks the uploaded files: count, size and format (by content, not by name).
func readIdeaImages(form *multipart.Form) ([]checkedImage, error) {
	if form == nil {
		return nil, nil
	}
	headers := form.File["images"]
	if len(headers) > maxIdeaImages {
		return nil, userError(fmt.Sprintf("At most %d images can be uploaded.", maxIdeaImages))
	}
	var out []checkedImage
	for _, hdr := range headers {
		if hdr.Size > maxIdeaImageBytes {
			return nil, userError("Each image must be at most 5 MB.")
		}
		f, err := hdr.Open()
		if err != nil {
			return nil, fmt.Errorf("open image: %w", err)
		}
		data, err := io.ReadAll(io.LimitReader(f, maxIdeaImageBytes+1))
		_ = f.Close()
		if err != nil {
			return nil, fmt.Errorf("read image: %w", err)
		}
		if len(data) > maxIdeaImageBytes {
			return nil, userError("Each image must be at most 5 MB.")
		}
		ctype, ext, err := checkImage(data)
		if err != nil {
			return nil, err
		}
		out = append(out, checkedImage{data: data, contentType: ctype, ext: ext})
	}
	return out, nil
}

// apiGetIdea handles GET /api/ideas/{id}.
func (s *server) apiGetIdea(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.currentUser(r); !ok {
		writeJSONError(w, http.StatusUnauthorized, "not signed in")
		return
	}
	snap, err := s.db.Collection("ideas").Doc(r.PathValue("id")).Get(r.Context())
	if err != nil {
		if isNotFound(err) {
			writeJSONError(w, http.StatusNotFound, "idea not found")
			return
		}
		log.Printf("get idea: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "internal error")
		return
	}
	var d ideaDoc
	if err := snap.DataTo(&d); err != nil {
		log.Printf("decode idea %s: %v", snap.Ref.ID, err)
		writeJSONError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, toIdeaView(snap.Ref.ID, d))
}

func toIdeaView(id string, d ideaDoc) ideaView {
	v := ideaView{
		ID:             id,
		Title:          d.Title,
		Description:    d.Description,
		Audience:       d.Audience,
		Goal:           d.Goal,
		Sustainability: d.Sustainability,
		Accessibility:  d.Accessibility,
		Space:          spaceView{AreaM2: d.Space.AreaM2, VolumeM3: d.Space.VolumeM3},
		Equipment:      d.Equipment,
		Budget:         d.Budget,
		Categories:     d.Categories,
		CreatedAt:      d.CreatedAt.Format(time.RFC3339),
	}
	if v.Categories == nil {
		v.Categories = []string{} // pages saved before F-009 have no field
	}
	if v.Equipment == nil {
		v.Equipment = []string{}
	}
	v.Images = make([]imageView, 0, len(d.Images))
	for _, img := range d.Images {
		v.Images = append(v.Images, imageView{ContentType: img.ContentType, Bytes: img.Size})
	}
	return v
}

// apiIdeaImage handles GET /api/ideas/{id}/images/{n}; n is 0-based.
func (s *server) apiIdeaImage(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.currentUser(r); !ok {
		writeJSONError(w, http.StatusUnauthorized, "not signed in")
		return
	}
	ctx := r.Context()
	snap, err := s.db.Collection("ideas").Doc(r.PathValue("id")).Get(ctx)
	if err != nil {
		if isNotFound(err) {
			writeJSONError(w, http.StatusNotFound, "idea not found")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "internal error")
		return
	}
	var d ideaDoc
	if err := snap.DataTo(&d); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "internal error")
		return
	}
	n, err := strconv.Atoi(r.PathValue("n"))
	if err != nil || n < 0 || n >= len(d.Images) {
		writeJSONError(w, http.StatusNotFound, "image not found")
		return
	}
	img := d.Images[n]
	rd, err := s.bucket.Object(img.Object).NewReader(ctx)
	if err != nil {
		log.Printf("open image %s: %v", img.Object, err)
		writeJSONError(w, http.StatusNotFound, "image not found")
		return
	}
	defer rd.Close()
	w.Header().Set("Content-Type", img.ContentType)
	w.Header().Set("Cache-Control", "private, max-age=3600")
	_, _ = io.Copy(w, rd)
}

// apiEquipment handles GET /api/equipment?q=... (autocomplete over the catalog).
func (s *server) apiEquipment(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.currentUser(r); !ok {
		writeJSONError(w, http.StatusUnauthorized, "not signed in")
		return
	}
	q := nameKey(r.URL.Query().Get("q"))
	names := []string{}
	if q == "" {
		writeJSON(w, http.StatusOK, names) // no full listing
		return
	}
	it := s.db.Collection("equipment").
		Where("name_key", ">=", q).
		Where("name_key", "<", q+"").
		OrderBy("name_key", firestore.Asc).
		Limit(equipmentSuggestMax).
		Documents(r.Context())
	defer it.Stop()
	for {
		snap, err := it.Next()
		if errors.Is(err, iterator.Done) {
			break
		}
		if err != nil {
			log.Printf("equipment query: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "internal error")
			return
		}
		var e equipmentDoc
		if err := snap.DataTo(&e); err == nil {
			names = append(names, e.Name)
		}
	}
	writeJSON(w, http.StatusOK, names)
}

// writeUserError answers 400 with the message of a userError, and 500 for anything else.
func writeUserError(w http.ResponseWriter, err error) {
	var ue userError
	if errors.As(err, &ue) {
		writeJSONError(w, http.StatusBadRequest, ue.Error())
		return
	}
	writeJSONError(w, http.StatusInternalServerError, "internal error")
}

// ideaSummary is one row of the overview (F-011). The full page comes from GET /api/ideas/{id}.
type ideaSummary struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	ImageCount int    `json:"imageCount"`
}

// apiListIdeas handles GET /api/ideas: all ideas, newest first (F-011).
func (s *server) apiListIdeas(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.currentUser(r); !ok {
		writeJSONError(w, http.StatusUnauthorized, "not signed in")
		return
	}
	it := s.db.Collection("ideas").OrderBy("created_at", firestore.Desc).Documents(r.Context())
	defer it.Stop()
	out := []ideaSummary{}
	for {
		snap, err := it.Next()
		if errors.Is(err, iterator.Done) {
			break
		}
		if err != nil {
			log.Printf("list ideas: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "internal error")
			return
		}
		var d ideaDoc
		if err := snap.DataTo(&d); err != nil {
			log.Printf("decode idea %s: %v", snap.Ref.ID, err)
			continue
		}
		out = append(out, ideaSummary{ID: snap.Ref.ID, Title: d.Title, ImageCount: len(d.Images)})
	}
	writeJSON(w, http.StatusOK, out)
}
