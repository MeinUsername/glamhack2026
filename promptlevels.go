package app

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

// F-018: several prompt levels (Detailgrade). Each has titles and descriptions per language,
// one prompt text, and its own numbered versions in prompt_levels/{id}/versions.

const (
	promptLevelsCollection = "prompt_levels"
	standardLevelID        = "standard" // the migrated F-008 prompt (D6)
	maxLevelTitleRunes     = 80
	maxLevelDescRunes      = 500
	maxLevelBody           = 96 << 10
)

// levelLanguages are the languages of titles and descriptions (F-007). English is required (D7).
var levelLanguages = map[string]bool{"de": true, "en": true, "fr": true, "it": true}

var errNoSuchLevel = userError("Diesen Detailgrad gibt es nicht.")

type promptLevelDoc struct {
	Titles       map[string]string `firestore:"titles"`
	Descriptions map[string]string `firestore:"descriptions"`
	Position     int               `firestore:"position"`
	CreatedAt    time.Time         `firestore:"created_at"`
}

// levelInput is the body of create and save.
type levelInput struct {
	Titles       map[string]string `json:"titles"`
	Descriptions map[string]string `json:"descriptions"`
	Text         string            `json:"text"`
}

// promptLevelView is a level as the API returns it. Versions are only set for admins.
type promptLevelView struct {
	ID           string              `json:"id"`
	Titles       map[string]string   `json:"titles"`
	Descriptions map[string]string   `json:"descriptions"`
	Text         string              `json:"text"`
	Version      int                 `json:"version"`
	Versions     []promptVersionView `json:"versions,omitempty"`
}

// cleanLocalized keeps only known languages with non-empty trimmed text and checks the length.
func cleanLocalized(in map[string]string, field string, maxRunes int) (map[string]string, error) {
	out := map[string]string{}
	for lang, v := range in {
		if !levelLanguages[lang] {
			return nil, userError(fmt.Sprintf("Unbekannte Sprache %q.", lang))
		}
		v = strings.TrimSpace(v)
		if v == "" {
			continue
		}
		if utf8.RuneCountInString(v) > maxRunes {
			return nil, userError(fmt.Sprintf("%s (%s) ist länger als %d Zeichen.", field, lang, maxRunes))
		}
		out[lang] = v
	}
	if out["en"] == "" {
		return nil, userError(field + " auf Englisch ist Pflicht.")
	}
	return out, nil
}

// checkLevelInput validates titles, descriptions and the prompt text (AC-018-1, AC-018-6).
func checkLevelInput(in levelInput) (levelInput, error) {
	titles, err := cleanLocalized(in.Titles, "Titel", maxLevelTitleRunes)
	if err != nil {
		return levelInput{}, err
	}
	descs, err := cleanLocalized(in.Descriptions, "Beschreibung", maxLevelDescRunes)
	if err != nil {
		return levelInput{}, err
	}
	if err := checkMasterPromptText(in.Text); err != nil {
		return levelInput{}, err
	}
	return levelInput{Titles: titles, Descriptions: descs, Text: in.Text}, nil
}

// planOrder checks that the requested order holds exactly the existing IDs, each once.
func planOrder(existing, requested []string) error {
	if len(existing) != len(requested) {
		return userError("Die Reihenfolge muss alle Detailgrade enthalten.")
	}
	want := map[string]bool{}
	for _, id := range existing {
		want[id] = true
	}
	for _, id := range requested {
		if !want[id] {
			return userError("Die Reihenfolge enthält einen unbekannten oder doppelten Detailgrad.")
		}
		delete(want, id)
	}
	return nil
}

// canDelete: the last remaining level stays (D8, AC-018-2).
func canDelete(count int) error {
	if count <= 1 {
		return userError("Der letzte Detailgrad kann nicht gelöscht werden.")
	}
	return nil
}

func (s *server) levelRef(id string) *firestore.DocumentRef {
	return s.db.Collection(promptLevelsCollection).Doc(id)
}

func (s *server) versionsOf(id string) *firestore.CollectionRef {
	return s.levelRef(id).Collection("versions")
}

// latestPromptVersion reads the highest version of a level. Nil means there is none.
func (s *server) latestPromptVersion(ctx context.Context, tx *firestore.Transaction, levelID string) (*promptVersionDoc, error) {
	q := s.versionsOf(levelID).OrderBy("number", firestore.Desc).Limit(1)
	var it *firestore.DocumentIterator
	if tx != nil {
		it = tx.Documents(q)
	} else {
		it = q.Documents(ctx)
	}
	defer it.Stop()
	snap, err := it.Next()
	if errors.Is(err, iterator.Done) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var d promptVersionDoc
	if err := snap.DataTo(&d); err != nil {
		return nil, err
	}
	return &d, nil
}

// listPromptVersions returns all versions of a level, newest first.
func (s *server) listPromptVersions(ctx context.Context, levelID string) ([]promptVersionDoc, error) {
	it := s.versionsOf(levelID).OrderBy("number", firestore.Desc).Documents(ctx)
	defer it.Stop()
	var out []promptVersionDoc
	for {
		snap, err := it.Next()
		if errors.Is(err, iterator.Done) {
			return out, nil
		}
		if err != nil {
			return nil, err
		}
		var d promptVersionDoc
		if err := snap.DataTo(&d); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
}

type levelEntry struct {
	id  string
	doc promptLevelDoc
}

// sortLevels orders by position, then by creation time.
func sortLevels(levels []levelEntry) {
	sort.SliceStable(levels, func(i, j int) bool {
		if levels[i].doc.Position != levels[j].doc.Position {
			return levels[i].doc.Position < levels[j].doc.Position
		}
		return levels[i].doc.CreatedAt.Before(levels[j].doc.CreatedAt)
	})
}

func readLevels(it *firestore.DocumentIterator) ([]levelEntry, error) {
	defer it.Stop()
	var out []levelEntry
	for {
		snap, err := it.Next()
		if errors.Is(err, iterator.Done) {
			sortLevels(out)
			return out, nil
		}
		if err != nil {
			return nil, err
		}
		var d promptLevelDoc
		if err := snap.DataTo(&d); err != nil {
			return nil, err
		}
		out = append(out, levelEntry{id: snap.Ref.ID, doc: d})
	}
}

// listPromptLevels returns the levels in order with their current text. withVersions adds all versions.
func (s *server) listPromptLevels(ctx context.Context, withVersions bool) ([]promptLevelView, error) {
	levels, err := readLevels(s.db.Collection(promptLevelsCollection).Documents(ctx))
	if err != nil {
		return nil, err
	}
	out := make([]promptLevelView, 0, len(levels))
	for _, l := range levels {
		v := promptLevelView{ID: l.id, Titles: l.doc.Titles, Descriptions: l.doc.Descriptions}
		if withVersions {
			versions, err := s.listPromptVersions(ctx, l.id)
			if err != nil {
				return nil, err
			}
			for _, d := range versions {
				v.Versions = append(v.Versions, promptVersionView{Number: d.Number, Text: d.Text, AuthorEmail: d.AuthorEmail, CreatedAt: d.CreatedAt})
			}
			if len(versions) > 0 {
				v.Text, v.Version = versions[0].Text, versions[0].Number
			}
		} else {
			latest, err := s.latestPromptVersion(ctx, nil, l.id)
			if err != nil {
				return nil, err
			}
			if latest != nil {
				v.Text, v.Version = latest.Text, latest.Number
			}
		}
		out = append(out, v)
	}
	return out, nil
}

func newVersionDoc(number int, text string, actor sessionUser) promptVersionDoc {
	return promptVersionDoc{Number: number, Text: text, AuthorID: actor.ID, AuthorEmail: actor.Email, CreatedAt: time.Now().UTC()}
}

// createPromptLevel stores a new level at the end of the list with version 1 (AC-018-1).
func (s *server) createPromptLevel(ctx context.Context, actor sessionUser, in levelInput) (string, error) {
	in, err := checkLevelInput(in)
	if err != nil {
		return "", err
	}
	ref := s.db.Collection(promptLevelsCollection).NewDoc()
	err = s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		levels, err := readLevels(tx.Documents(s.db.Collection(promptLevelsCollection)))
		if err != nil {
			return err
		}
		pos := 0
		for _, l := range levels {
			if l.doc.Position >= pos {
				pos = l.doc.Position + 1
			}
		}
		doc := promptLevelDoc{Titles: in.Titles, Descriptions: in.Descriptions, Position: pos, CreatedAt: time.Now().UTC()}
		if err := tx.Set(ref, doc); err != nil {
			return err
		}
		return tx.Set(ref.Collection("versions").Doc(versionDocID(1)), newVersionDoc(1, in.Text, actor))
	})
	return ref.ID, err
}

// savePromptLevel updates titles and descriptions and appends a version if the text changed.
func (s *server) savePromptLevel(ctx context.Context, actor sessionUser, id string, in levelInput) (int, bool, error) {
	in, err := checkLevelInput(in)
	if err != nil {
		return 0, false, err
	}
	var number int
	var created bool
	err = s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		if _, err := tx.Get(s.levelRef(id)); err != nil {
			if isNotFound(err) {
				return errNoSuchLevel
			}
			return err
		}
		latest, err := s.latestPromptVersion(ctx, tx, id)
		if err != nil {
			return err
		}
		number, created = planAppend(latest, in.Text)
		if err := tx.Update(s.levelRef(id), []firestore.Update{
			{Path: "titles", Value: in.Titles},
			{Path: "descriptions", Value: in.Descriptions},
		}); err != nil {
			return err
		}
		if !created {
			return nil
		}
		return tx.Set(s.versionsOf(id).Doc(versionDocID(number)), newVersionDoc(number, in.Text, actor))
	})
	return number, created, err
}

// restorePromptLevelVersion copies the text of version n into a new version; nothing is deleted (AC-018-3).
func (s *server) restorePromptLevelVersion(ctx context.Context, actor sessionUser, id string, n int) (int, bool, error) {
	var number int
	var created bool
	err := s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		if _, err := tx.Get(s.levelRef(id)); err != nil {
			if isNotFound(err) {
				return errNoSuchLevel
			}
			return err
		}
		latest, err := s.latestPromptVersion(ctx, tx, id)
		if err != nil {
			return err
		}
		snap, err := tx.Get(s.versionsOf(id).Doc(versionDocID(n)))
		if isNotFound(err) {
			return errNoSuchVersion
		}
		if err != nil {
			return err
		}
		var old promptVersionDoc
		if err := snap.DataTo(&old); err != nil {
			return err
		}
		number, created = planAppend(latest, old.Text)
		if !created {
			return nil
		}
		return tx.Set(s.versionsOf(id).Doc(versionDocID(number)), newVersionDoc(number, old.Text, actor))
	})
	return number, created, err
}

// deletePromptLevel removes a level with its versions; the last level is refused (AC-018-2).
func (s *server) deletePromptLevel(ctx context.Context, id string) error {
	return s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		levels, err := readLevels(tx.Documents(s.db.Collection(promptLevelsCollection)))
		if err != nil {
			return err
		}
		found := false
		for _, l := range levels {
			found = found || l.id == id
		}
		if !found {
			return errNoSuchLevel
		}
		if err := canDelete(len(levels)); err != nil {
			return err
		}
		it := tx.Documents(s.versionsOf(id))
		defer it.Stop()
		var refs []*firestore.DocumentRef
		for {
			snap, err := it.Next()
			if errors.Is(err, iterator.Done) {
				break
			}
			if err != nil {
				return err
			}
			refs = append(refs, snap.Ref)
		}
		for _, r := range refs {
			if err := tx.Delete(r); err != nil {
				return err
			}
		}
		return tx.Delete(s.levelRef(id))
	})
}

// reorderPromptLevels stores the positions given by the ID list (AC-018-2).
func (s *server) reorderPromptLevels(ctx context.Context, ids []string) error {
	return s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		levels, err := readLevels(tx.Documents(s.db.Collection(promptLevelsCollection)))
		if err != nil {
			return err
		}
		existing := make([]string, len(levels))
		for i, l := range levels {
			existing[i] = l.id
		}
		if err := planOrder(existing, ids); err != nil {
			return err
		}
		for i, id := range ids {
			if err := tx.Update(s.levelRef(id), []firestore.Update{{Path: "position", Value: i}}); err != nil {
				return err
			}
		}
		return nil
	})
}

// migrateMasterPrompt copies the F-008 versions into the level "standard" (D6, AC-018-7).
// It does nothing if any level exists. The level document is written last, so an
// interrupted run starts again at the next start. The old collection stays untouched.
func (s *server) migrateMasterPrompt(ctx context.Context) error {
	it := s.db.Collection(promptLevelsCollection).Limit(1).Documents(ctx)
	_, err := it.Next()
	it.Stop()
	if err == nil {
		return nil
	}
	if !errors.Is(err, iterator.Done) {
		return err
	}
	old := s.db.Collection(legacyMasterPromptCollection).Documents(ctx)
	defer old.Stop()
	batch := s.db.Batch()
	pending := 0
	for {
		snap, err := old.Next()
		if errors.Is(err, iterator.Done) {
			break
		}
		if err != nil {
			return err
		}
		batch.Set(s.versionsOf(standardLevelID).Doc(snap.Ref.ID), snap.Data())
		pending++
		if pending >= 400 {
			if _, err := batch.Commit(ctx); err != nil {
				return err
			}
			batch, pending = s.db.Batch(), 0
		}
	}
	if pending == 0 && !s.hasVersions(ctx, standardLevelID) {
		return nil // no old master prompt: the list stays empty until an admin adds a level
	}
	batch.Set(s.levelRef(standardLevelID), promptLevelDoc{
		Titles:       map[string]string{"en": "Standard", "de": "Standard"},
		Descriptions: map[string]string{"en": "Standard prompt"},
		Position:     0,
		CreatedAt:    time.Now().UTC(),
	})
	_, err = batch.Commit(ctx)
	return err
}

func (s *server) hasVersions(ctx context.Context, id string) bool {
	it := s.versionsOf(id).Limit(1).Documents(ctx)
	defer it.Stop()
	_, err := it.Next()
	return err == nil
}

// --- HTTP ---

func decodeLevelInput(w http.ResponseWriter, r *http.Request) (levelInput, bool) {
	var in levelInput
	r.Body = http.MaxBytesReader(w, r.Body, maxLevelBody)
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeJSONError(w, http.StatusBadRequest, "ungültige Anfrage")
		return in, false
	}
	return in, true
}

// apiPromptLevels: GET /api/prompt-levels, every signed-in role (D8).
func (s *server) apiPromptLevels(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	levels, err := s.listPromptLevels(r.Context(), false)
	if err != nil {
		log.Printf("list prompt levels: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "interner Fehler")
		return
	}
	writeJSON(w, http.StatusOK, levels)
}

// apiAdminPromptLevels: GET /api/admin/prompt-levels, with all versions.
func (s *server) apiAdminPromptLevels(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	levels, err := s.listPromptLevels(r.Context(), true)
	if err != nil {
		log.Printf("list prompt levels: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "interner Fehler")
		return
	}
	writeJSON(w, http.StatusOK, levels)
}

// apiCreatePromptLevel: POST /api/admin/prompt-levels.
func (s *server) apiCreatePromptLevel(w http.ResponseWriter, r *http.Request, actor sessionUser) {
	in, ok := decodeLevelInput(w, r)
	if !ok {
		return
	}
	id, err := s.createPromptLevel(r.Context(), actor, in)
	if err != nil {
		s.answerVersion(w, 0, false, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"id": id, "version": 1, "created": true})
}

// apiSavePromptLevel: PUT /api/admin/prompt-levels/{id}.
func (s *server) apiSavePromptLevel(w http.ResponseWriter, r *http.Request, actor sessionUser) {
	in, ok := decodeLevelInput(w, r)
	if !ok {
		return
	}
	number, created, err := s.savePromptLevel(r.Context(), actor, r.PathValue("id"), in)
	s.answerVersion(w, number, created, err)
}

// apiDeletePromptLevel: DELETE /api/admin/prompt-levels/{id}.
func (s *server) apiDeletePromptLevel(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	err := s.deletePromptLevel(r.Context(), r.PathValue("id"))
	if err != nil {
		s.answerVersion(w, 0, false, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

// apiReorderPromptLevels: PUT /api/admin/prompt-levels/order with {"ids": [...]}.
func (s *server) apiReorderPromptLevels(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	var body struct {
		IDs []string `json:"ids"`
	}
	r.Body = http.MaxBytesReader(w, r.Body, 16<<10)
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSONError(w, http.StatusBadRequest, "ungültige Anfrage")
		return
	}
	if err := s.reorderPromptLevels(r.Context(), body.IDs); err != nil {
		s.answerVersion(w, 0, false, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// apiRestorePromptLevel: POST /api/admin/prompt-levels/{id}/versions/{n}/restore.
func (s *server) apiRestorePromptLevel(w http.ResponseWriter, r *http.Request, actor sessionUser) {
	n, err := strconv.Atoi(r.PathValue("n"))
	if err != nil || n < 1 {
		writeJSONError(w, http.StatusNotFound, errNoSuchVersion.Error())
		return
	}
	number, created, err := s.restorePromptLevelVersion(r.Context(), actor, r.PathValue("id"), n)
	s.answerVersion(w, number, created, err)
}
