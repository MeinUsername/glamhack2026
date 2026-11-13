package app

import (
	"context"
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"google.golang.org/api/iterator"
)

// maxImportBytes limits the uploaded CSV file (plan F-015).
const maxImportBytes = 5 << 20

// Row states of the import.
const (
	importNew     = "new"
	importSkipped = "skipped"
	importInvalid = "invalid"
)

// csvColumns maps the lowercase header names to our fields. "space needed" and "picture"
// are known but dropped (D4, D5).
var csvColumns = map[string]bool{
	"title": true, "description of idea": true, "description of interaction": true,
	"goal": true, "target group": true, "equipment needed": true, "space needed": true,
	"staff needed": true, "necessarily related to specific exhibits": true,
	"accessibility": true, "picture": true,
}

// importRow is one data row of the CSV. Line 1 is the header.
type importRow struct {
	Line    int
	Title   string
	Input   ideaInput
	Status  string
	Message string
	doc     ideaDoc
	catalog []equipmentDoc
}

// importRowView is the JSON form of a row that was not imported cleanly.
type importRowView struct {
	Line    int    `json:"line"`
	Title   string `json:"title"`
	Status  string `json:"status"`
	Message string `json:"message"`
}

// importResult answers preview and import. Created is only set by the import.
type importResult struct {
	New     int             `json:"new"`
	Skipped int             `json:"skipped"`
	Invalid int             `json:"invalid"`
	Created int             `json:"created"`
	Rows    []importRowView `json:"rows"`
}

// parseIdeaCSV reads the CSV into rows. A missing "Title" column rejects the whole file.
// Rows that are short or fail validation are marked invalid, not dropped.
func parseIdeaCSV(r io.Reader) ([]importRow, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return nil, userError("The file could not be read.")
	}
	text := strings.TrimPrefix(string(data), "\xef\xbb\xbf")
	cr := csv.NewReader(strings.NewReader(text))
	cr.FieldsPerRecord = -1
	cr.LazyQuotes = true
	records, err := cr.ReadAll()
	if err != nil {
		return nil, userError("The file is not a valid CSV: " + err.Error())
	}
	if len(records) == 0 {
		return nil, userError("The file is empty.")
	}
	col := map[string]int{}
	for i, h := range records[0] {
		name := strings.ToLower(strings.TrimSpace(h))
		if csvColumns[name] {
			if _, dup := col[name]; !dup {
				col[name] = i
			}
		}
	}
	if _, ok := col["title"]; !ok {
		return nil, userError(`The column "Title" is missing.`)
	}
	get := func(rec []string, name string) string {
		i, ok := col[name]
		if !ok || i >= len(rec) {
			return ""
		}
		return rec[i]
	}

	rows := make([]importRow, 0, len(records)-1)
	for i, rec := range records[1:] {
		if len(rec) == 1 && strings.TrimSpace(rec[0]) == "" {
			continue // blank line
		}
		in := ideaInput{
			Title:                    get(rec, "title"),
			Description:              get(rec, "description of idea"),
			DescriptionOfInteraction: get(rec, "description of interaction"),
			Goal:                     get(rec, "goal"),
			TargetGroup:              get(rec, "target group"),
			StaffNeeded:              get(rec, "staff needed"),
			ExhibitRelated:           get(rec, "necessarily related to specific exhibits"),
			Accessibility:            get(rec, "accessibility"),
			Equipment:                strings.Split(get(rec, "equipment needed"), ","),
		}
		row := importRow{Line: i + 2, Title: strings.TrimSpace(in.Title), Input: in, Status: importNew}
		if row.Title == "" {
			row.Status, row.Message = importInvalid, "Title is missing."
		} else if doc, catalog, err := validateIdeaInput(in); err != nil {
			row.Status, row.Message = importInvalid, err.Error()
		} else {
			row.doc, row.catalog = doc, catalog
		}
		rows = append(rows, row)
	}
	return rows, nil
}

// titleKey is the comparison form of a title: trimmed, case-insensitive (Q-015-13).
func titleKey(title string) string { return strings.ToLower(strings.TrimSpace(title)) }

// classifyImport decides per row whether it is new, skipped (title exists, also earlier in
// the same file) or invalid. It writes nothing and returns the rows with Status and Message set.
func classifyImport(rows []importRow, existing map[string]bool) ([]importRow, importResult) {
	seen := map[string]bool{}
	for k := range existing {
		seen[k] = true
	}
	var res importResult
	res.Rows = []importRowView{}
	out := make([]importRow, len(rows))
	copy(out, rows)
	for i := range out {
		row := &out[i]
		if row.Status != importInvalid {
			key := titleKey(row.Title)
			if seen[key] {
				row.Status = importSkipped
				row.Message = fmt.Sprintf("%q already exists, skipped.", row.Title)
			} else {
				seen[key] = true
				row.Status = importNew
			}
		}
		switch row.Status {
		case importNew:
			res.New++
		case importSkipped:
			res.Skipped++
		case importInvalid:
			res.Invalid++
		}
		if row.Status != importNew {
			res.Rows = append(res.Rows, importRowView{Line: row.Line, Title: row.Title, Status: row.Status, Message: row.Message})
		}
	}
	return out, res
}

// loadExistingTitles reads only the title field of all ideas.
func (s *server) loadExistingTitles(ctx context.Context) (map[string]bool, error) {
	it := s.db.Collection("ideas").Select("title").Documents(ctx)
	defer it.Stop()
	titles := map[string]bool{}
	for {
		snap, err := it.Next()
		if errors.Is(err, iterator.Done) {
			return titles, nil
		}
		if err != nil {
			return nil, err
		}
		var d struct {
			Title string `firestore:"title"`
		}
		if err := snap.DataTo(&d); err == nil {
			titles[titleKey(d.Title)] = true
		}
	}
}

// readImportFile reads the uploaded "file" part and classifies it. Errors are already answered.
func (s *server) readImportFile(w http.ResponseWriter, r *http.Request) ([]importRow, importResult, bool) {
	r.Body = http.MaxBytesReader(w, r.Body, maxImportBytes+(1<<20))
	if err := r.ParseMultipartForm(1 << 20); err != nil {
		var mbe *http.MaxBytesError
		if errors.As(err, &mbe) {
			writeJSONError(w, http.StatusRequestEntityTooLarge, "The file is too large.")
		} else {
			writeJSONError(w, http.StatusBadRequest, "Invalid form.")
		}
		return nil, importResult{}, false
	}
	f, hdr, err := r.FormFile("file")
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "No file uploaded.")
		return nil, importResult{}, false
	}
	defer f.Close()
	if hdr.Size > maxImportBytes {
		writeJSONError(w, http.StatusRequestEntityTooLarge, "The file is too large.")
		return nil, importResult{}, false
	}
	rows, err := parseIdeaCSV(f)
	if err != nil {
		writeUserError(w, err)
		return nil, importResult{}, false
	}
	existing, err := s.loadExistingTitles(r.Context())
	if err != nil {
		log.Printf("import titles: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "internal error")
		return nil, importResult{}, false
	}
	rows, res := classifyImport(rows, existing)
	return rows, res, true
}

// apiImportIdeasPreview handles POST /api/admin/import/ideas/preview: counts only, nothing is stored.
func (s *server) apiImportIdeasPreview(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	_, res, ok := s.readImportFile(w, r)
	if !ok {
		return
	}
	writeJSON(w, http.StatusOK, res)
}

// apiImportIdeas handles POST /api/admin/import/ideas: stores the new rows (F-015 D1, D3).
func (s *server) apiImportIdeas(w http.ResponseWriter, r *http.Request, actor sessionUser) {
	rows, res, ok := s.readImportFile(w, r)
	if !ok {
		return
	}
	ctx := r.Context()
	now := time.Now().UTC()
	const batchSize = 400 // Firestore allows 500 writes; equipment entries share the batch
	batch := s.db.Batch()
	pending := 0
	flush := func() error {
		if pending == 0 {
			return nil
		}
		_, err := batch.Commit(ctx)
		batch = s.db.Batch()
		pending = 0
		return err
	}
	equipmentSeen := map[string]bool{}
	for _, row := range rows {
		if row.Status != importNew {
			continue
		}
		doc := row.doc
		doc.CreatedBy = actor.ID
		doc.CreatedAt = now
		batch.Set(s.db.Collection("ideas").NewDoc(), doc)
		pending++
		for _, e := range row.catalog {
			if equipmentSeen[e.NameKey] {
				continue
			}
			equipmentSeen[e.NameKey] = true
			batch.Set(s.db.Collection("equipment").Doc(e.NameKey), e)
			pending++
		}
		if pending >= batchSize {
			if err := flush(); err != nil {
				log.Printf("import ideas: %v", err)
				writeJSONError(w, http.StatusInternalServerError, "internal error")
				return
			}
		}
	}
	if err := flush(); err != nil {
		log.Printf("import ideas: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "internal error")
		return
	}
	res.Created = res.New
	writeJSON(w, http.StatusOK, res)
}
