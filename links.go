package app

import (
	"fmt"
	"net/url"
	"sort"
	"strings"
	"unicode/utf8"
)

// F-031: links of an idea. Each has a URL (http or https only), an optional title and a type (see linktypes.go).

const (
	maxLinksPerIdea = 20
	maxLinkURLChars = 2048
)

type linkDoc struct {
	URL    string `firestore:"url"`
	Title  string `firestore:"title"`
	TypeID string `firestore:"type_id"`
}

type linkInput struct {
	URL    string `json:"url"`
	Title  string `json:"title"`
	TypeID string `json:"typeId"`
}

type linkView struct {
	URL    string `json:"url"`
	Title  string `json:"title"`
	TypeID string `json:"typeId"`
}

func linkViews(in []linkDoc) []linkView {
	out := make([]linkView, 0, len(in))
	for _, l := range in {
		out = append(out, linkView{URL: l.URL, Title: l.Title, TypeID: l.TypeID})
	}
	return out
}

// checkLinkURL accepts http and https URLs with a host and without white space (AC-031-4).
func checkLinkURL(raw string) error {
	bad := userError(fmt.Sprintf("The link %q is not a valid http or https address.", raw))
	if raw == "" || len(raw) > maxLinkURLChars || strings.ContainsAny(raw, " \t\r\n") {
		return bad
	}
	u, err := url.Parse(raw)
	if err != nil || u.Host == "" {
		return bad
	}
	if s := strings.ToLower(u.Scheme); s != "http" && s != "https" {
		return bad
	}
	return nil
}

// checkLinks trims and checks the links of an idea: at most 20, valid URLs, a type each (AC-031-2..4).
// Whether the type exists is checked by the caller against the stored types.
func checkLinks(in []linkInput) ([]linkDoc, error) {
	if len(in) > maxLinksPerIdea {
		return nil, userError(fmt.Sprintf("An idea can have at most %d links.", maxLinksPerIdea))
	}
	out := make([]linkDoc, 0, len(in))
	for _, l := range in {
		d := linkDoc{URL: strings.TrimSpace(l.URL), Title: strings.TrimSpace(l.Title), TypeID: strings.TrimSpace(l.TypeID)}
		if err := checkLinkURL(d.URL); err != nil {
			return nil, err
		}
		if utf8.RuneCountInString(d.Title) > maxIdeaTextRunes {
			return nil, userError(fmt.Sprintf("A link title is longer than %d characters.", maxIdeaTextRunes))
		}
		if d.TypeID == "" {
			return nil, userError("Every link needs a type.")
		}
		out = append(out, d)
	}
	return out, nil
}

// linkTypeIDsOf lists the distinct type IDs of the links, in sorted order.
func linkTypeIDsOf(links []linkDoc) []string {
	seen := map[string]bool{}
	out := []string{}
	for _, l := range links {
		if !seen[l.TypeID] {
			seen[l.TypeID] = true
			out = append(out, l.TypeID)
		}
	}
	sort.Strings(out)
	return out
}

// unknownLinkType returns the first link type ID that is not in known, or "".
func unknownLinkType(links []linkDoc, known map[string]bool) string {
	for _, l := range links {
		if !known[l.TypeID] {
			return l.TypeID
		}
	}
	return ""
}
