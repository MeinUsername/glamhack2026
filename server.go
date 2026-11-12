package app

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"html/template"
	"io/fs"
	"log"
	"net/http"
	"os"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"

	"cloud.google.com/go/firestore"
	"cloud.google.com/go/storage"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

//go:embed templates
var templateFS embed.FS

//go:embed static
var staticFS embed.FS

type server struct {
	db     *firestore.Client
	bucket *storage.BucketHandle
	authc  *auth.Client
	pages  map[string]*template.Template
	mux    *http.ServeMux
}

// pageData is the data handed to every template.
type pageData struct {
	User    string
	Message string
	Files   []fileView
}

// fileView is a file as shown in the UI and returned by the JSON API.
type fileView struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Bytes     int64  `json:"bytes"`
	Size      string `json:"-"`
	CreatedAt string `json:"createdAt"`
	created   int64
}

func newServer(ctx context.Context) (*server, error) {
	project := os.Getenv("PROJECT_ID")
	if project == "" {
		project = os.Getenv("GOOGLE_CLOUD_PROJECT")
	}
	bucketName := os.Getenv("BUCKET_NAME")
	if project == "" || bucketName == "" {
		return nil, fmt.Errorf("PROJECT_ID and BUCKET_NAME must be set")
	}

	db, err := firestore.NewClient(ctx, project)
	if err != nil {
		return nil, fmt.Errorf("firestore: %w", err)
	}
	gcs, err := storage.NewClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("storage: %w", err)
	}
	fbApp, err := firebase.NewApp(ctx, &firebase.Config{ProjectID: project})
	if err != nil {
		return nil, fmt.Errorf("firebase: %w", err)
	}
	authc, err := fbApp.Auth(ctx)
	if err != nil {
		return nil, fmt.Errorf("firebase auth: %w", err)
	}

	pages := map[string]*template.Template{}
	for _, name := range []string{"home", "login", "register", "dashboard"} {
		t, err := template.ParseFS(templateFS,
			"templates/layout.html", "templates/partials.html", "templates/"+name+".html")
		if err != nil {
			return nil, fmt.Errorf("template %s: %w", name, err)
		}
		pages[name] = t
	}

	s := &server{
		db:     db,
		bucket: gcs.Bucket(bucketName),
		authc:  authc,
		pages:  pages,
		mux:    http.NewServeMux(),
	}
	s.routes()
	return s, nil
}

func (s *server) routes() {
	vue, err := fs.Sub(staticFS, "static/app")
	if err != nil {
		panic(err) // the directory is embedded at build time
	}

	m := s.mux
	m.HandleFunc("GET /{$}", s.home)
	m.HandleFunc("GET /login", s.loginPage)
	m.HandleFunc("GET /register", s.registerPage)
	m.HandleFunc("POST /session", s.createSession)
	m.HandleFunc("POST /logout", s.logout)
	m.HandleFunc("GET /dashboard", s.dashboard)
	m.HandleFunc("POST /files", s.uploadForm)
	m.HandleFunc("GET /files/{id}", s.download)
	m.HandleFunc("GET /api/me", s.apiMe)
	m.HandleFunc("GET /api/files", s.apiListFiles)
	m.HandleFunc("POST /api/files", s.apiUpload)
	m.Handle("GET /app/", http.StripPrefix("/app", http.FileServerFS(vue)))
}

func (s *server) home(w http.ResponseWriter, r *http.Request) {
	u, _ := s.currentUser(r)
	s.render(w, "home", pageData{User: u.Email})
}

// render writes a full page (layout + page content).
func (s *server) render(w http.ResponseWriter, page string, data pageData) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := s.pages[page].ExecuteTemplate(w, "layout", data); err != nil {
		log.Printf("render %s: %v", page, err)
	}
}

// renderPartial writes a fragment for htmx swaps.
func (s *server) renderPartial(w http.ResponseWriter, name string, data any) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := s.pages["dashboard"].ExecuteTemplate(w, name, data); err != nil {
		log.Printf("partial %s: %v", name, err)
	}
}

// redirect sends htmx requests an HX-Redirect header and plain requests a 303.
func redirect(w http.ResponseWriter, r *http.Request, to string) {
	if r.Header.Get("HX-Request") == "true" {
		w.Header().Set("HX-Redirect", to)
		w.WriteHeader(http.StatusOK)
		return
	}
	http.Redirect(w, r, to, http.StatusSeeOther)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeJSONError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func isNotFound(err error) bool {
	return status.Code(err) == codes.NotFound
}
