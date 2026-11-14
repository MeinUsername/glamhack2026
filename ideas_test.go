package app

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

var (
	pngHeader  = []byte("\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR")
	jpegHeader = []byte("\xff\xd8\xff\xe0\x00\x10JFIF\x00")
	webpHeader = []byte("RIFF\x24\x00\x00\x00WEBPVP8 ")
)

// AC-002-2: a form with empty fields is valid.
func TestAC002_2_EmptyIdeaIsValid(t *testing.T) {
	doc, catalog, err := validateIdeaInput(ideaInput{})
	if err != nil {
		t.Fatalf("empty input rejected: %v", err)
	}
	if doc.Budget != nil || doc.Space.AreaM2 != nil || doc.Space.VolumeM3 != nil || len(catalog) != 0 {
		t.Errorf("empty input should leave everything empty: %+v", doc)
	}
}

// AC-002-4: only S, M, L and XL are accepted for the budget.
func TestAC002_4_BudgetOnlyAcceptsSMLXL(t *testing.T) {
	for _, b := range []string{"S", "M", "L", "XL"} {
		doc, _, err := validateIdeaInput(ideaInput{Budget: b})
		if err != nil || doc.Budget == nil || *doc.Budget != b {
			t.Errorf("budget %q: doc %+v, err %v", b, doc.Budget, err)
		}
	}
	for _, b := range []string{"XXL", "s", "m", "0", "S M"} {
		if _, _, err := validateIdeaInput(ideaInput{Budget: b}); err == nil {
			t.Errorf("budget %q accepted, want rejection", b)
		}
	}
}

// AC-002-5: area and volume are stored as numbers, with comma or point as separator.
func TestAC002_5_SpaceIsStoredAsNumbers(t *testing.T) {
	in := ideaInput{}
	in.Space.AreaM2 = "2,5"
	in.Space.VolumeM3 = "12.25"
	doc, _, err := validateIdeaInput(in)
	if err != nil {
		t.Fatal(err)
	}
	if doc.Space.AreaM2 == nil || *doc.Space.AreaM2 != 2.5 {
		t.Errorf("area: %v, want 2.5", doc.Space.AreaM2)
	}
	if doc.Space.VolumeM3 == nil || *doc.Space.VolumeM3 != 12.25 {
		t.Errorf("volume: %v, want 12.25", doc.Space.VolumeM3)
	}

	for _, bad := range []string{"-1", "abc", "NaN", "Inf"} {
		in := ideaInput{}
		in.Space.AreaM2 = bad
		if _, _, err := validateIdeaInput(in); err == nil {
			t.Errorf("area %q accepted, want rejection", bad)
		}
	}
}

// AC-002-6: device names are trimmed and duplicates ignoring case are dropped.
func TestAC002_6_EquipmentDeduplicatesIgnoringCase(t *testing.T) {
	names, catalog, err := normalizeEquipment([]string{" Beamer ", "beamer", "", "Lautsprecher"})
	if err != nil {
		t.Fatal(err)
	}
	if len(names) != 2 || names[0] != "Beamer" || names[1] != "Lautsprecher" {
		t.Errorf("names = %q", names)
	}
	if len(catalog) != 2 || catalog[0].NameKey != "beamer" {
		t.Errorf("catalog = %+v", catalog)
	}
}

func TestEquipmentLimits(t *testing.T) {
	if _, _, err := normalizeEquipment([]string{strings.Repeat("x", maxDeviceRunes+1)}); err == nil {
		t.Error("device name over the limit accepted")
	}
	many := make([]string, maxDevicesPerIdea+1)
	for i := range many {
		many[i] = fmt.Sprintf("device %d", i)
	}
	if _, _, err := normalizeEquipment(many); err == nil {
		t.Error("more devices than the limit accepted")
	}
}

func TestTextLimit(t *testing.T) {
	if _, _, err := validateIdeaInput(ideaInput{Goal: strings.Repeat("ä", maxIdeaTextRunes+1)}); err == nil {
		t.Error("text over the rune limit accepted")
	}
}

// AC-002-3: only JPG, PNG and WebP, recognised by their content.
func TestAC002_3_ImageFormatIsCheckedByContent(t *testing.T) {
	ok := map[string][]byte{"image/png": pngHeader, "image/jpeg": jpegHeader, "image/webp": webpHeader}
	for want, data := range ok {
		got, _, err := checkImage(data)
		if err != nil || got != want {
			t.Errorf("%s: got %q, err %v", want, got, err)
		}
	}
	for name, data := range map[string][]byte{
		"gif":  []byte("GIF89a\x01\x00\x01\x00"),
		"pdf":  []byte("%PDF-1.4\n"),
		"text": []byte("hallo welt"),
	} {
		if _, _, err := checkImage(data); err == nil {
			t.Errorf("%s accepted, want rejection", name)
		}
	}
}

// AC-002-3: more than five images, or an image over 5 MB, is rejected before anything is stored.
func TestAC002_3_ImageCountAndSizeLimits(t *testing.T) {
	six := multipartWithFiles(t, "images", 6, pngHeader)
	if _, err := readIdeaImages(six); err == nil {
		t.Error("six images accepted")
	}

	big := append(append([]byte{}, pngHeader...), make([]byte, maxIdeaImageBytes)...)
	if _, err := readIdeaImages(multipartWithFiles(t, "images", 1, big)); err == nil {
		t.Error("image over 5 MB accepted")
	}

	five := multipartWithFiles(t, "images", 5, pngHeader)
	imgs, err := readIdeaImages(five)
	if err != nil || len(imgs) != 5 {
		t.Errorf("five images: %d, err %v", len(imgs), err)
	}
}

// AC-012-1 (replaces AC-002-7): without a session the idea endpoints do not answer 401 any more (F-012 D1).
// The test server has no Firestore client, so a request reaches the handler only up to the first
// database call, which panics here. A 401 would be written before that, so a 401 means the login check is back.
func TestAC012_1_IdeaEndpointsNeedNoSignIn(t *testing.T) {
	s := &server{mux: http.NewServeMux()}
	s.routes()
	cases := []struct{ method, path string }{
		{"GET", "/api/ideas"},
		{"GET", "/api/ideas/abc"},
		{"GET", "/api/ideas/abc/images/0"},
		{"GET", "/api/equipment?q=bea"},
	}
	for _, c := range cases {
		rec := httptest.NewRecorder()
		func() {
			defer func() { _ = recover() }() // the nil client panics after the login check
			s.mux.ServeHTTP(rec, httptest.NewRequest(c.method, c.path, nil))
		}()
		if rec.Code == http.StatusUnauthorized {
			t.Errorf("%s %s: status 401, want no login check", c.method, c.path)
		}
	}
}

// userError messages are the ones shown in the UI; other errors stay generic.
func TestWriteUserErrorHidesInternalErrors(t *testing.T) {
	rec := httptest.NewRecorder()
	writeUserError(rec, errors.New("firestore: secret detail"))
	if rec.Code != http.StatusInternalServerError || strings.Contains(rec.Body.String(), "secret") {
		t.Errorf("status %d body %q", rec.Code, rec.Body.String())
	}
}

// multipartWithFiles returns a parsed form with n files under the given field name.
func multipartWithFiles(t *testing.T, field string, n int, data []byte) *multipart.Form {
	t.Helper()
	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	for i := 0; i < n; i++ {
		fw, err := mw.CreateFormFile(field, "bild.png")
		if err != nil {
			t.Fatal(err)
		}
		if _, err := fw.Write(data); err != nil {
			t.Fatal(err)
		}
	}
	if err := mw.Close(); err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest("POST", "/api/ideas", &buf)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	if err := req.ParseMultipartForm(64 << 20); err != nil {
		t.Fatal(err)
	}
	return req.MultipartForm
}

// AC-009-1: no, one or several categories are valid, and the field is optional.
func TestAC009_1_CategoriesAreOptional(t *testing.T) {
	for _, in := range [][]string{nil, {}, {"affirmative"}, {"affirmative", "reproductive", "deconstructive", "transformation"}} {
		doc, _, err := validateIdeaInput(ideaInput{Categories: in})
		if err != nil {
			t.Errorf("categories %q rejected: %v", in, err)
		}
		if doc.Categories == nil {
			t.Errorf("categories %q: stored as nil, want empty list", in)
		}
	}
}

// AC-009-2: values outside the four keys are rejected; the match is case-sensitive.
func TestAC009_2_UnknownCategoryRejected(t *testing.T) {
	for _, bad := range []string{"Affirmative", "affimative", "", "all"} {
		if _, _, err := validateIdeaInput(ideaInput{Categories: []string{"affirmative", bad}}); err == nil {
			t.Errorf("category %q accepted, want rejection", bad)
		}
	}
}

// AC-009-3: a category sent twice is stored once, in the order of first occurrence.
func TestAC009_3_DuplicateCategoryStoredOnce(t *testing.T) {
	doc, _, err := validateIdeaInput(ideaInput{Categories: []string{"transformation", "affirmative", "transformation"}})
	if err != nil {
		t.Fatal(err)
	}
	if len(doc.Categories) != 2 || doc.Categories[0] != "transformation" || doc.Categories[1] != "affirmative" {
		t.Errorf("categories = %q", doc.Categories)
	}
}

// AC-009-6: a page without the field shows an empty list, never null.
func TestAC009_6_PageWithoutCategoriesIsEmptyList(t *testing.T) {
	v := toIdeaView("i1", ideaDoc{Title: "alt"})
	if v.Categories == nil || len(v.Categories) != 0 {
		t.Errorf("categories = %#v, want []", v.Categories)
	}
}

// AC-014-1, AC-014-4: the new text fields round-trip and keep inner line breaks.
func TestAC014_1_NewFieldsRoundTrip(t *testing.T) {
	in := ideaInput{
		TargetGroup:              " Schulklassen ",
		DescriptionOfInteraction: "Zeile 1\nZeile 2",
		StaffNeeded:              "yes",
		ExhibitRelated:           "no",
	}
	doc, _, err := validateIdeaInput(in)
	if err != nil {
		t.Fatal(err)
	}
	v := toIdeaView("x", doc)
	if v.TargetGroup != "Schulklassen" || v.DescriptionOfInteraction != "Zeile 1\nZeile 2" ||
		v.StaffNeeded != "yes" || v.ExhibitRelated != "no" {
		t.Errorf("view: %+v", v)
	}
}

// AC-014-2: target_group replaces audience; old documents stay readable.
func TestAC014_2_TargetGroupUnderNewKey(t *testing.T) {
	if v := toIdeaView("x", ideaDoc{LegacyAudience: "alt"}); v.TargetGroup != "alt" {
		t.Errorf("legacy fallback: %q", v.TargetGroup)
	}
	if v := toIdeaView("x", ideaDoc{TargetGroup: "neu", LegacyAudience: "alt"}); v.TargetGroup != "neu" {
		t.Errorf("target_group must win: %q", v.TargetGroup)
	}
}

// AC-014-3: non-numeric space values are rejected.
func TestAC014_3_SpaceNonNumericRejected(t *testing.T) {
	in := ideaInput{}
	in.Space.VolumeM3 = "viel"
	if _, _, err := validateIdeaInput(in); err == nil {
		t.Error("non-numeric volume accepted")
	}
}

// AC-014-4: the new text fields are limited to 5000 characters.
func TestAC014_4_NewTextFieldsLimit(t *testing.T) {
	long := strings.Repeat("a", maxIdeaTextRunes+1)
	for name, in := range map[string]ideaInput{
		"interaction": {DescriptionOfInteraction: long},
		"staff":       {StaffNeeded: long},
		"exhibit":     {ExhibitRelated: long},
		"targetGroup": {TargetGroup: long},
	} {
		if _, _, err := validateIdeaInput(in); err == nil {
			t.Errorf("%s: 5001 characters accepted", name)
		}
	}
}

// AC-014-6: the overview row carries id, title, imageCount and description only.
func TestAC014_6_SummaryFields(t *testing.T) {
	b, _ := json.Marshal(ideaSummary{})
	var m map[string]any
	_ = json.Unmarshal(b, &m)
	if len(m) != 4 {
		t.Errorf("summary keys: %v", m)
	}
	for _, k := range []string{"id", "title", "imageCount", "description"} {
		if _, ok := m[k]; !ok {
			t.Errorf("missing %q", k)
		}
	}
}

// AC-023-3, AC-023-6: the concept keeps inner line breaks, may exceed 5000 characters and is optional.
func TestAC023_ConceptIsKeptAndOptional(t *testing.T) {
	md := "# Titel\n\n- eins\n  - zwei\n\n```\ncode\n```"
	doc, _, err := validateIdeaInput(ideaInput{MediationConcept: "\n" + md + "\n"})
	if err != nil {
		t.Fatal(err)
	}
	if doc.MediationConcept != md {
		t.Errorf("concept = %q, want %q", doc.MediationConcept, md)
	}
	if _, _, err := validateIdeaInput(ideaInput{MediationConcept: strings.Repeat("ä", maxIdeaTextRunes+1)}); err != nil {
		t.Errorf("long concept rejected: %v", err)
	}
	if _, _, err := validateIdeaInput(ideaInput{MediationConcept: strings.Repeat("ä", maxConceptRunes+1)}); err == nil {
		t.Error("concept over the technical cap accepted")
	}
	if doc, _, err := validateIdeaInput(ideaInput{}); err != nil || doc.MediationConcept != "" {
		t.Errorf("empty concept: %v %q", err, doc.MediationConcept)
	}
	if v := toIdeaView("x", ideaDoc{MediationConcept: md}); v.MediationConcept != md {
		t.Errorf("view concept = %q", v.MediationConcept)
	}
	if v := toIdeaView("x", ideaDoc{}); v.MediationConcept != "" {
		t.Errorf("old idea concept = %q", v.MediationConcept)
	}
}

// AC-023-7: the overview row never carries the concept.
func TestAC023_7_SummaryHasNoConcept(t *testing.T) {
	b, _ := json.Marshal(ideaSummary{})
	if strings.Contains(string(b), "oncept") {
		t.Errorf("summary: %s", b)
	}
}

// AC-029-2: the version is the random part of the object name and changes with a new upload.
func TestAC029_ImageVersion(t *testing.T) {
	if got := imageVersion("ideas/x/abc123.png"); got != "abc123" {
		t.Errorf("version = %q", got)
	}
	old := toIdeaView("x", ideaDoc{Images: []imageDoc{{Object: "ideas/x/aaa.png"}, {Object: "ideas/x/bbb.jpg"}}})
	replaced := toIdeaView("x", ideaDoc{Images: []imageDoc{{Object: "ideas/x/bbb.jpg"}, {Object: "ideas/x/ccc.png"}}})
	if old.Images[0].Version == replaced.Images[0].Version {
		t.Error("replaced image at index 0 keeps its version")
	}
	if old.Images[1].Version != replaced.Images[0].Version {
		t.Error("an unchanged image changed its version")
	}
}

// AC-029-3..5: deselected images are removed, kept ones keep their order, none kept is allowed.
func TestAC029_SelectKept(t *testing.T) {
	old := []imageDoc{{Object: "a"}, {Object: "b"}, {Object: "c"}}
	kept, removed, err := selectKeptImages(old, []int{2})
	if err != nil || len(kept) != 1 || kept[0].Object != "c" || len(removed) != 2 {
		t.Fatalf("kept=%v removed=%v err=%v", kept, removed, err)
	}
	kept, removed, err = selectKeptImages(old, nil)
	if err != nil || len(kept) != 0 || len(removed) != 3 {
		t.Errorf("none kept: kept=%v removed=%v err=%v", kept, removed, err)
	}
}
