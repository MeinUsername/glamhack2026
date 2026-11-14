package app

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
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

// The React app (frontend/, built into static/app) is the only UI. The Go
// function serves its index.html for the page routes and the JSON API.
//
//go:embed static
var staticFS embed.FS

const appIndex = "static/app/index.html"

type server struct {
	db     *firestore.Client
	bucket *storage.BucketHandle
	authc  *auth.Client
	mux    *http.ServeMux
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

	s := &server{
		db:     db,
		bucket: gcs.Bucket(bucketName),
		authc:  authc,
		mux:    http.NewServeMux(),
	}
	// F-012 T1: the initial admin exists after the start. A failure is logged, the app still starts.
	if err := s.ensureInitialAdmin(ctx); err != nil {
		log.Printf("initial admin: %v", err)
	}
	// F-018 D6: the F-008 master prompt becomes the level "Standard". A failure is logged.
	if err := s.migrateMasterPrompt(ctx); err != nil {
		log.Printf("migrate master prompt: %v", err)
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
	// Pages: the same React index.html; the server only decides redirects.
	m.HandleFunc("GET /{$}", serveApp)
	m.HandleFunc("GET /login", s.loginPage)
	m.HandleFunc("GET /register", s.registerPage)
	m.HandleFunc("GET /dashboard", func(w http.ResponseWriter, r *http.Request) {
		redirect(w, r, "/ideas") // F-016: the dashboard is gone
	})
	m.HandleFunc("GET /ideas/new", serveApp)
	m.HandleFunc("GET /ideas/{id}", serveApp)
	m.HandleFunc("GET /ideas/{id}/edit", serveApp)  // F-012 T6
	m.HandleFunc("GET /basket", serveApp)           // F-006: public, no redirect
	m.HandleFunc("GET /ideas", serveApp)            // F-011: overview
	m.HandleFunc("GET /feedback-prompts", serveApp) // F-025: public page
	m.HandleFunc("GET /imprint", serveApp)          // F-028: public legal pages
	m.HandleFunc("GET /terms", serveApp)
	m.HandleFunc("GET /admin/users", s.requireAdmin(s.adminPage))
	m.HandleFunc("GET /admin/import", s.requireAdmin(s.adminPage))        // F-015: CSV import page
	m.HandleFunc("GET /admin/master-prompt", s.requireAdmin(s.adminPage)) // F-008: editor page
	m.HandleFunc("GET /app/{$}", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/", http.StatusSeeOther) // the old /app/ URL; the pages live at /
	})
	m.Handle("GET /app/", http.StripPrefix("/app", http.FileServerFS(vue))) // assets: /app/assets/...

	// Session and account.
	m.HandleFunc("POST /session", s.createSession)
	m.HandleFunc("POST /register", s.register)
	m.HandleFunc("POST /logout", s.logout)

	m.HandleFunc("GET /api/me", s.apiMe)

	// Ideas (F-002).
	m.HandleFunc("POST /api/ideas", s.apiCreateIdea)
	m.HandleFunc("GET /api/ideas", s.apiListIdeas)
	m.HandleFunc("GET /api/ideas/{id}", s.apiGetIdea)
	m.HandleFunc("PUT /api/ideas/{id}", s.apiUpdateIdea) // F-012 T6: editing without login
	m.HandleFunc("GET /api/ideas/{id}/images/{n}", s.apiIdeaImage)
	m.HandleFunc("GET /api/equipment", s.apiEquipment)

	// Prompt levels (F-018, replaces the single master prompt of F-008). Reading is open to every signed-in role.
	m.HandleFunc("GET /api/prompt-levels", s.requireSignedIn(s.apiPromptLevels))
	m.HandleFunc("GET /api/feedback-prompts", s.apiFeedbackPrompts) // F-025: public
	m.HandleFunc("GET /api/feedback-prompts/{id}/render", s.apiRenderFeedbackPrompt)
	m.HandleFunc("GET /api/admin/feedback-prompts", s.requireAdmin(s.apiAdminFeedbackPrompts))
	m.HandleFunc("POST /api/admin/feedback-prompts", s.requireAdmin(s.apiCreateFeedbackPrompt))
	m.HandleFunc("PUT /api/admin/feedback-prompts/order", s.requireAdmin(s.apiReorderFeedbackPrompts))
	m.HandleFunc("PUT /api/admin/feedback-prompts/{id}", s.requireAdmin(s.apiSaveFeedbackPrompt))
	m.HandleFunc("DELETE /api/admin/feedback-prompts/{id}", s.requireAdmin(s.apiDeleteFeedbackPrompt))
	m.HandleFunc("GET /api/admin/prompt-levels", s.requireAdmin(s.apiAdminPromptLevels))
	m.HandleFunc("POST /api/admin/prompt-levels", s.requireAdmin(s.apiCreatePromptLevel))
	m.HandleFunc("PUT /api/admin/prompt-levels/order", s.requireAdmin(s.apiReorderPromptLevels))
	m.HandleFunc("PUT /api/admin/prompt-levels/{id}", s.requireAdmin(s.apiSavePromptLevel))
	m.HandleFunc("DELETE /api/admin/prompt-levels/{id}", s.requireAdmin(s.apiDeletePromptLevel))
	m.HandleFunc("POST /api/admin/prompt-levels/{id}/versions/{n}/restore", s.requireAdmin(s.apiRestorePromptLevel))

	// Invitations.
	m.HandleFunc("POST /api/invitations", s.requireAdmin(s.apiCreateInvitation)) // F-012 D8
	m.HandleFunc("GET /api/invitations/{token}", s.apiCheckInvitation)

	// CSV import of ideas (F-015), admin only.
	m.HandleFunc("POST /api/admin/import/ideas/preview", s.requireAdmin(s.apiImportIdeasPreview))
	m.HandleFunc("POST /api/admin/import/ideas", s.requireAdmin(s.apiImportIdeas))

	// Admin.
	m.HandleFunc("GET /api/admin/users", s.requireAdmin(s.apiListUsers))
	m.HandleFunc("POST /api/admin/users/{uid}/role", s.requireAdmin(s.apiSetUserRole))
	m.HandleFunc("POST /api/admin/users/{uid}/disabled", s.requireAdmin(s.apiSetUserDisabled))
}

// serveApp writes the React page. The client router decides what to show.
func serveApp(w http.ResponseWriter, r *http.Request) {
	writeAppIndex(w)
}

func writeAppIndex(w http.ResponseWriter) {
	page, err := fs.ReadFile(staticFS, appIndex)
	if err != nil {
		log.Printf("read %s: %v", appIndex, err)
		http.Error(w, "Interner Fehler", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	_, _ = w.Write(page)
}

// redirect sends the browser to another page (303).
func redirect(w http.ResponseWriter, r *http.Request, to string) {
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
