package app

import (
	"context"
	"errors"
	"log"
	"net/http"
	"sort"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

// F-033: admins remove ideas softly. Only deleted_at is written; images and fields stay, so the idea can come back.

type trashRow struct {
	ID           string    `json:"id"`
	Title        string    `json:"title"`
	DeletedAt    time.Time `json:"deletedAt"`
	CoverVersion string    `json:"coverVersion,omitempty"`
}

// apiDeleteIdea: DELETE /api/ideas/{id}. 204; a second delete is 204 too, an unknown ID is 404 (AC-033-1, AC-033-12).
func (s *server) apiDeleteIdea(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	ref := s.db.Collection("ideas").Doc(r.PathValue("id"))
	err := s.db.RunTransaction(r.Context(), func(ctx context.Context, tx *firestore.Transaction) error {
		snap, err := tx.Get(ref)
		if err != nil {
			return err
		}
		var d ideaDoc
		if err := snap.DataTo(&d); err != nil {
			return err
		}
		if isDeleted(d) {
			return nil
		}
		return tx.Update(ref, []firestore.Update{{Path: "deleted_at", Value: time.Now().UTC()}})
	})
	switch {
	case isNotFound(err):
		writeJSONError(w, http.StatusNotFound, "idea not found")
	case err != nil:
		log.Printf("delete idea: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "internal error")
	default:
		w.WriteHeader(http.StatusNoContent)
	}
}

// apiTrash: GET /api/admin/trash, the removed ideas, latest removal first (AC-033-5).
func (s *server) apiTrash(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	it := s.db.Collection("ideas").Documents(r.Context())
	defer it.Stop()
	out := []trashRow{}
	for {
		snap, err := it.Next()
		if errors.Is(err, iterator.Done) {
			break
		}
		if err != nil {
			log.Printf("list trash: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "internal error")
			return
		}
		var d ideaDoc
		if err := snap.DataTo(&d); err != nil || !isDeleted(d) {
			continue
		}
		row := trashRow{ID: snap.Ref.ID, Title: d.Title, DeletedAt: *d.DeletedAt}
		if len(d.Images) > 0 {
			row.CoverVersion = imageVersion(d.Images[0].Object)
		}
		out = append(out, row)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].DeletedAt.After(out[j].DeletedAt) })
	writeJSON(w, http.StatusOK, out)
}

// apiRestoreIdea: POST /api/admin/trash/{id}/restore. 204; an idea that is not removed, or unknown, is 404 (AC-033-11).
func (s *server) apiRestoreIdea(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	ref := s.db.Collection("ideas").Doc(r.PathValue("id"))
	err := s.db.RunTransaction(r.Context(), func(ctx context.Context, tx *firestore.Transaction) error {
		snap, err := tx.Get(ref)
		if err != nil {
			return err
		}
		var d ideaDoc
		if err := snap.DataTo(&d); err != nil {
			return err
		}
		if !isDeleted(d) {
			return errNotInTrash
		}
		return tx.Update(ref, []firestore.Update{{Path: "deleted_at", Value: firestore.Delete}})
	})
	switch {
	case isNotFound(err), errors.Is(err, errNotInTrash):
		writeJSONError(w, http.StatusNotFound, "idea not found")
	case err != nil:
		log.Printf("restore idea: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "internal error")
	default:
		w.WriteHeader(http.StatusNoContent)
	}
}

var errNotInTrash = errors.New("idea is not in the trash")
