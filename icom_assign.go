package app

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"sort"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

// ICOMAssignment is one entry of the mapping file for ideas that existed before F-024.
type ICOMAssignment struct {
	Title          string   `json:"title"`
	ICOMCategories []string `json:"icomCategories"`
	Locations      []string `json:"locations"`
}

// ReadICOMAssignments reads the mapping file and checks it: every title once, every ID known.
func ReadICOMAssignments(path string) ([]ICOMAssignment, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return parseICOMAssignments(data)
}

func parseICOMAssignments(data []byte) ([]ICOMAssignment, error) {
	var list []ICOMAssignment
	if err := json.Unmarshal(data, &list); err != nil {
		return nil, fmt.Errorf("Zuordnung ist kein gültiges JSON: %w", err)
	}
	seen := map[string]bool{}
	for i := range list {
		a := &list[i]
		key := titleKey(a.Title)
		if key == "" {
			return nil, fmt.Errorf("Eintrag %d: Titel fehlt", i+1)
		}
		if seen[key] {
			return nil, fmt.Errorf("Titel %q kommt zweimal vor", a.Title)
		}
		seen[key] = true
		var err error
		if a.ICOMCategories, err = normalizeIDs(a.ICOMCategories, icomCategoryIDs, "ICOM category"); err != nil {
			return nil, fmt.Errorf("%q: %w", a.Title, err)
		}
		if a.Locations, err = normalizeIDs(a.Locations, locationIDs, "location"); err != nil {
			return nil, fmt.Errorf("%q: %w", a.Title, err)
		}
	}
	return list, nil
}

type icomTarget struct {
	ref        *firestore.DocumentRef
	title      string
	categories []string
	locations  []string
}

// AssignICOM sets ICOM categories and locations on existing ideas, matched by title (trimmed,
// case-insensitive, as in the CSV import). Without apply it only prints what it would do.
// Ideas that already have categories or locations keep them unless overwrite is set.
func AssignICOM(ctx context.Context, project string, list []ICOMAssignment, apply, overwrite bool, out io.Writer) error {
	db, err := firestore.NewClient(ctx, project)
	if err != nil {
		return fmt.Errorf("firestore: %w", err)
	}
	defer db.Close()

	byTitle := map[string][]icomTarget{}
	it := db.Collection("ideas").Select("title", "icom_categories", "locations").Documents(ctx)
	defer it.Stop()
	for {
		snap, err := it.Next()
		if errors.Is(err, iterator.Done) {
			break
		}
		if err != nil {
			return fmt.Errorf("Ideen lesen: %w", err)
		}
		var d struct {
			Title          string   `firestore:"title"`
			ICOMCategories []string `firestore:"icom_categories"`
			Locations      []string `firestore:"locations"`
		}
		if err := snap.DataTo(&d); err != nil {
			return fmt.Errorf("Idee %s lesen: %w", snap.Ref.ID, err)
		}
		k := titleKey(d.Title)
		byTitle[k] = append(byTitle[k], icomTarget{ref: snap.Ref, title: d.Title, categories: d.ICOMCategories, locations: d.Locations})
	}

	if apply {
		fmt.Fprintf(out, "Schreiben: %d Zuordnungen, %d Titel in der Datenbank\n\n", len(list), len(byTitle))
	} else {
		fmt.Fprintf(out, "Probelauf, es wird nichts geschrieben: %d Zuordnungen, %d Titel in der Datenbank\n\n", len(list), len(byTitle))
	}

	used := map[string]bool{}
	var set, kept, missing int
	for _, a := range list {
		k := titleKey(a.Title)
		targets := byTitle[k]
		if len(targets) == 0 {
			fmt.Fprintf(out, "FEHLT     %q: keine Idee mit diesem Titel\n", a.Title)
			missing++
			continue
		}
		used[k] = true
		for _, t := range targets {
			if !overwrite && (len(t.categories) > 0 || len(t.locations) > 0) {
				fmt.Fprintf(out, "BEHALTEN  %q (%s): hat schon %v / %v\n", t.title, t.ref.ID, t.categories, t.locations)
				kept++
				continue
			}
			fmt.Fprintf(out, "SETZEN    %q (%s): %v / %v\n", t.title, t.ref.ID, a.ICOMCategories, a.Locations)
			if apply {
				_, err := t.ref.Update(ctx, []firestore.Update{
					{Path: "icom_categories", Value: a.ICOMCategories},
					{Path: "locations", Value: a.Locations},
				})
				if err != nil {
					return fmt.Errorf("Idee %s schreiben: %w", t.ref.ID, err)
				}
			}
			set++
		}
	}

	var without []string
	for k, targets := range byTitle {
		if used[k] {
			continue
		}
		for _, t := range targets {
			without = append(without, fmt.Sprintf("OHNE      %q (%s): kein Eintrag in der Zuordnung", t.title, t.ref.ID))
		}
	}
	sort.Strings(without)
	for _, line := range without {
		fmt.Fprintln(out, line)
	}

	verb := "würden gesetzt"
	if apply {
		verb = "gesetzt"
	}
	fmt.Fprintf(out, "\n%d %s, %d behalten, %d Titel nicht gefunden, %d Ideen ohne Eintrag\n", set, verb, kept, missing, len(without))
	return nil
}
