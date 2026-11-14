package app

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"
	"time"
)

func f64(v float64) *float64 { return &v }
func str(v string) *string   { return &v }

// AC-025-8, AC-025-9: variables are checked per category.
func TestAC025_VariablesPerCategory(t *testing.T) {
	if err := checkFeedbackPromptText("Alle: {{allideas}} in {{ language }}"); err != nil {
		t.Errorf("feedback variables rejected: %v", err)
	}
	var unknown *unknownVariablesError
	err := checkFeedbackPromptText("{{ideas}} und {{foo}}")
	if !errors.As(err, &unknown) || !reflect.DeepEqual(unknown.names, []string{"ideas", "foo"}) {
		t.Errorf("feedback with {{ideas}}: %v", err)
	}
	err = checkMasterPromptText("{{allideas}}")
	if !errors.As(err, &unknown) || !reflect.DeepEqual(unknown.names, []string{"allideas"}) {
		t.Errorf("master prompt with {{allideas}}: %v", err)
	}
	if err := checkMasterPromptText("{{ideas}} {{language}}"); err != nil {
		t.Errorf("master prompt changed: %v", err)
	}
}

func TestFeedbackPromptInputLimits(t *testing.T) {
	ok := feedbackPromptInput{Title: " Feedback ", Description: " d ", Text: "{{allideas}}"}
	got, err := checkFeedbackPromptInput(ok)
	if err != nil || got.Title != "Feedback" || got.Description != "d" {
		t.Fatalf("got %+v, %v", got, err)
	}
	bad := []feedbackPromptInput{
		{Title: "", Text: "x"},
		{Title: strings.Repeat("a", maxLevelTitleRunes+1), Text: "x"},
		{Title: "t", Description: strings.Repeat("a", maxLevelDescRunes+1), Text: "x"},
		{Title: "t", Text: "  "},
		{Title: "t", Text: strings.Repeat("ä", maxFeedbackPromptRunes+1)},
	}
	for i, in := range bad {
		if _, err := checkFeedbackPromptInput(in); err == nil {
			t.Errorf("case %d accepted", i)
		}
	}
}

// AC-025-6, AC-025-7: same format as the browser, no ideas without {{allideas}}.
func TestAC025_RenderFeedbackPrompt(t *testing.T) {
	a := ideaDoc{Title: "Lichtkabine", Description: "Eine Kabine aus Licht.", TargetGroup: "Schulklassen", Accessibility: "Rollstuhlgerecht",
		Space: spaceDoc{AreaM2: f64(2.5)}, Equipment: []string{"Beamer", "Lautsprecher"}, Budget: str("M")}
	b := ideaDoc{Title: "Zweite", MediationConcept: "  ## Ablauf  "}
	want := "### Lichtkabine\n- Beschreibung: Eine Kabine aus Licht.\n- Zielgruppe: Schulklassen\n- Barrierefreiheit: Rollstuhlgerecht\n- Fläche: 2,5 m²\n- Ausstattung: Beamer, Lautsprecher\n- Budget: M\n\n### Zweite\n\n#### Mediation Concept\n## Ablauf"
	if got := renderFeedbackPrompt("{{allideas}}", []ideaDoc{a, b}, "de"); got != want {
		t.Errorf("allideas =\n%s\nwant\n%s", got, want)
	}
	if got := renderFeedbackPrompt("Sprache: {{language}}", nil, "fr-CH"); got != "Sprache: fr (Französisch)" {
		t.Errorf("language = %q", got)
	}
	if got := renderFeedbackPrompt("{{language}}", nil, "xx"); got != "en (Englisch)" {
		t.Errorf("unknown language = %q", got)
	}
	// without {{allideas}} nothing of the ideas appears, other {{…}} stay
	if got := renderFeedbackPrompt("Feedback {{foo}} {{language}}", []ideaDoc{a}, "de"); got != "Feedback {{foo}} de (Deutsch)" || strings.Contains(got, "Lichtkabine") {
		t.Errorf("without allideas = %q", got)
	}
	// text inside an idea is not replaced again
	tricky := ideaDoc{Title: "{{language}}", Description: "{{allideas}}"}
	if got := renderFeedbackPrompt("{{allideas}}", []ideaDoc{tricky}, "de"); !strings.Contains(got, "### {{language}}") || !strings.Contains(got, "- Beschreibung: {{allideas}}") {
		t.Errorf("idea text was replaced: %q", got)
	}
	if got := renderFeedbackPrompt("[{{allideas}}]", nil, "de"); got != "[]" {
		t.Errorf("empty stock = %q", got)
	}
	// the legacy audience field counts as target group
	if got := formatIdeaText(ideaDoc{Title: "x", LegacyAudience: "Alt"}); !strings.Contains(got, "- Zielgruppe: Alt") {
		t.Errorf("legacy audience: %q", got)
	}
}

// AC-025-2: the download carries a dated file name.
func TestFeedbackFileName(t *testing.T) {
	d := time.Date(2026, 11, 14, 0, 0, 0, 0, time.UTC)
	if got := feedbackFileName("Feedback: Öffentlich & Nett!", d); got != "feedback-prompt-feedback-oeffentlich-nett-2026-11-14.md" {
		t.Errorf("name = %q", got)
	}
	if got := feedbackFileName("???", d); got != "feedback-prompt-prompt-2026-11-14.md" {
		t.Errorf("name = %q", got)
	}
}

// AC-025-1, AC-025-4: the public routes need no session, the admin routes need an admin.
func TestAC025_FeedbackRoutesGuards(t *testing.T) {
	s := &server{mux: http.NewServeMux()}
	s.routes()
	for _, tc := range []struct{ method, path string }{
		{"GET", "/api/admin/feedback-prompts"},
		{"POST", "/api/admin/feedback-prompts"},
		{"PUT", "/api/admin/feedback-prompts/order"},
		{"PUT", "/api/admin/feedback-prompts/x"},
		{"DELETE", "/api/admin/feedback-prompts/x"},
	} {
		rec := httptest.NewRecorder()
		s.mux.ServeHTTP(rec, httptest.NewRequest(tc.method, tc.path, nil))
		if rec.Code != http.StatusUnauthorized && rec.Code != http.StatusForbidden {
			t.Errorf("%s %s without session: status %d", tc.method, tc.path, rec.Code)
		}
	}
}
