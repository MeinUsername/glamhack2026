package app

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"
)

// checkedImage is an uploaded image that passed the format check.
type checkedImage struct {
	data        []byte
	contentType string
	ext         string
}

// checkImage detects the format from the file bytes (not from the name or the browser's
// Content-Type). Only JPEG, PNG and WebP are allowed.
func checkImage(data []byte) (contentType, ext string, err error) {
	switch detected := http.DetectContentType(data); {
	case detected == "image/jpeg":
		return detected, "jpg", nil
	case detected == "image/png":
		return detected, "png", nil
	case detected == "image/webp" || isWebP(data):
		// DetectContentType reports RIFF containers as "application/octet-stream" or
		// "image/webp" depending on the Go version, so the header is checked directly.
		return "image/webp", "webp", nil
	default:
		return "", "", userError("Images must be JPG, PNG or WebP.")
	}
}

// isWebP reports whether data starts with a RIFF/WEBP header.
func isWebP(data []byte) bool {
	return len(data) >= 12 && bytes.Equal(data[:4], []byte("RIFF")) && bytes.Equal(data[8:12], []byte("WEBP"))
}

// storeIdeaImages uploads the checked images to ideas/<id>/<random>.<ext>. If one upload
// fails, the ones already written are removed again.
func (s *server) storeIdeaImages(ctx context.Context, ideaID string, images []checkedImage) ([]imageDoc, error) {
	var stored []imageDoc
	for _, img := range images {
		object := fmt.Sprintf("ideas/%s/%s.%s", ideaID, randomHex(16), img.ext)
		wr := s.bucket.Object(object).NewWriter(ctx)
		wr.ContentType = img.contentType
		if _, err := wr.Write(img.data); err != nil {
			_ = wr.Close()
			s.deleteObjects(ctx, stored)
			return nil, fmt.Errorf("write image: %w", err)
		}
		if err := wr.Close(); err != nil {
			s.deleteObjects(ctx, stored)
			return nil, fmt.Errorf("close image: %w", err)
		}
		stored = append(stored, imageDoc{Object: object, ContentType: img.contentType, Size: int64(len(img.data))})
	}
	return stored, nil
}

// imageVersion is the random part of the object name (ideas/<id>/<random>.<ext>). It changes with every
// new upload, so the browser does not reuse a cached image at the same index (F-029).
func imageVersion(object string) string {
	name := object[strings.LastIndex(object, "/")+1:]
	if i := strings.LastIndex(name, "."); i > 0 {
		name = name[:i]
	}
	return name
}

// deleteObjects removes uploaded images after a failed save. Errors are logged only.
func (s *server) deleteObjects(ctx context.Context, images []imageDoc) {
	for _, img := range images {
		if err := s.bucket.Object(img.Object).Delete(ctx); err != nil {
			log.Printf("delete %s: %v", strings.TrimSpace(img.Object), err)
		}
	}
}
