package app

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

// F-008: the master prompt is stored as numbered versions. Only the variables
// {{ideas}} and {{language}} are known; the browser renders them (F-003).

const (
	masterPromptCollection = "master_prompt_versions"
	maxMasterPromptRunes   = 20000
	maxMasterPromptBody    = 64 << 10
)

// allowedVariables are the only names the prompt may use (D1).
var allowedVariables = map[string]bool{"ideas": true, "language": true}

var variablePattern = regexp.MustCompile(`\{\{([^{}]*)\}\}`)

var errNoSuchVersion = userError("Diese Version gibt es nicht.")

// unknownVariablesError names the variables the server does not know (AC-008-5).
type unknownVariablesError struct {
	names []string
}

func (e *unknownVariablesError) Error() string {
	return "unbekannte Variablen: " + strings.Join(e.names, ", ")
}

// promptVersionDoc is one stored version. The document ID is the zero-padded number.
type promptVersionDoc struct {
	Number      int       `firestore:"number"`
	Text        string    `firestore:"text"`
	AuthorID    string    `firestore:"author_id"`
	AuthorEmail string    `firestore:"author_email"`
	CreatedAt   time.Time `firestore:"created_at"`
}

// promptVersionView is a version as the admin page shows it.
type promptVersionView struct {
	Number      int       `json:"number"`
	Text        string    `json:"text"`
	AuthorEmail string    `json:"authorEmail"`
	CreatedAt   time.Time `json:"createdAt"`
}

// findVariables returns the names used in {{…}}, in order of appearance, without duplicates.
func findVariables(text string) []string {
	var names []string
	seen := map[string]bool{}
	for _, m := range variablePattern.FindAllStringSubmatch(text, -1) {
		name := strings.TrimSpace(m[1])
		if !seen[name] {
			seen[name] = true
			names = append(names, name)
		}
	}
	return names
}

// unknownVariables returns the names in the text that are not allowed.
func unknownVariables(text string) []string {
	var unknown []string
	for _, name := range findVariables(text) {
		if !allowedVariables[name] {
			unknown = append(unknown, name)
		}
	}
	return unknown
}

// checkMasterPromptText rejects empty or too long texts and unknown variables.
func checkMasterPromptText(text string) error {
	if strings.TrimSpace(text) == "" {
		return userError("Der Master-Prompt darf nicht leer sein.")
	}
	if utf8.RuneCountInString(text) > maxMasterPromptRunes {
		return userError("Der Master-Prompt ist zu lang.")
	}
	if unknown := unknownVariables(text); len(unknown) > 0 {
		return &unknownVariablesError{names: unknown}
	}
	return nil
}

// versionDocID returns the document ID for a version number (zero-padded, so IDs sort by number).
func versionDocID(number int) string {
	return fmt.Sprintf("%06d", number)
}

// planAppend decides what a save or restore does, given the latest version (nil if none).
// Same text as the latest version: no new version (AC-008-4). Otherwise the next number.
func planAppend(latest *promptVersionDoc, text string) (number int, create bool) {
	if latest == nil {
		return 1, true
	}
	if latest.Text == text {
		return latest.Number, false
	}
	return latest.Number + 1, true
}

// latestPromptVersion reads the version with the highest number. Nil means there is none.
func (s *server) latestPromptVersion(ctx context.Context, tx *firestore.Transaction) (*promptVersionDoc, error) {
	q := s.db.Collection(masterPromptCollection).OrderBy("number", firestore.Desc).Limit(1)
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

// currentMasterPrompt returns the newest version. The bool is false if there is none.
func (s *server) currentMasterPrompt(ctx context.Context) (promptVersionDoc, bool, error) {
	latest, err := s.latestPromptVersion(ctx, nil)
	if err != nil || latest == nil {
		return promptVersionDoc{}, false, err
	}
	return *latest, true, nil
}

// listMasterPromptVersions returns all versions, newest first.
func (s *server) listMasterPromptVersions(ctx context.Context) ([]promptVersionDoc, error) {
	it := s.db.Collection(masterPromptCollection).OrderBy("number", firestore.Desc).Documents(ctx)
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

// appendVersion stores the text returned by source as a new version, unless it equals the
// latest one. Reading and writing happen in one transaction, so two saves never share a number.
func (s *server) appendVersion(ctx context.Context, actor sessionUser, source func(*firestore.Transaction) (string, error)) (int, bool, error) {
	var number int
	var created bool
	err := s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		latest, err := s.latestPromptVersion(ctx, tx)
		if err != nil {
			return err
		}
		text, err := source(tx)
		if err != nil {
			return err
		}
		number, created = planAppend(latest, text)
		if !created {
			return nil
		}
		doc := promptVersionDoc{
			Number:      number,
			Text:        text,
			AuthorID:    actor.ID,
			AuthorEmail: actor.Email,
			CreatedAt:   time.Now().UTC(),
		}
		return tx.Set(s.db.Collection(masterPromptCollection).Doc(versionDocID(number)), doc)
	})
	return number, created, err
}

// saveMasterPrompt stores a new version with the given text (AC-008-1, AC-008-4, AC-008-5).
func (s *server) saveMasterPrompt(ctx context.Context, actor sessionUser, text string) (int, bool, error) {
	if err := checkMasterPromptText(text); err != nil {
		return 0, false, err
	}
	return s.appendVersion(ctx, actor, func(*firestore.Transaction) (string, error) { return text, nil })
}

// restoreMasterPrompt copies the text of version n into a new version (AC-008-3).
func (s *server) restoreMasterPrompt(ctx context.Context, actor sessionUser, n int) (int, bool, error) {
	return s.appendVersion(ctx, actor, func(tx *firestore.Transaction) (string, error) {
		snap, err := tx.Get(s.db.Collection(masterPromptCollection).Doc(versionDocID(n)))
		if isNotFound(err) {
			return "", errNoSuchVersion
		}
		if err != nil {
			return "", err
		}
		var d promptVersionDoc
		if err := snap.DataTo(&d); err != nil {
			return "", err
		}
		return d.Text, nil
	})
}

// apiCurrentMasterPrompt: GET /api/master-prompt, for every signed-in role (Q-008-13).
func (s *server) apiCurrentMasterPrompt(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	d, ok, err := s.currentMasterPrompt(r.Context())
	if err != nil {
		log.Printf("current master prompt: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "interner Fehler")
		return
	}
	if !ok {
		writeJSONError(w, http.StatusNotFound, "Es gibt noch keinen Master-Prompt.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"version": d.Number, "text": d.Text, "createdAt": d.CreatedAt})
}

// apiAdminMasterPrompt: GET /api/admin/master-prompt. Answers with the newest text and all versions.
func (s *server) apiAdminMasterPrompt(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	versions, err := s.listMasterPromptVersions(r.Context())
	if err != nil {
		log.Printf("list master prompt: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "interner Fehler")
		return
	}
	views := make([]promptVersionView, 0, len(versions))
	for _, d := range versions {
		views = append(views, promptVersionView{Number: d.Number, Text: d.Text, AuthorEmail: d.AuthorEmail, CreatedAt: d.CreatedAt})
	}
	writeJSON(w, http.StatusOK, map[string]any{"versions": views})
}

// apiSaveMasterPrompt: body {"text": "..."}. Answers {version, created}; 400 with "unknown" for unknown variables.
func (s *server) apiSaveMasterPrompt(w http.ResponseWriter, r *http.Request, actor sessionUser) {
	var body struct {
		Text string `json:"text"`
	}
	r.Body = http.MaxBytesReader(w, r.Body, maxMasterPromptBody)
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSONError(w, http.StatusBadRequest, "ungültige Anfrage")
		return
	}
	number, created, err := s.saveMasterPrompt(r.Context(), actor, body.Text)
	s.answerVersion(w, number, created, err)
}

// apiRestoreMasterPrompt: POST /api/admin/master-prompt/versions/{n}/restore.
func (s *server) apiRestoreMasterPrompt(w http.ResponseWriter, r *http.Request, actor sessionUser) {
	n, err := strconv.Atoi(r.PathValue("n"))
	if err != nil || n < 1 {
		writeJSONError(w, http.StatusNotFound, errNoSuchVersion.Error())
		return
	}
	number, created, err := s.restoreMasterPrompt(r.Context(), actor, n)
	s.answerVersion(w, number, created, err)
}

// answerVersion writes the result of a save or restore.
func (s *server) answerVersion(w http.ResponseWriter, number int, created bool, err error) {
	var unknown *unknownVariablesError
	var user userError
	switch {
	case errors.As(err, &unknown):
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": unknown.Error(), "unknown": unknown.names})
	case errors.Is(err, errNoSuchVersion):
		writeJSONError(w, http.StatusNotFound, errNoSuchVersion.Error())
	case errors.As(err, &user):
		writeJSONError(w, http.StatusBadRequest, string(user))
	case err != nil:
		log.Printf("master prompt: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "interner Fehler")
	default:
		writeJSON(w, http.StatusOK, map[string]any{"version": number, "created": created})
	}
}
