package app

import (
	"fmt"
	"strings"
)

// ICOM filter (F-024): every idea can carry several ICOM categories and one or more locations.
// The IDs mirror frontend/src/data/icom-filter-kategorien.json, which also holds the labels.
// frontend/ is not uploaded on deploy (.gcloudignore), so the IDs are repeated here;
// TestF024_IDsMatchFrontendJSON keeps both lists in step.

// icomCategoryIDs in the order of the JSON file (groups, then categories).
var icomCategoryIDs = []string{
	// people-participation
	"participation-cocreation", "dialogue-exchange", "visitor-feedback", "community-partnerships",
	// access-inclusion
	"accessibility", "inclusion-antidiscrimination", "multiple-perspectives", "diverse-audiences",
	// learning-reflection
	"active-learning", "transparency-insights", "digital-mediation",
	// care-responsibility
	"wellbeing-safe-space", "sensitive-content", "colonial-restitution", "sustainability",
}

// locationIDs are the options of the secondary filter "location".
var locationIDs = []string{"onsite", "offsite", "online"}

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
