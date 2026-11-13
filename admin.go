package app

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"
)

// isAdmin is the single place that decides admin rights.
func isAdmin(u sessionUser) bool { return u.Role == roleAdmin }

// requireAdmin lets only signed-in admins through (role read fresh per request).
func (s *server) requireAdmin(next func(http.ResponseWriter, *http.Request, sessionUser)) http.HandlerFunc {
	return guardAdmin(s.currentUser, next)
}

// guardAdmin is requireAdmin with the user lookup passed in, so tests can supply users.
// JSON paths get JSON errors (401 signed out, 403 no admin); pages get a redirect or 403.
func guardAdmin(resolve func(*http.Request) (sessionUser, bool), next func(http.ResponseWriter, *http.Request, sessionUser)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		isAPI := strings.HasPrefix(r.URL.Path, "/api/")
		u, ok := resolve(r)
		if !ok {
			if isAPI {
				writeJSONError(w, http.StatusUnauthorized, "nicht angemeldet")
				return
			}
			redirect(w, r, "/login")
			return
		}
		if !isAdmin(u) {
			if isAPI {
				writeJSONError(w, http.StatusForbidden, "Nur für Admins.")
				return
			}
			http.Error(w, "Nur für Admins.", http.StatusForbidden)
			return
		}
		next(w, r, u)
	}
}

// adminPage serves the React page /admin/users (the data comes from the JSON API).
func (s *server) adminPage(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	writeAppIndex(w)
}

func (s *server) apiListUsers(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	users, err := s.listUsers(r.Context())
	if err != nil {
		log.Printf("list users: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "interner Fehler")
		return
	}
	if users == nil {
		users = []userView{}
	}
	writeJSON(w, http.StatusOK, users)
}

// apiSetUserRole: body {"role": "admin" | "user"}. Answers with the refreshed user list.
func (s *server) apiSetUserRole(w http.ResponseWriter, r *http.Request, actor sessionUser) {
	var body struct {
		Role string `json:"role"`
	}
	if !decodeBody(w, r, &body) {
		return
	}
	s.answerUsers(w, r, s.setRole(r.Context(), actor.ID, r.PathValue("uid"), body.Role))
}

// apiSetUserDisabled: body {"disabled": true | false}. Answers with the refreshed user list.
func (s *server) apiSetUserDisabled(w http.ResponseWriter, r *http.Request, actor sessionUser) {
	var body struct {
		Disabled bool `json:"disabled"`
	}
	if !decodeBody(w, r, &body) {
		return
	}
	s.answerUsers(w, r, s.setBlocked(r.Context(), actor.ID, r.PathValue("uid"), body.Disabled))
}

// answerUsers writes the user list after a change, or the error of the change.
func (s *server) answerUsers(w http.ResponseWriter, r *http.Request, actionErr error) {
	if actionErr != nil {
		var ue userError
		switch {
		case errors.Is(actionErr, errNoSuchUser):
			writeJSONError(w, http.StatusNotFound, actionErr.Error())
		case errors.As(actionErr, &ue):
			writeJSONError(w, http.StatusBadRequest, ue.Error())
		default:
			log.Printf("admin action: %v", actionErr)
			writeJSONError(w, http.StatusInternalServerError, "interner Fehler")
		}
		return
	}
	s.apiListUsers(w, r, sessionUser{})
}

// decodeBody reads a small JSON body. On failure it has already written the 400 response.
func decodeBody(w http.ResponseWriter, r *http.Request, v any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 4<<10)
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		writeJSONError(w, http.StatusBadRequest, "ungültige Anfrage")
		return false
	}
	return true
}
