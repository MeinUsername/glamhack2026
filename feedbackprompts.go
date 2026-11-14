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

// F-025: feedback prompts. They are managed next to the master prompts (F-018) but are simpler:
// one title, one description, one text, no versions (D8). The list and the rendered text are public.

const (
	feedbackPromptsCollection = "feedback_prompts"
	maxFeedbackPromptRunes    = 20000
	maxFeedbackBody           = 96 << 10
	maxAllIdeas               = 1000 // protects the public render endpoint
)

var errNoSuchFeedbackPrompt = userError("Diesen Feedback-Prompt gibt es nicht.")

type feedbackPromptDoc struct {
	Title       string    `firestore:"title"`
	Description string    `firestore:"description"`
	Text        string    `firestore:"text"`
	Position    int       `firestore:"position"`
	CreatedAt   time.Time `firestore:"created_at"`
	UpdatedAt   time.Time `firestore:"updated_at"`
}

type feedbackPromptInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Text        string `json:"text"`
}

// feedbackPromptView is a feedback prompt as the API returns it. The text is only set for admins.
type feedbackPromptView struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Text        string `json:"text,omitempty"`
}

// checkFeedbackPromptText rejects empty or too long texts and every variable but {{allideas}} and {{language}}.
func checkFeedbackPromptText(text string) error {
	if strings.TrimSpace(text) == "" {
		return userError("Der Feedback-Prompt darf nicht leer sein.")
	}
	if utf8.RuneCountInString(text) > maxFeedbackPromptRunes {
		return userError("Der Feedback-Prompt ist zu lang.")
	}
	var unknown []string
	for _, name := range findVariables(text) {
		if !allowedFeedbackVariables[name] {
			unknown = append(unknown, name)
		}
	}
	if len(unknown) > 0 {
		return &unknownVariablesError{names: unknown}
	}
	return nil
}

// checkFeedbackPromptInput validates and trims the input (AC-025-4, AC-025-9).
func checkFeedbackPromptInput(in feedbackPromptInput) (feedbackPromptInput, error) {
	in.Title = strings.TrimSpace(in.Title)
	in.Description = strings.TrimSpace(in.Description)
	if in.Title == "" {
		return in, userError("Der Titel ist Pflicht.")
	}
	if utf8.RuneCountInString(in.Title) > maxLevelTitleRunes {
		return in, userError(fmt.Sprintf("Der Titel ist länger als %d Zeichen.", maxLevelTitleRunes))
	}
	if utf8.RuneCountInString(in.Description) > maxLevelDescRunes {
		return in, userError(fmt.Sprintf("Die Beschreibung ist länger als %d Zeichen.", maxLevelDescRunes))
	}
	if err := checkFeedbackPromptText(in.Text); err != nil {
		return in, err
	}
	return in, nil
}

type feedbackEntry struct {
	id  string
	doc feedbackPromptDoc
}

func sortFeedbackPrompts(list []feedbackEntry) {
	sort.SliceStable(list, func(i, j int) bool {
		if list[i].doc.Position != list[j].doc.Position {
			return list[i].doc.Position < list[j].doc.Position
		}
		return list[i].doc.CreatedAt.Before(list[j].doc.CreatedAt)
	})
}

func readFeedbackPrompts(it *firestore.DocumentIterator) ([]feedbackEntry, error) {
	defer it.Stop()
	var out []feedbackEntry
	for {
		snap, err := it.Next()
		if errors.Is(err, iterator.Done) {
			sortFeedbackPrompts(out)
			return out, nil
		}
		if err != nil {
			return nil, err
		}
		var d feedbackPromptDoc
		if err := snap.DataTo(&d); err != nil {
			return nil, err
		}
		out = append(out, feedbackEntry{id: snap.Ref.ID, doc: d})
	}
}

func (s *server) feedbackRef(id string) *firestore.DocumentRef {
	return s.db.Collection(feedbackPromptsCollection).Doc(id)
}

func (s *server) listFeedbackPrompts(ctx context.Context, withText bool) ([]feedbackPromptView, error) {
	list, err := readFeedbackPrompts(s.db.Collection(feedbackPromptsCollection).Documents(ctx))
	if err != nil {
		return nil, err
	}
	out := make([]feedbackPromptView, 0, len(list))
	for _, e := range list {
		v := feedbackPromptView{ID: e.id, Title: e.doc.Title, Description: e.doc.Description}
		if withText {
			v.Text = e.doc.Text
		}
		out = append(out, v)
	}
	return out, nil
}

func (s *server) createFeedbackPrompt(ctx context.Context, in feedbackPromptInput) (string, error) {
	in, err := checkFeedbackPromptInput(in)
	if err != nil {
		return "", err
	}
	ref := s.db.Collection(feedbackPromptsCollection).NewDoc()
	err = s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		list, err := readFeedbackPrompts(tx.Documents(s.db.Collection(feedbackPromptsCollection)))
		if err != nil {
			return err
		}
		pos := 0
		for _, e := range list {
			if e.doc.Position >= pos {
				pos = e.doc.Position + 1
			}
		}
		now := time.Now().UTC()
		return tx.Set(ref, feedbackPromptDoc{Title: in.Title, Description: in.Description, Text: in.Text, Position: pos, CreatedAt: now, UpdatedAt: now})
	})
	return ref.ID, err
}

func (s *server) saveFeedbackPrompt(ctx context.Context, id string, in feedbackPromptInput) error {
	in, err := checkFeedbackPromptInput(in)
	if err != nil {
		return err
	}
	return s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		if _, err := tx.Get(s.feedbackRef(id)); err != nil {
			if isNotFound(err) {
				return errNoSuchFeedbackPrompt
			}
			return err
		}
		return tx.Update(s.feedbackRef(id), []firestore.Update{
			{Path: "title", Value: in.Title},
			{Path: "description", Value: in.Description},
			{Path: "text", Value: in.Text},
			{Path: "updated_at", Value: time.Now().UTC()},
		})
	})
}

func (s *server) deleteFeedbackPrompt(ctx context.Context, id string) error {
	return s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		if _, err := tx.Get(s.feedbackRef(id)); err != nil {
			if isNotFound(err) {
				return errNoSuchFeedbackPrompt
			}
			return err
		}
		return tx.Delete(s.feedbackRef(id))
	})
}

func (s *server) reorderFeedbackPrompts(ctx context.Context, ids []string) error {
	return s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		list, err := readFeedbackPrompts(tx.Documents(s.db.Collection(feedbackPromptsCollection)))
		if err != nil {
			return err
		}
		existing := make([]string, len(list))
		for i, e := range list {
			existing[i] = e.id
		}
		if err := planOrder(existing, ids); err != nil {
			return err
		}
		for i, id := range ids {
			if err := tx.Update(s.feedbackRef(id), []firestore.Update{{Path: "position", Value: i}}); err != nil {
				return err
			}
		}
		return nil
	})
}

// loadAllIdeas reads the ideas newest first, like the overview, at most maxAllIdeas.
func (s *server) loadAllIdeas(ctx context.Context) ([]ideaDoc, error) {
	it := s.db.Collection("ideas").OrderBy("created_at", firestore.Desc).Limit(maxAllIdeas).Documents(ctx)
	defer it.Stop()
	var out []ideaDoc
	for {
		snap, err := it.Next()
		if errors.Is(err, iterator.Done) {
			return out, nil
		}
		if err != nil {
			return nil, err
		}
		var d ideaDoc
		if err := snap.DataTo(&d); err != nil {
			log.Printf("decode idea %s: %v", snap.Ref.ID, err)
			continue
		}
		out = append(out, d)
	}
}

// feedbackFileName is feedback-prompt-<slug>-YYYY-MM-DD.md.
func feedbackFileName(title string, now time.Time) string {
	var b strings.Builder
	dash := false
	title = strings.NewReplacer("ä", "ae", "ö", "oe", "ü", "ue", "ß", "ss", "é", "e", "è", "e", "à", "a").Replace(strings.ToLower(title))
	for _, r := range title {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			b.WriteRune(r)
			dash = false
		case !dash && b.Len() > 0:
			b.WriteByte('-')
			dash = true
		}
	}
	slug := strings.Trim(b.String(), "-")
	if slug == "" {
		slug = "prompt"
	}
	return fmt.Sprintf("feedback-prompt-%s-%s.md", slug, now.Format("2006-01-02"))
}

// --- HTTP ---

func decodeFeedbackInput(w http.ResponseWriter, r *http.Request) (feedbackPromptInput, bool) {
	var in feedbackPromptInput
	r.Body = http.MaxBytesReader(w, r.Body, maxFeedbackBody)
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeJSONError(w, http.StatusBadRequest, "ungültige Anfrage")
		return in, false
	}
	return in, true
}

// answerFeedback writes the result of a create, save, delete or reorder.
func (s *server) answerFeedback(w http.ResponseWriter, status int, body any, err error) {
	var unknown *unknownVariablesError
	var user userError
	switch {
	case errors.As(err, &unknown):
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": unknown.Error(), "unknown": unknown.names})
	case errors.Is(err, errNoSuchFeedbackPrompt):
		writeJSONError(w, http.StatusNotFound, errNoSuchFeedbackPrompt.Error())
	case errors.As(err, &user):
		writeJSONError(w, http.StatusBadRequest, string(user))
	case err != nil:
		log.Printf("feedback prompt: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "interner Fehler")
	default:
		writeJSON(w, status, body)
	}
}

// apiFeedbackPrompts: GET /api/feedback-prompts, public; no text, no ideas (AC-025-1, AC-025-10).
func (s *server) apiFeedbackPrompts(w http.ResponseWriter, r *http.Request) {
	list, err := s.listFeedbackPrompts(r.Context(), false)
	if err != nil {
		s.answerFeedback(w, 0, nil, err)
		return
	}
	writeJSON(w, http.StatusOK, list)
}

// apiAdminFeedbackPrompts: GET /api/admin/feedback-prompts, with the text.
func (s *server) apiAdminFeedbackPrompts(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	list, err := s.listFeedbackPrompts(r.Context(), true)
	if err != nil {
		s.answerFeedback(w, 0, nil, err)
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func (s *server) apiCreateFeedbackPrompt(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	in, ok := decodeFeedbackInput(w, r)
	if !ok {
		return
	}
	id, err := s.createFeedbackPrompt(r.Context(), in)
	s.answerFeedback(w, http.StatusCreated, map[string]string{"id": id}, err)
}

func (s *server) apiSaveFeedbackPrompt(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	in, ok := decodeFeedbackInput(w, r)
	if !ok {
		return
	}
	err := s.saveFeedbackPrompt(r.Context(), r.PathValue("id"), in)
	s.answerFeedback(w, http.StatusOK, map[string]bool{"ok": true}, err)
}

func (s *server) apiDeleteFeedbackPrompt(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	err := s.deleteFeedbackPrompt(r.Context(), r.PathValue("id"))
	s.answerFeedback(w, http.StatusOK, map[string]bool{"deleted": true}, err)
}

func (s *server) apiReorderFeedbackPrompts(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	var body struct {
		IDs []string `json:"ids"`
	}
	r.Body = http.MaxBytesReader(w, r.Body, 16<<10)
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSONError(w, http.StatusBadRequest, "ungültige Anfrage")
		return
	}
	err := s.reorderFeedbackPrompts(r.Context(), body.IDs)
	s.answerFeedback(w, http.StatusOK, map[string]bool{"ok": true}, err)
}

// apiRenderFeedbackPrompt: GET /api/feedback-prompts/{id}/render?lang=xx[&download=1], public.
// {{allideas}} and {{language}} are replaced here, on the server (D5, AC-025-6, AC-025-7).
func (s *server) apiRenderFeedbackPrompt(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	snap, err := s.feedbackRef(r.PathValue("id")).Get(ctx)
	if err != nil {
		if isNotFound(err) {
			writeJSONError(w, http.StatusNotFound, errNoSuchFeedbackPrompt.Error())
		} else {
			s.answerFeedback(w, 0, nil, err)
		}
		return
	}
	var d feedbackPromptDoc
	if err := snap.DataTo(&d); err != nil {
		s.answerFeedback(w, 0, nil, err)
		return
	}
	var ideas []ideaDoc
	if containsVariable(d.Text, "allideas") { // no read of the ideas if the prompt does not use them
		if ideas, err = s.loadAllIdeas(ctx); err != nil {
			s.answerFeedback(w, 0, nil, err)
			return
		}
	}
	text := renderFeedbackPrompt(d.Text, ideas, r.URL.Query().Get("lang"))
	w.Header().Set("Content-Type", "text/markdown; charset=utf-8")
	if r.URL.Query().Get("download") != "" {
		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", feedbackFileName(d.Title, time.Now())))
	}
	_, _ = w.Write([]byte(text))
}

func containsVariable(text, name string) bool {
	for _, n := range findVariables(text) {
		if n == name {
			return true
		}
	}
	return false
}
