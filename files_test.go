package app

import (
	"bytes"
	"errors"
	"mime/multipart"
	"net/http/httptest"
	"strings"
	"testing"
)

func multipartBody(t *testing.T, filename string, size int) (*bytes.Buffer, string) {
	t.Helper()
	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	fw, err := mw.CreateFormFile("file", filename)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := fw.Write(bytes.Repeat([]byte("a"), size)); err != nil {
		t.Fatal(err)
	}
	if err := mw.Close(); err != nil {
		t.Fatal(err)
	}
	return &buf, mw.FormDataContentType()
}

// The size check runs before any bucket or Firestore access, so a zero server is enough.
func TestSaveUploadRejectsFilesOverOneMegabyte(t *testing.T) {
	body, ctype := multipartBody(t, "gross.bin", maxUploadBytes+1)
	req := httptest.NewRequest("POST", "/api/files", body)
	req.Header.Set("Content-Type", ctype)
	w := httptest.NewRecorder()

	s := &server{}
	_, _, err := s.saveUpload(w, req, "uid")
	if !errors.Is(err, errTooLarge) {
		t.Fatalf("expected errTooLarge, got %v", err)
	}
}

func TestSaveUploadRejectsEmptyFile(t *testing.T) {
	body, ctype := multipartBody(t, "leer.txt", 0)
	req := httptest.NewRequest("POST", "/api/files", body)
	req.Header.Set("Content-Type", ctype)
	w := httptest.NewRecorder()

	s := &server{}
	_, _, err := s.saveUpload(w, req, "uid")
	var ue userError
	if !errors.As(err, &ue) {
		t.Fatalf("expected user error for empty file, got %v", err)
	}
}

func TestSanitizeName(t *testing.T) {
	cases := map[string]string{
		"bild.png":           "bild.png",
		"../../etc/passwd":   "passwd",
		`C:\Users\x\doc.pdf`: "doc.pdf",
		"a\"b\nc.txt":        "abc.txt",
		"":                   "datei",
		".":                  "datei",
	}
	for in, want := range cases {
		if got := sanitizeName(in); got != want {
			t.Errorf("sanitizeName(%q) = %q, want %q", in, got, want)
		}
	}
	long := strings.Repeat("x", 300)
	if got := sanitizeName(long); len([]rune(got)) != maxNameRunes {
		t.Errorf("long name not truncated: %d runes", len([]rune(got)))
	}
}

func TestHumanSize(t *testing.T) {
	if got := humanSize(512); got != "512 B" {
		t.Errorf("humanSize(512) = %q", got)
	}
	if got := humanSize(2048); got != "2.0 KB" {
		t.Errorf("humanSize(2048) = %q", got)
	}
}
