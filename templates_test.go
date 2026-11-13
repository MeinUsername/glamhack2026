package app

import (
	"bytes"
	"html/template"
	"strings"
	"testing"
	"time"
)

// parsePages builds the same template sets as newServer does.
func parsePages(t *testing.T) map[string]*template.Template {
	t.Helper()
	pages := map[string]*template.Template{}
	for _, name := range []string{"home", "login", "register", "dashboard", "admin"} {
		tpl, err := template.ParseFS(templateFS,
			"templates/layout.html", "templates/partials.html", "templates/"+name+".html")
		if err != nil {
			t.Fatalf("template %s: %v", name, err)
		}
		pages[name] = tpl
	}
	return pages
}

// The admin page and the htmx fragments render with user data, errors and the invitation link.
func TestTemplatesRenderAdminAndInvitationFragments(t *testing.T) {
	pages := parsePages(t)
	users := []userView{
		{UID: "uid-a", Email: "admin@example.ch", Role: roleAdmin},
		{UID: "uid-b", Email: "blocked@example.ch", Role: roleUser, Disabled: true},
	}

	var buf bytes.Buffer
	if err := pages["admin"].ExecuteTemplate(&buf, "layout", pageData{User: "admin@example.ch", IsAdmin: true, Users: users}); err != nil {
		t.Fatalf("admin page: %v", err)
	}
	html := buf.String()
	for _, want := range []string{`href="/admin/users"`, `hx-post="/admin/users/uid-b/disabled"`, "gesperrt", "Entsperren"} {
		if !strings.Contains(html, want) {
			t.Errorf("admin page misses %q", want)
		}
	}

	buf.Reset()
	if err := pages["dashboard"].ExecuteTemplate(&buf, "usersSection", pageData{Error: "Der letzte aktive Admin kann nicht gesperrt werden.", Users: users}); err != nil {
		t.Fatalf("users section: %v", err)
	}
	if !strings.Contains(buf.String(), `class="error"`) {
		t.Error("users section must show the error")
	}

	buf.Reset()
	inv := &inviteView{Link: "https://example.run.app/register?invite=abc", ExpiresAt: time.Date(2026, 11, 20, 9, 0, 0, 0, time.UTC).Format("02.01.2006 15:04")}
	if err := pages["dashboard"].ExecuteTemplate(&buf, "inviteSection", pageData{Invite: inv}); err != nil {
		t.Fatalf("invite section: %v", err)
	}
	if !strings.Contains(buf.String(), "/register?invite=abc") {
		t.Error("invite section must show the link")
	}
}
