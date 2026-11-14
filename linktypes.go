package app

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"sort"
	"strings"
	"time"
	"unicode/utf8"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

// F-031: the types of links (Tools, Reference, Institutes, ...). Admins maintain them (D4).
// A link stores the type ID, so renaming a type changes every link at once.

const (
	linkTypesCollection = "link_types"
	maxLinkTypeName     = 60
)

var (
	errNoSuchLinkType = userError("Diesen Link-Typ gibt es nicht.")
	errLinkTypeInUse  = userError("Type is still used by an idea.")
)

// defaultLinkTypes are created once at the start if there is none (Q-031-27); fixed IDs keep a second start from doubling them.
var defaultLinkTypes = []struct{ id, name string }{
	{"tools", "Tools"}, {"reference", "Reference"}, {"institutes", "Institutes"},
}

type linkTypeDoc struct {
	Name      string    `firestore:"name"`
	CreatedAt time.Time `firestore:"created_at"`
}

type linkTypeView struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// checkLinkTypeName trims and checks a name; existing are the other names of the collection (case-insensitive unique).
func checkLinkTypeName(name string, existing []string) (string, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return "", userError("Der Name ist Pflicht.")
	}
	if utf8.RuneCountInString(name) > maxLinkTypeName {
		return "", userError(fmt.Sprintf("Der Name ist länger als %d Zeichen.", maxLinkTypeName))
	}
	for _, e := range existing {
		if strings.EqualFold(e, name) {
			return "", userError("Diesen Link-Typ gibt es schon.")
		}
	}
	return name, nil
}

// sortLinkTypes orders alphabetically, ignoring case (Q-031-23).
func sortLinkTypes(list []linkTypeView) {
	sort.SliceStable(list, func(i, j int) bool {
		return strings.ToLower(list[i].Name) < strings.ToLower(list[j].Name)
	})
}

func (s *server) linkTypeRef(id string) *firestore.DocumentRef {
	return s.db.Collection(linkTypesCollection).Doc(id)
}

func (s *server) listLinkTypes(ctx context.Context) ([]linkTypeView, error) {
	it := s.db.Collection(linkTypesCollection).Documents(ctx)
	defer it.Stop()
	out := []linkTypeView{}
	for {
		snap, err := it.Next()
		if errors.Is(err, iterator.Done) {
			sortLinkTypes(out)
			return out, nil
		}
		if err != nil {
			return nil, err
		}
		var d linkTypeDoc
		if err := snap.DataTo(&d); err != nil {
			return nil, err
		}
		out = append(out, linkTypeView{ID: snap.Ref.ID, Name: d.Name})
	}
}

// ensureDefaultLinkTypes creates the three default types if the collection is empty.
func (s *server) ensureDefaultLinkTypes(ctx context.Context) error {
	it := s.db.Collection(linkTypesCollection).Limit(1).Documents(ctx)
	_, err := it.Next()
	it.Stop()
	if err == nil {
		return nil
	}
	if !errors.Is(err, iterator.Done) {
		return err
	}
	batch := s.db.Batch()
	now := time.Now().UTC()
	for _, t := range defaultLinkTypes {
		batch.Set(s.linkTypeRef(t.id), linkTypeDoc{Name: t.name, CreatedAt: now})
	}
	_, err = batch.Commit(ctx)
	return err
}

// verifyLinkTypes rejects links whose type does not exist and fills the derived type IDs (AC-031-2).
func (s *server) verifyLinkTypes(ctx context.Context, doc *ideaDoc) error {
	if len(doc.Links) == 0 {
		return nil
	}
	types, err := s.listLinkTypes(ctx)
	if err != nil {
		return err
	}
	known := map[string]bool{}
	for _, t := range types {
		known[t.ID] = true
	}
	if id := unknownLinkType(doc.Links, known); id != "" {
		return userError("A link has an unknown type.")
	}
	return nil
}

func (s *server) createLinkType(ctx context.Context, name string) (string, error) {
	ref := s.db.Collection(linkTypesCollection).NewDoc()
	err := s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		existing, err := s.linkTypeNamesTx(tx)
		if err != nil {
			return err
		}
		clean, err := checkLinkTypeName(name, existing)
		if err != nil {
			return err
		}
		return tx.Set(ref, linkTypeDoc{Name: clean, CreatedAt: time.Now().UTC()})
	})
	return ref.ID, err
}

func (s *server) renameLinkType(ctx context.Context, id, name string) error {
	return s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		if _, err := tx.Get(s.linkTypeRef(id)); err != nil {
			if isNotFound(err) {
				return errNoSuchLinkType
			}
			return err
		}
		all, err := s.linkTypeNamesTx(tx, id)
		if err != nil {
			return err
		}
		clean, err := checkLinkTypeName(name, all)
		if err != nil {
			return err
		}
		return tx.Update(s.linkTypeRef(id), []firestore.Update{{Path: "name", Value: clean}})
	})
}

// linkTypeNamesTx returns the names of all types except skipID.
func (s *server) linkTypeNamesTx(tx *firestore.Transaction, skipID ...string) ([]string, error) {
	it := tx.Documents(s.db.Collection(linkTypesCollection))
	defer it.Stop()
	var names []string
	for {
		snap, err := it.Next()
		if errors.Is(err, iterator.Done) {
			return names, nil
		}
		if err != nil {
			return nil, err
		}
		if len(skipID) > 0 && snap.Ref.ID == skipID[0] {
			continue
		}
		var d linkTypeDoc
		if err := snap.DataTo(&d); err == nil {
			names = append(names, d.Name)
		}
	}
}

// deleteLinkType refuses a type that an idea still uses (AC-031-8).
func (s *server) deleteLinkType(ctx context.Context, id string) error {
	if _, err := s.linkTypeRef(id).Get(ctx); err != nil {
		if isNotFound(err) {
			return errNoSuchLinkType
		}
		return err
	}
	it := s.db.Collection("ideas").Where("link_type_ids", "array-contains", id).Limit(1).Documents(ctx)
	_, err := it.Next()
	it.Stop()
	if err == nil {
		return errLinkTypeInUse
	}
	if !errors.Is(err, iterator.Done) {
		return err
	}
	_, err = s.linkTypeRef(id).Delete(ctx)
	return err
}

// --- HTTP ---

func (s *server) answerLinkType(w http.ResponseWriter, status int, body any, err error) {
	var user userError
	switch {
	case errors.Is(err, errNoSuchLinkType):
		writeJSONError(w, http.StatusNotFound, errNoSuchLinkType.Error())
	case errors.Is(err, errLinkTypeInUse):
		writeJSONError(w, http.StatusConflict, errLinkTypeInUse.Error())
	case errors.As(err, &user):
		writeJSONError(w, http.StatusBadRequest, string(user))
	case err != nil:
		log.Printf("link type: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "interner Fehler")
	default:
		writeJSON(w, status, body)
	}
}

// apiLinkTypes: GET /api/link-types, public (the form and the detail page need it without login).
func (s *server) apiLinkTypes(w http.ResponseWriter, r *http.Request) {
	list, err := s.listLinkTypes(r.Context())
	s.answerLinkType(w, http.StatusOK, list, err)
}

func decodeLinkTypeName(w http.ResponseWriter, r *http.Request) (string, bool) {
	var body struct {
		Name string `json:"name"`
	}
	r.Body = http.MaxBytesReader(w, r.Body, 4<<10)
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSONError(w, http.StatusBadRequest, "ungültige Anfrage")
		return "", false
	}
	return body.Name, true
}

func (s *server) apiCreateLinkType(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	name, ok := decodeLinkTypeName(w, r)
	if !ok {
		return
	}
	id, err := s.createLinkType(r.Context(), name)
	s.answerLinkType(w, http.StatusCreated, map[string]string{"id": id}, err)
}

func (s *server) apiRenameLinkType(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	name, ok := decodeLinkTypeName(w, r)
	if !ok {
		return
	}
	err := s.renameLinkType(r.Context(), r.PathValue("id"), name)
	s.answerLinkType(w, http.StatusOK, map[string]bool{"ok": true}, err)
}

func (s *server) apiDeleteLinkType(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	err := s.deleteLinkType(r.Context(), r.PathValue("id"))
	s.answerLinkType(w, http.StatusOK, map[string]bool{"deleted": true}, err)
}
