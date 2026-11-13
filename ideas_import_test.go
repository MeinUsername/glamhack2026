package app

import (
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

func startRows(t *testing.T) []importRow {
	t.Helper()
	f, err := os.Open("testdata/ideen-start.csv")
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	rows, err := parseIdeaCSV(f)
	if err != nil {
		t.Fatal(err)
	}
	return rows
}

func TestAC015_1_PreviewCounts(t *testing.T) {
	_, res := classifyImport(startRows(t), map[string]bool{})
	if res.New != 18 || res.Skipped != 0 || res.Invalid != 0 {
		t.Errorf("counts: %+v, want 18/0/0", res)
	}
}

func TestAC015_2_MapsColumnsAndLeavesSpaceEmpty(t *testing.T) {
	rows := startRows(t)
	d := rows[0].doc
	if d.Title != "E-ink" || d.TargetGroup != "general literate visitors" || d.StaffNeeded != "no" ||
		d.ExhibitRelated != "no" || d.Goal == "" || d.DescriptionOfInteraction == "" {
		t.Errorf("row 1: %+v", d)
	}
	if d.Space.AreaM2 != nil || d.Space.VolumeM3 != nil {
		t.Errorf("space must stay empty: %+v", d.Space)
	}
	if rows[2].Title != `"Am I the only one?" counter` {
		t.Errorf("quoted title: %q", rows[2].Title)
	}
}

func TestAC015_3_DuplicateIgnoresCaseAndRepeatsInFile(t *testing.T) {
	csv := "Title\nE-ink\nPostcards\npostcards\n"
	rows, err := parseIdeaCSV(strings.NewReader(csv))
	if err != nil {
		t.Fatal(err)
	}
	out, res := classifyImport(rows, map[string]bool{"e-ink": true})
	if res.New != 1 || res.Skipped != 2 || out[0].Status != importSkipped || out[1].Status != importNew || out[2].Status != importSkipped {
		t.Errorf("result: %+v %v", res, out)
	}
	if len(res.Rows) != 2 || res.Rows[0].Line != 2 {
		t.Errorf("messages: %+v", res.Rows)
	}
}

func TestAC015_4_MissingTitleRejectsOnlyThatRow(t *testing.T) {
	rows, err := parseIdeaCSV(strings.NewReader("Title,goal\nA,x\n,y\n  ,z\nB,w\n"))
	if err != nil {
		t.Fatal(err)
	}
	_, res := classifyImport(rows, map[string]bool{})
	if res.New != 2 || res.Invalid != 2 || res.Rows[0].Line != 3 {
		t.Errorf("result: %+v", res)
	}
	if _, err := parseIdeaCSV(strings.NewReader("goal\nx\n")); err == nil {
		t.Error("file without Title column accepted")
	}
}

func TestAC015_5_NonAdminIsRejected(t *testing.T) {
	called := false
	h := guardAdmin(func(*http.Request) (sessionUser, bool) {
		return sessionUser{Role: roleUser}, true
	}, func(http.ResponseWriter, *http.Request, sessionUser) { called = true })
	w := httptest.NewRecorder()
	h(w, httptest.NewRequest("POST", "/api/admin/import/ideas", nil))
	if w.Code != http.StatusForbidden || called {
		t.Errorf("status %d, called %v", w.Code, called)
	}
}

func TestAC015_6_EquipmentChips(t *testing.T) {
	rows := startRows(t)
	got := rows[0].doc.Equipment
	if len(got) != 2 || got[0] != "e-ink device" || got[1] != "wiring" {
		t.Errorf("equipment: %q", got)
	}
}

func TestAC015_7_NoSustainabilityBudgetCategoriesOrImages(t *testing.T) {
	for _, r := range startRows(t) {
		d := r.doc
		if d.Sustainability != "" || d.Budget != nil || len(d.Categories) != 0 || len(d.Images) != 0 {
			t.Fatalf("row %d has extra fields: %+v", r.Line, d)
		}
	}
}

func TestParseIdeaCSVAcceptsBOMAndCaseInsensitiveHeader(t *testing.T) {
	rows, err := parseIdeaCSV(strings.NewReader("\xef\xbb\xbf TITLE ,Goal\nA,b\n"))
	if err != nil || len(rows) != 1 || rows[0].doc.Goal != "b" {
		t.Errorf("rows %+v err %v", rows, err)
	}
}
