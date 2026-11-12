package app

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

const (
	sessionCookie = "session"
	sessionTTL    = 5 * 24 * time.Hour // Firebase allows session cookies up to 14 days
)

type sessionUser struct {
	ID    string
	Email string
}

// currentUser verifies the Firebase session cookie. Any failure means "not logged in".
func (s *server) currentUser(r *http.Request) (sessionUser, bool) {
	c, err := r.Cookie(sessionCookie)
	if err != nil || c.Value == "" {
		return sessionUser{}, false
	}
	tok, err := s.authc.VerifySessionCookieAndCheckRevoked(r.Context(), c.Value)
	if err != nil {
		return sessionUser{}, false
	}
	email, _ := tok.Claims["email"].(string)
	return sessionUser{ID: tok.UID, Email: email}, true
}

func (s *server) loginPage(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.currentUser(r); ok {
		redirect(w, r, "/dashboard")
		return
	}
	s.render(w, "login", pageData{})
}

func (s *server) registerPage(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.currentUser(r); ok {
		redirect(w, r, "/dashboard")
		return
	}
	s.render(w, "register", pageData{})
}

// createSession exchanges a freshly issued Firebase ID token for a session cookie.
// The browser sends the token after a successful Firebase sign-in or registration.
func (s *server) createSession(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 16<<10)
	var body struct {
		IDToken string `json:"idToken"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.IDToken == "" {
		writeJSONError(w, http.StatusBadRequest, "ungültige Anfrage")
		return
	}
	cookie, err := s.authc.SessionCookie(r.Context(), body.IDToken, sessionTTL)
	if err != nil {
		log.Printf("session cookie: %v", err)
		writeJSONError(w, http.StatusUnauthorized, "ungültiges Token")
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookie,
		Value:    cookie,
		Path:     "/",
		MaxAge:   int(sessionTTL.Seconds()),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
	w.WriteHeader(http.StatusNoContent)
}

func (s *server) logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookie,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
	redirect(w, r, "/")
}
