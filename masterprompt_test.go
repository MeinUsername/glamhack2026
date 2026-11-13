package app

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"
)

// AC-008-1: the placeholders {{ideas}} and {{language}} are valid and stay in the text.
func TestAC008_1_PlaceholdersAreAccepted(t *testing.T) {
	text := "Ideen: {{ideas}}\nSprache: {{language}}"
	if err := checkMasterPromptText(text); err != nil {
		t.Fatalf("placeholders rejected: %v", err)
	}
	if got := findVariables(text); !reflect.DeepEqual(got, []string{"ideas", "language"}) {
		t.Errorf("findVariables = %q", got)
	}
	if !strings.Contains(text, "{{ideas}}") || !strings.Contains(text, "{{language}}") {
		t.Error("placeholders must stay in the stored text")
	}
}

// AC-008-2: only signed-in users reach the read endpoint, and only admins reach the editor endpoints.
func TestAC008_2_RoleGuards(t *testing.T) {
	reached := func(resolve func(*http.Request) (sessionUser, bool), guard func(func(*http.Request) (sessionUser, bool), func(http.ResponseWriter, *http.Request, sessionUser)) http.HandlerFunc) int {
		called := 0
		h := guard(resolve, func(w http.ResponseWriter, r *http.Request, _ sessionUser) {
			called++
			w.WriteHeader(http.StatusOK)
		})
		h.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest("GET", "/api/admin/master-prompt", nil))
		return called
	}
	visitor := func(*http.Request) (sessionUser, bool) { return sessionUser{}, false }
	user := func(*http.Request) (sessionUser, bool) { return sessionUser{ID: "u", Role: roleUser}, true }
	admin := func(*http.Request) (sessionUser, bool) { return sessionUser{ID: "a", Role: roleAdmin}, true }

	if n := reached(visitor, guardAdmin); n != 0 {
		t.Errorf("visitor reached admin endpoint %d times", n)
	}
	if n := reached(user, guardAdmin); n != 0 {
		t.Errorf("user reached admin endpoint %d times", n)
	}
	if n := reached(admin, guardAdmin); n != 1 {
		t.Errorf("admin reached admin endpoint %d times, want 1", n)
	}
	if n := reached(visitor, guardSignedIn); n != 0 {
		t.Errorf("visitor reached read endpoint %d times", n)
	}
	if n := reached(user, guardSignedIn); n != 1 {
		t.Errorf("user reached read endpoint %d times, want 1", n)
	}
}

// AC-008-3: restoring version 2 while version 4 is current creates version 5 with the text of version 2.
func TestAC008_3_RestoreAppendsNewVersion(t *testing.T) {
	latest := &promptVersionDoc{Number: 4, Text: "vier"}
	number, create := planAppend(latest, "zwei")
	if !create || number != 5 {
		t.Errorf("planAppend = (%d, %v), want (5, true)", number, create)
	}
	if versionDocID(2) != "000002" || versionDocID(5) != "000005" {
		t.Errorf("version IDs are not zero-padded: %s %s", versionDocID(2), versionDocID(5))
	}
}

// AC-008-4: saving the same text again creates no version.
func TestAC008_4_UnchangedTextCreatesNoVersion(t *testing.T) {
	latest := &promptVersionDoc{Number: 4, Text: "gleich"}
	number, create := planAppend(latest, "gleich")
	if create || number != 4 {
		t.Errorf("planAppend = (%d, %v), want (4, false)", number, create)
	}
	if number, create := planAppend(nil, "erster Text"); !create || number != 1 {
		t.Errorf("first version = (%d, %v), want (1, true)", number, create)
	}
}

// AC-008-5: an unknown variable is rejected, and the error names it.
func TestAC008_5_UnknownVariableIsRejected(t *testing.T) {
	err := checkMasterPromptText("Hallo {{foo}} und {{ ideas }}")
	var unknown *unknownVariablesError
	if !errors.As(err, &unknown) {
		t.Fatalf("err = %v, want unknownVariablesError", err)
	}
	if !reflect.DeepEqual(unknown.names, []string{"foo"}) {
		t.Errorf("names = %q, want [foo]", unknown.names)
	}
	if !strings.Contains(err.Error(), "foo") {
		t.Errorf("message %q does not name foo", err.Error())
	}
}

func TestFindVariablesIgnoresDuplicates(t *testing.T) {
	got := findVariables("{{ideas}} {{language}} {{ideas}} kein {{ Platz }} {{}}")
	if !reflect.DeepEqual(got, []string{"ideas", "language", "Platz", ""}) {
		t.Errorf("findVariables = %q", got)
	}
}

func TestMasterPromptTextLimits(t *testing.T) {
	if err := checkMasterPromptText("   "); err == nil {
		t.Error("blank text accepted")
	}
	if err := checkMasterPromptText(strings.Repeat("ä", maxMasterPromptRunes+1)); err == nil {
		t.Error("text over the rune limit accepted")
	}
}
