package app

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"
)

// F-008/F-018: a prompt level (detail level) holds its text as numbered versions. Only the variables
// {{ideas}} and {{language}} are known; the browser renders them (F-003).

const (
	legacyMasterPromptCollection = "master_prompt_versions" // F-008 storage, only read by the migration (F-018)
	maxMasterPromptRunes         = 20000
	maxMasterPromptBody          = 64 << 10
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

// answerVersion writes the result of a save, create or restore.
func (s *server) answerVersion(w http.ResponseWriter, number int, created bool, err error) {
	var unknown *unknownVariablesError
	var user userError
	switch {
	case errors.As(err, &unknown):
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": unknown.Error(), "unknown": unknown.names})
	case errors.Is(err, errNoSuchVersion):
		writeJSONError(w, http.StatusNotFound, errNoSuchVersion.Error())
	case errors.Is(err, errNoSuchLevel):
		writeJSONError(w, http.StatusNotFound, errNoSuchLevel.Error())
	case errors.As(err, &user):
		writeJSONError(w, http.StatusBadRequest, string(user))
	case err != nil:
		log.Printf("prompt level: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "interner Fehler")
	default:
		writeJSON(w, http.StatusOK, map[string]any{"version": number, "created": created})
	}
}
