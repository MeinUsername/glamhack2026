package app

import (
	"bytes"
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

// AC-002-7: without a session, the endpoints answer 401 before any Firestore or bucket access.
// The server has no clients, so reaching them would panic.
func TestAC002_7_IdeaEndpointsRequireSignIn(t *testing.T) {
	s := &server{mux: http.NewServeMux()}
	s.routes()
	cases := []struct{ method, path string }{
		{"POST", "/api/ideas"},
		{"GET", "/api/ideas"},
		{"GET", "/api/ideas/abc"},
		{"GET", "/api/ideas/abc/images/0"},
		{"GET", "/api/equipment?q=bea"},
	}
	for _, c := range cases {
		rec := httptest.NewRecorder()
		s.mux.ServeHTTP(rec, httptest.NewRequest(c.method, c.path, nil))
		if rec.Code != http.StatusUnauthorized {
			t.Errorf("%s %s: status %d, want 401", c.method, c.path, rec.Code)
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
