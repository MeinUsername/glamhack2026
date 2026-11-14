package app

import (
	"encoding/json"
	"os"
	"reflect"
	"strings"
	"testing"
)

// AC-035-1: the IDs the server knows are exactly those of the JSON file (read here on its own), 15 categories and 3 locations today.
func TestAC035_1_IDsComeFromJSON(t *testing.T) {
	data, err := os.ReadFile("frontend/src/data/icom-filter-kategorien.json")
	if err != nil {
		t.Fatal(err)
	}
	var raw map[string]any
	if err := json.Unmarshal(data, &raw); err != nil {
		t.Fatal(err)
	}
	var cats, locs []string
	for _, g := range raw["filterGroups"].([]any) {
		for _, c := range g.(map[string]any)["categories"].([]any) {
			cats = append(cats, c.(map[string]any)["id"].(string))
		}
	}
	for _, sf := range raw["secondaryFilters"].([]any) {
		m := sf.(map[string]any)
		if m["id"] != "location" {
			continue
		}
		for _, o := range m["options"].([]any) {
			locs = append(locs, o.(map[string]any)["id"].(string))
		}
	}
	if !reflect.DeepEqual(cats, icomCategoryIDs) || !reflect.DeepEqual(locs, locationIDs) {
		t.Errorf("file %q %q, server %q %q", cats, locs, icomCategoryIDs, locationIDs)
	}
	if len(icomCategoryIDs) != 15 || !reflect.DeepEqual(locationIDs, []string{"onsite", "offsite", "online"}) {
		t.Errorf("regression: %d categories, locations %q", len(icomCategoryIDs), locationIDs)
	}
}

// AC-035-2: every category of the file is accepted when an idea is saved; an ID outside it is rejected with a message.
func TestAC035_2_EveryFileIDIsAccepted(t *testing.T) {
	for _, id := range icomCategoryIDs {
		if _, _, err := validateIdeaInput(ideaInput{ICOMCategories: []string{id}}); err != nil {
			t.Errorf("%q rejected: %v", id, err)
		}
	}
	_, _, err := validateIdeaInput(ideaInput{ICOMCategories: []string{"not-in-the-file"}})
	if err == nil || !strings.Contains(err.Error(), "not-in-the-file") {
		t.Errorf("err = %v, want a message naming the ID", err)
	}
}

// A broken file stops the start instead of rejecting every ID.
func TestMustLoadICOMIDsPanicsOnBrokenFile(t *testing.T) {
	for _, bad := range []string{`{`, `{}`, `{"filterGroups":[{"categories":[{"id":"a"},{"id":"a"}]}]}`} {
		func() {
			defer func() {
				if recover() == nil {
					t.Errorf("%q: no panic", bad)
				}
			}()
			mustLoadICOMIDs([]byte(bad))
		}()
	}
}

// Several categories and locations are stored, duplicates once, in the order of first occurrence.
func TestF024_ValidateStoresCategoriesAndLocations(t *testing.T) {
	doc, _, err := validateIdeaInput(ideaInput{
		ICOMCategories: []string{"accessibility", "dialogue-exchange", "accessibility"},
		Locations:      []string{"online", "onsite", "online"},
	})
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(doc.ICOMCategories, []string{"accessibility", "dialogue-exchange"}) {
		t.Errorf("categories = %q", doc.ICOMCategories)
	}
	if !reflect.DeepEqual(doc.Locations, []string{"online", "onsite"}) {
		t.Errorf("locations = %q", doc.Locations)
	}
}

func TestF024_FieldsAreOptional(t *testing.T) {
	doc, _, err := validateIdeaInput(ideaInput{})
	if err != nil {
		t.Fatal(err)
	}
	if doc.ICOMCategories == nil || len(doc.ICOMCategories) != 0 || doc.Locations == nil || len(doc.Locations) != 0 {
		t.Errorf("want empty lists, got %#v / %#v", doc.ICOMCategories, doc.Locations)
	}
}

func TestF024_UnknownIDsRejected(t *testing.T) {
	for _, in := range []ideaInput{
		{ICOMCategories: []string{"nope"}},
		{ICOMCategories: []string{"Accessibility"}}, // case-sensitive in the API
		{ICOMCategories: []string{"affirmative"}},   // F-009 key, not an ICOM category
		{Locations: []string{"moon"}},
	} {
		if _, _, err := validateIdeaInput(in); err == nil {
			t.Errorf("%+v accepted, want rejection", in)
		}
	}
}

// Pages saved before F-024 have no fields; the API answers empty lists.
func TestF024_OldPagesGiveEmptyLists(t *testing.T) {
	v := toIdeaView("x", ideaDoc{})
	if v.ICOMCategories == nil || v.Locations == nil {
		t.Errorf("view: %#v / %#v", v.ICOMCategories, v.Locations)
	}
	b, _ := json.Marshal(v)
	if !strings.Contains(string(b), `"icomCategories":[]`) || !strings.Contains(string(b), `"locations":[]`) {
		t.Errorf("json: %s", b)
	}
}

// The CSV import reads the optional columns; IDs are case-insensitive there, ";" and "," separate.
func TestF024_ImportColumns(t *testing.T) {
	csv := "Title,ICOM categories,Location\n" +
		"A,\"Accessibility; dialogue-exchange\",online\n" +
		"B,,\n" +
		"C,unknown-category,onsite\n" +
		"D,accessibility,\"onsite, offsite\"\n"
	rows, err := parseIdeaCSV(strings.NewReader(csv))
	if err != nil {
		t.Fatal(err)
	}
	if len(rows) != 4 {
		t.Fatalf("rows: %d", len(rows))
	}
	if d := rows[0].doc; !reflect.DeepEqual(d.ICOMCategories, []string{"accessibility", "dialogue-exchange"}) ||
		!reflect.DeepEqual(d.Locations, []string{"online"}) {
		t.Errorf("row A: %q / %q", d.ICOMCategories, d.Locations)
	}
	if d := rows[1].doc; rows[1].Status != importNew || len(d.ICOMCategories) != 0 || len(d.Locations) != 0 {
		t.Errorf("row B: %+v", rows[1])
	}
	if rows[2].Status != importInvalid || !strings.Contains(rows[2].Message, "unknown-category") {
		t.Errorf("row C: %+v", rows[2])
	}
	if d := rows[3].doc; !reflect.DeepEqual(d.Locations, []string{"onsite", "offsite"}) {
		t.Errorf("row D: %q", d.Locations)
	}
}

// The mapping for existing ideas is valid and covers exactly the start ideas of the CSV.
func TestF024_MappingCoversStartIdeas(t *testing.T) {
	list, err := ReadICOMAssignments("cmd/assign-icom/zuordnung.json")
	if err != nil {
		t.Fatal(err)
	}
	want := map[string]bool{}
	for _, r := range startRows(t) {
		want[titleKey(r.Title)] = true
	}
	got := map[string]bool{}
	for _, a := range list {
		got[titleKey(a.Title)] = true
		if len(a.ICOMCategories) == 0 || len(a.Locations) == 0 {
			t.Errorf("%q: categories or locations empty", a.Title)
		}
	}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("mapping titles differ from testdata/ideen-start.csv:\n got %v\nwant %v", got, want)
	}
}

func TestF024_MappingRejectsUnknownIDsAndDuplicates(t *testing.T) {
	for _, bad := range []string{
		`[{"title":"A","icomCategories":["nope"],"locations":[]}]`,
		`[{"title":"A","icomCategories":[],"locations":["moon"]}]`,
		`[{"title":"A"},{"title":" a "}]`,
		`[{"title":""}]`,
	} {
		if _, err := parseICOMAssignments([]byte(bad)); err == nil {
			t.Errorf("%s accepted", bad)
		}
	}
}
