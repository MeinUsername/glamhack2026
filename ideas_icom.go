package app

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"strings"
)

// ICOM filter (F-024, F-035): every idea can carry several ICOM categories and one or more locations.
// frontend/src/data/icom-filter-kategorien.json is the only source: the frontend reads the labels from it,
// and the server embeds it, so no list of IDs is repeated in Go. It is uploaded on deploy despite the rest
// of frontend/ being excluded (.gcloudignore).

//go:embed frontend/src/data/icom-filter-kategorien.json
var icomFilterJSON []byte

type icomFilterFile struct {
	FilterGroups []struct {
		Categories []struct {
			ID string `json:"id"`
		} `json:"categories"`
	} `json:"filterGroups"`
	SecondaryFilters []struct {
		ID      string `json:"id"`
		Options []struct {
			ID string `json:"id"`
		} `json:"options"`
	} `json:"secondaryFilters"`
}

// icomCategoryIDs in the order of the JSON file (groups, then categories); locationIDs are the options
// of the secondary filter "location".
var icomCategoryIDs, locationIDs = mustLoadICOMIDs(icomFilterJSON)

// mustLoadICOMIDs parses the file once at start. A broken file stops the start instead of letting the
// server reject every ID silently.
func mustLoadICOMIDs(data []byte) (categories, locations []string) {
	var f icomFilterFile
	if err := json.Unmarshal(data, &f); err != nil {
		panic(fmt.Sprintf("icom-filter-kategorien.json: %v", err))
	}
	seen := map[string]bool{}
	add := func(list *[]string, id string) {
		if id == "" || seen[id] {
			panic(fmt.Sprintf("icom-filter-kategorien.json: empty or duplicate ID %q", id))
		}
		seen[id] = true
		*list = append(*list, id)
	}
	for _, g := range f.FilterGroups {
		for _, c := range g.Categories {
			add(&categories, c.ID)
		}
	}
	for _, sf := range f.SecondaryFilters {
		if sf.ID != "location" {
			continue
		}
		for _, o := range sf.Options {
			add(&locations, o.ID)
		}
	}
	if len(categories) == 0 || len(locations) == 0 {
		panic("icom-filter-kategorien.json: no categories or no locations")
	}
	return categories, locations
}

// normalizeIDs accepts only IDs from valid (case-sensitive), drops duplicates and keeps the
// order of the first occurrences. nil and an empty list give an empty list.
func normalizeIDs(raw, valid []string, what string) ([]string, error) {
	ok := make(map[string]bool, len(valid))
	for _, v := range valid {
		ok[v] = true
	}
	seen := map[string]bool{}
	out := []string{}
	for _, id := range raw {
		if !ok[id] {
			return nil, userError(fmt.Sprintf("Unknown %s %q.", what, id))
		}
		if seen[id] {
			continue
		}
		seen[id] = true
		out = append(out, id)
	}
	return out, nil
}

// splitIDList reads a CSV cell like "accessibility; Dialogue-Exchange" into lowercase IDs.
// Semicolons and commas both separate; empty parts are dropped.
func splitIDList(cell string) []string {
	parts := strings.FieldsFunc(cell, func(r rune) bool { return r == ';' || r == ',' })
	out := []string{}
	for _, p := range parts {
		if id := strings.ToLower(strings.TrimSpace(p)); id != "" {
			out = append(out, id)
		}
	}
	return out
}

// emptyIfNil turns a missing Firestore field into an empty JSON list.
func emptyIfNil(s []string) []string {
	if s == nil {
		return []string{}
	}
	return s
}
