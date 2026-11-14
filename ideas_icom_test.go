package app

import (
	"encoding/json"
	"os"
	"reflect"
	"strings"
	"testing"
)

// The IDs in Go must match the JSON file the frontend uses for labels (F-024).
func TestF024_IDsMatchFrontendJSON(t *testing.T) {
	data, err := os.ReadFile("frontend/src/data/icom-filter-kategorien.json")
	if err != nil {
		t.Fatal(err)
	}
	var f struct {
		FilterGroups []struct {
			Categories []struct {
				ID string `json:"id"`
			} `json:"categories"`
		} `json:"filterGroups"`
		SecondaryFilters []struct {
			ID      string `json:"id"`
			Options []struct {
				ID string `json:"id"`
			} `json:"options"`
		} `json:"secondaryFilters"`
	}
	if err := json.Unmarshal(data, &f); err != nil {
		t.Fatal(err)
	}
	var cats []string
	for _, g := range f.FilterGroups {
		for _, c := range g.Categories {
			cats = append(cats, c.ID)
		}
	}
	if !reflect.DeepEqual(cats, icomCategoryIDs) {
		t.Errorf("categories in JSON %q, in Go %q", cats, icomCategoryIDs)
	}
	var locs []string
	for _, s := range f.SecondaryFilters {
		if s.ID != "location" {
			continue
		}
		for _, o := range s.Options {
			locs = append(locs, o.ID)
		}
	}
	if !reflect.DeepEqual(locs, locationIDs) {
		t.Errorf("locations in JSON %q, in Go %q", locs, locationIDs)
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
		{ICOMCategories: []string{"affirmative"}},  // F-009 key, not an ICOM category
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
