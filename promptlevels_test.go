package app

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func validLevel() levelInput {
	return levelInput{
		Titles:       map[string]string{"en": " Short ", "de": "Kurz", "fr": "  "},
		Descriptions: map[string]string{"en": "A short prompt"},
		Text:         "Ideen: {{ideas}} in {{language}}",
	}
}

// AC-018-1: English title and description are required, other languages are optional.
func TestAC018_1_LevelInputNeedsEnglish(t *testing.T) {
	got, err := checkLevelInput(validLevel())
	if err != nil {
		t.Fatal(err)
	}
	if got.Titles["en"] != "Short" || got.Titles["de"] != "Kurz" {
		t.Errorf("titles: %v", got.Titles)
	}
	if _, ok := got.Titles["fr"]; ok {
		t.Error("empty optional language must be dropped")
	}
	for name, mod := range map[string]func(*levelInput){
		"no en title":  func(in *levelInput) { in.Titles = map[string]string{"de": "Kurz"} },
		"no en desc":   func(in *levelInput) { in.Descriptions = map[string]string{"de": "x"} },
		"empty text":   func(in *levelInput) { in.Text = "  " },
		"unknown lang": func(in *levelInput) { in.Titles["xx"] = "?" },
		"long title":   func(in *levelInput) { in.Titles["en"] = strings.Repeat("a", maxLevelTitleRunes+1) },
		"long desc":    func(in *levelInput) { in.Descriptions["en"] = strings.Repeat("a", maxLevelDescRunes+1) },
	} {
		in := validLevel()
		mod(&in)
		if _, err := checkLevelInput(in); err == nil {
			t.Errorf("%s accepted", name)
		}
	}
}

// AC-018-2: the order must hold exactly the existing IDs; the last level cannot be deleted.
func TestAC018_2_OrderAndDelete(t *testing.T) {
	if err := planOrder([]string{"a", "b"}, []string{"b", "a"}); err != nil {
		t.Errorf("valid order rejected: %v", err)
	}
	for _, bad := range [][]string{{"a"}, {"a", "a"}, {"a", "c"}, {"a", "b", "c"}} {
		if err := planOrder([]string{"a", "b"}, bad); err == nil {
			t.Errorf("order %v accepted", bad)
		}
	}
	if canDelete(1) == nil || canDelete(0) == nil {
		t.Error("last level may be deleted")
	}
	if err := canDelete(2); err != nil {
		t.Errorf("delete with two levels refused: %v", err)
	}
}

// AC-018-3: restoring appends a new version and keeps the old ones.
func TestAC018_3_RestoreAppends(t *testing.T) {
	number, create := planAppend(&promptVersionDoc{Number: 3, Text: "drei"}, "eins")
	if !create || number != 4 {
		t.Errorf("planAppend = (%d, %v), want (4, true)", number, create)
	}
}

// AC-018-6: every level uses the same variables.
func TestAC018_6_SameVariablesForAllLevels(t *testing.T) {
	in := validLevel()
	in.Text = "{{foo}}"
	if _, err := checkLevelInput(in); err == nil {
		t.Error("unknown variable accepted")
	}
}

// AC-018-4, AC-018-6: reading needs a login, editing needs an admin.
func TestAC018_Routes(t *testing.T) {
	s := &server{mux: http.NewServeMux()}
	s.routes()
	for _, c := range []struct {
		method, path string
		want         int
	}{
		{"GET", "/api/prompt-levels", http.StatusUnauthorized},
		{"GET", "/api/admin/prompt-levels", http.StatusUnauthorized},
		{"POST", "/api/admin/prompt-levels", http.StatusUnauthorized},
		{"PUT", "/api/admin/prompt-levels/order", http.StatusUnauthorized},
		{"PUT", "/api/admin/prompt-levels/x", http.StatusUnauthorized},
		{"DELETE", "/api/admin/prompt-levels/x", http.StatusUnauthorized},
		{"GET", "/api/master-prompt", http.StatusNotFound},
	} {
		rec := httptest.NewRecorder()
		s.mux.ServeHTTP(rec, httptest.NewRequest(c.method, c.path, nil))
		if rec.Code != c.want {
			t.Errorf("%s %s: %d, want %d", c.method, c.path, rec.Code, c.want)
		}
	}
}
