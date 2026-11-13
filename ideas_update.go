package app

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"

	"cloud.google.com/go/firestore"
)

// F-012 T6: an idea can be edited without login (Q-012-13). The form is the same as for
// creating, plus keepImages: the 0-based indices of the existing images that stay.

var errBadImageRef = userError("Ein Bild kann nicht zugeordnet werden.")

// selectKeptImages splits the stored images into the kept ones (in the order of keep)
// and the removed ones. An index that does not exist or is repeated is rejected.
func selectKeptImages(old []imageDoc, keep []int) (kept, removed []imageDoc, err error) {
	used := make(map[int]bool, len(keep))
	for _, i := range keep {
		if i < 0 || i >= len(old) || used[i] {
			return nil, nil, errBadImageRef
		}
		used[i] = true
		kept = append(kept, old[i])
	}
	for i, img := range old {
		if !used[i] {
			removed = append(removed, img)
		}
	}
	return kept, removed, nil
}

// apiUpdateIdea handles PUT /api/ideas/{id}. Answers {"id"}; 404 for an unknown ID.
func (s *server) apiUpdateIdea(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxIdeaBodyBytes)
	if err := r.ParseMultipartForm(maxIdeaBodyBytes); err != nil {
		var mbe *http.MaxBytesError
		if errors.As(err, &mbe) {
			writeJSONError(w, http.StatusRequestEntityTooLarge, "The request is too large.")
			return
		}
		writeJSONError(w, http.StatusBadRequest, "Invalid form.")
		return
	}

	var body struct {
		ideaInput
		KeepImages []int `json:"keepImages"`
	}
	if raw := r.FormValue("data"); raw != "" {
		if err := json.Unmarshal([]byte(raw), &body); err != nil {
			writeJSONError(w, http.StatusBadRequest, "Invalid data.")
			return
		}
	}
	doc, catalog, err := validateIdeaInput(body.ideaInput)
	if err != nil {
		writeUserError(w, err)
		return
	}
	newImages, err := readIdeaImages(r.MultipartForm)
	if err != nil {
		writeUserError(w, err)
		return
	}

	ctx := r.Context()
	id := r.PathValue("id")
	ref := s.db.Collection("ideas").Doc(id)
	snap, err := ref.Get(ctx)
	if isNotFound(err) {
		writeJSONError(w, http.StatusNotFound, "idea not found")
		return
	}
	if err != nil {
		log.Printf("update idea get: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "internal error")
		return
	}
	var old ideaDoc
	if err := snap.DataTo(&old); err != nil {
		log.Printf("update idea decode %s: %v", id, err)
		writeJSONError(w, http.StatusInternalServerError, "internal error")
		return
	}

	kept, removed, err := selectKeptImages(old.Images, body.KeepImages)
	if err != nil {
		writeUserError(w, err)
		return
	}
	if len(kept)+len(newImages) > maxIdeaImages {
		writeUserError(w, userError(fmt.Sprintf("At most %d images can be uploaded.", maxIdeaImages)))
		return
	}

	stored, err := s.storeIdeaImages(ctx, id, newImages)
	if err != nil {
		log.Printf("update idea images: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "internal error")
		return
	}
	doc.Images = append(kept, stored...)
	doc.CreatedBy = old.CreatedBy // unchanged on edit
	doc.CreatedAt = old.CreatedAt

	if err := s.writeIdea(ctx, ref, doc, catalog); err != nil {
		log.Printf("update idea: %v", err)
		s.deleteObjects(ctx, stored) // do not leave orphaned images
		writeJSONError(w, http.StatusInternalServerError, "internal error")
		return
	}
	s.deleteObjects(ctx, removed) // only after the new version is stored
	writeJSON(w, http.StatusOK, map[string]string{"id": id})
}

// writeIdea stores the idea and adds the equipment catalog entries that are still missing,
// in one transaction (all reads before the writes, as Firestore requires).
func (s *server) writeIdea(ctx context.Context, ref *firestore.DocumentRef, doc ideaDoc, catalog []equipmentDoc) error {
	return s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		var missing []equipmentDoc
		for _, e := range catalog {
			snap, err := tx.Get(s.db.Collection("equipment").Doc(e.NameKey))
			if err != nil && !isNotFound(err) {
				return err
			}
			if err != nil || !snap.Exists() {
				missing = append(missing, e)
			}
		}
		if err := tx.Set(ref, doc); err != nil {
			return err
		}
		for _, e := range missing {
			if err := tx.Set(s.db.Collection("equipment").Doc(e.NameKey), e); err != nil {
				return err
			}
		}
		return nil
	})
}
