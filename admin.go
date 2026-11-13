package app

import (
	"errors"
	"io"
	"log"
	"net/http"
)

// requireAdmin lets only logged-in admins through. Others get a redirect to the
// login page (not logged in) or 403 (logged in, no admin role). The check reads
// the role fresh on each request.
func (s *server) requireAdmin(next func(http.ResponseWriter, *http.Request, sessionUser)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u, ok := s.currentUser(r)
		if !ok {
			redirect(w, r, "/login")
			return
		}
		if !isAdmin(u) {
			if r.Header.Get("HX-Request") == "true" {
				w.WriteHeader(http.StatusForbidden)
				_, _ = io.WriteString(w, `<p class="error" role="alert">Nur für Admins.</p>`)
				return
			}
			http.Error(w, "Nur für Admins.", http.StatusForbidden)
			return
		}
		next(w, r, u)
	}
}

// isAdmin is the single place that decides admin rights.
func isAdmin(u sessionUser) bool { return u.Role == roleAdmin }

func (s *server) adminUsersPage(w http.ResponseWriter, r *http.Request, u sessionUser) {
	users, err := s.listUsers(r.Context())
	if err != nil {
		log.Printf("list users: %v", err)
		http.Error(w, "Interner Fehler", http.StatusInternalServerError)
		return
	}
	s.render(w, "admin", pageData{User: u.Email, IsAdmin: true, Users: users})
}

// setUserRole is the htmx endpoint for the role select. It returns the users section.
func (s *server) setUserRole(w http.ResponseWriter, r *http.Request, u sessionUser) {
	err := s.setRole(r.Context(), u.ID, r.PathValue("uid"), r.FormValue("role"))
	s.renderUsers(w, r, u, "Rolle gespeichert.", err)
}

// setUserDisabled is the htmx endpoint for the block button (disabled=true|false).
func (s *server) setUserDisabled(w http.ResponseWriter, r *http.Request, u sessionUser) {
	var disabled bool
	switch r.FormValue("disabled") {
	case "true":
		disabled = true
	case "false":
		disabled = false
	default:
		s.renderUsers(w, r, u, "", userError("Ungültiger Wert."))
		return
	}
	err := s.setBlocked(r.Context(), u.ID, r.PathValue("uid"), disabled)
	msg := "Nutzer gesperrt."
	if !disabled {
		msg = "Sperre aufgehoben."
	}
	s.renderUsers(w, r, u, msg, err)
}

// renderUsers writes the users section with either a success message or the error.
func (s *server) renderUsers(w http.ResponseWriter, r *http.Request, u sessionUser, msg string, actionErr error) {
	data := pageData{User: u.Email, IsAdmin: true}
	if actionErr != nil {
		var ue userError
		if errors.As(actionErr, &ue) {
			data.Error = ue.Error()
		} else {
			log.Printf("admin action: %v", actionErr)
			data.Error = "Interner Fehler."
		}
	} else {
		data.Message = msg
	}
	users, err := s.listUsers(r.Context())
	if err != nil {
		log.Printf("list users: %v", err)
		data.Error = "Interner Fehler."
	}
	data.Users = users
	s.renderPartial(w, "usersSection", data)
}
