package app

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// newRouteServer builds the route table without Firebase or Firestore clients.
// Requests without a session cookie never reach those clients.
func newRouteServer(t *testing.T) *server {
	t.Helper()
	s := &server{mux: http.NewServeMux()}
	s.routes() // panics on conflicting patterns
	return s
}

// AC-005-8: the page routes answer with the React page, and nothing is 404.
func TestAC005_8_PageRoutesServeReactIndex(t *testing.T) {
	s := newRouteServer(t)
	for _, path := range []string{"/", "/login", "/register"} {
		rec := httptest.NewRecorder()
		s.mux.ServeHTTP(rec, httptest.NewRequest("GET", path, nil))
		if rec.Code != http.StatusOK {
			t.Errorf("GET %s: status %d, want 200", path, rec.Code)
		}
		if !strings.Contains(rec.Body.String(), `<div id="root">`) {
			t.Errorf("GET %s: React index.html missing", path)
		}
	}
}

// AC-005-8: signed-out visitors are sent to the login page.
func TestAC005_8_DashboardWithoutSessionRedirectsToLogin(t *testing.T) {
	s := newRouteServer(t)
	for _, path := range []string{"/dashboard", "/admin/users"} {
		rec := httptest.NewRecorder()
		s.mux.ServeHTTP(rec, httptest.NewRequest("GET", path, nil))
		if rec.Code != http.StatusSeeOther || rec.Header().Get("Location") != "/login" {
			t.Errorf("GET %s: status %d location %q, want 303 to /login", path, rec.Code, rec.Header().Get("Location"))
		}
	}
}

// AC-005-8: the old Vue URL /app/ leads to the React page at /.
func TestAC005_8_OldAppURLRedirectsToRoot(t *testing.T) {
	s := newRouteServer(t)
	rec := httptest.NewRecorder()
	s.mux.ServeHTTP(rec, httptest.NewRequest("GET", "/app/", nil))
	if rec.Code != http.StatusSeeOther || rec.Header().Get("Location") != "/" {
		t.Errorf("GET /app/: status %d location %q, want 303 to /", rec.Code, rec.Header().Get("Location"))
	}
}

// AC-005-6: the admin JSON API refuses signed-out and non-admin requests.
func TestAC005_6_AdminAPIRejectsNonAdmin(t *testing.T) {
	called := false
	next := func(http.ResponseWriter, *http.Request, sessionUser) { called = true }

	cases := []struct {
		name    string
		resolve func(*http.Request) (sessionUser, bool)
		want    int
	}{
		{"signed out", func(*http.Request) (sessionUser, bool) { return sessionUser{}, false }, http.StatusUnauthorized},
		{"role user", func(*http.Request) (sessionUser, bool) { return sessionUser{ID: "u", Role: roleUser}, true }, http.StatusForbidden},
		{"empty role", func(*http.Request) (sessionUser, bool) { return sessionUser{ID: "u"}, true }, http.StatusForbidden},
	}
	for _, c := range cases {
		called = false
		rec := httptest.NewRecorder()
		guardAdmin(c.resolve, next).ServeHTTP(rec, httptest.NewRequest("POST", "/api/admin/users/x/role", strings.NewReader(`{"role":"admin"}`)))
		if rec.Code != c.want {
			t.Errorf("%s: status %d, want %d", c.name, rec.Code, c.want)
		}
		if called {
			t.Errorf("%s: handler must not run", c.name)
		}
		var body map[string]string
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil || body["error"] == "" {
			t.Errorf("%s: want JSON error body, got %q", c.name, rec.Body.String())
		}
	}

	// An admin passes through.
	called = false
	admin := func(*http.Request) (sessionUser, bool) { return sessionUser{ID: "a", Role: roleAdmin}, true }
	guardAdmin(admin, next).ServeHTTP(httptest.NewRecorder(), httptest.NewRequest("GET", "/api/admin/users", nil))
	if !called {
		t.Error("admin must reach the handler")
	}
}
