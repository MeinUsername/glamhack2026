package app

import (
	"context"
	"encoding/json"
	"errors"
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
	Role  string // roleAdmin or roleUser, read fresh from the users collection
}

// currentUser verifies the Firebase session cookie and loads the role. Any failure
// means "not logged in", and so does a blocked account.
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
	d, err := s.loadOrCreateUser(r.Context(), tok.UID, email)
	if err != nil {
		log.Printf("load user %s: %v", tok.UID, err)
		return sessionUser{}, false
	}
	if d.Disabled {
		return sessionUser{}, false
	}
	return sessionUser{ID: tok.UID, Email: email, Role: d.Role}, true
}

// loginPage sends signed-in admins to the dashboard and other signed-in users to the start page (F-012 T3).
func (s *server) loginPage(w http.ResponseWriter, r *http.Request) {
	if u, ok := s.currentUser(r); ok {
		if u.Role == roleAdmin {
			redirect(w, r, "/dashboard")
		} else {
			redirect(w, r, "/")
		}
		return
	}
	writeAppIndex(w)
}

// registerPage sends signed-in users to the dashboard. Without an invitation link the page
// explains that registration is not possible (F-012 Q-012-11).
func (s *server) registerPage(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.currentUser(r); ok {
		redirect(w, r, "/dashboard")
		return
	}
	writeAppIndex(w)
}

// dashboard is the page for signed-in users; everyone else goes to the login page.
func (s *server) dashboard(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.currentUser(r); !ok {
		redirect(w, r, "/login")
		return
	}
	writeAppIndex(w)
}

// setSessionCookie exchanges a Firebase ID token for a session cookie and sets it.
func (s *server) setSessionCookie(w http.ResponseWriter, r *http.Request, idToken string) error {
	cookie, err := s.authc.SessionCookie(r.Context(), idToken, sessionTTL)
	if err != nil {
		return err
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
	return nil
}

// createSession is used after sign-in. The browser sends the fresh ID token.
func (s *server) createSession(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 16<<10)
	var body struct {
		IDToken string `json:"idToken"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.IDToken == "" {
		writeJSONError(w, http.StatusBadRequest, "ungültige Anfrage")
		return
	}
	ctx := r.Context()
	tok, err := s.authc.VerifyIDToken(ctx, body.IDToken)
	if err != nil {
		log.Printf("verify id token: %v", err)
		writeJSONError(w, http.StatusUnauthorized, "ungültiges Token")
		return
	}
	email, _ := tok.Claims["email"].(string)
	d, err := s.loadOrCreateUser(ctx, tok.UID, email)
	if err != nil {
		log.Printf("load user %s: %v", tok.UID, err)
		writeJSONError(w, http.StatusInternalServerError, "interner Fehler")
		return
	}
	if d.Disabled {
		writeJSONError(w, http.StatusForbidden, "Dieses Konto ist gesperrt.")
		return
	}
	if err := s.setSessionCookie(w, r, body.IDToken); err != nil {
		log.Printf("session cookie: %v", err)
		writeJSONError(w, http.StatusUnauthorized, "ungültiges Token")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// register completes a sign-up. The browser has already created the Firebase
// account and sends its ID token, plus the invitation token if there is one.
// An invalid link (410) removes the new account again, so that nothing is left over.
func (s *server) register(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 16<<10)
	var body struct {
		IDToken string `json:"idToken"`
		Invite  string `json:"invite"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.IDToken == "" {
		writeJSONError(w, http.StatusBadRequest, "ungültige Anfrage")
		return
	}
	ctx := r.Context()
	tok, err := s.authc.VerifyIDToken(ctx, body.IDToken)
	if err != nil {
		log.Printf("verify id token: %v", err)
		writeJSONError(w, http.StatusUnauthorized, "ungültiges Token")
		return
	}
	email, _ := tok.Claims["email"].(string)

	if body.Invite == "" {
		// F-012 Q-012-11: sign-up is possible only with an invitation link.
		s.discardNewAccount(ctx, tok.UID)
		writeJSONError(w, http.StatusForbidden, "Registrierung nur mit Einladungslink.")
		return
	}
	if err := s.redeemInvitation(ctx, body.Invite, tok.UID, email); err != nil {
		s.discardNewAccount(ctx, tok.UID)
		if errors.Is(err, errInvalidInvite) {
			writeJSONError(w, http.StatusGone, errInvalidInvite.Error())
			return
		}
		log.Printf("redeem invitation: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "interner Fehler")
		return
	}

	if err := s.setSessionCookie(w, r, body.IDToken); err != nil {
		log.Printf("session cookie: %v", err)
		writeJSONError(w, http.StatusUnauthorized, "ungültiges Token")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// discardNewAccount deletes a Firebase account that has no users document yet.
// Accounts that already have one are kept.
func (s *server) discardNewAccount(ctx context.Context, uid string) {
	if s.userExists(ctx, uid) {
		return
	}
	if err := s.authc.DeleteUser(ctx, uid); err != nil {
		log.Printf("discard account %s: %v", uid, err)
	}
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
