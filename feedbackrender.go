package app

import (
	"fmt"
	"strconv"
	"strings"
)

// F-025: server side rendering of feedback prompts. formatIdeaText is a port of formatIdea in
// frontend/src/prompt/render.ts, so that {{allideas}} looks like {{ideas}} from the basket (AC-025-6).

// allowedFeedbackVariables are the only names a feedback prompt may use (D6). {{ideas}} is not one of them.
var allowedFeedbackVariables = map[string]bool{"allideas": true, "language": true}

// germanLanguageNames are the language names in German, whatever the interface language is (F-003 D5).
var germanLanguageNames = map[string]string{"de": "Deutsch", "en": "Englisch", "fr": "Französisch", "it": "Italienisch"}

// languageLabel returns "code (Name)"; unknown codes fall back to English.
func languageLabel(lang string) string {
	lang = strings.ToLower(lang)
	if len(lang) > 2 {
		lang = lang[:2]
	}
	if _, ok := germanLanguageNames[lang]; !ok {
		lang = "en"
	}
	return fmt.Sprintf("%s (%s)", lang, germanLanguageNames[lang])
}

// germanNumber uses the decimal comma, as the prompt is read by German-speaking staff.
func germanNumber(n float64) string {
	return strings.Replace(strconv.FormatFloat(n, 'f', -1, 64), ".", ",", 1)
}

// formatIdeaText is one block per idea. Empty fields are left out; images are not text.
func formatIdeaText(d ideaDoc) string {
	title := strings.TrimSpace(d.Title)
	if title == "" {
		title = "Idee ohne Titel"
	}
	lines := []string{"### " + title}
	add := func(label, value string) {
		if v := strings.TrimSpace(value); v != "" {
			lines = append(lines, fmt.Sprintf("- %s: %s", label, v))
		}
	}
	target := d.TargetGroup
	if target == "" {
		target = d.LegacyAudience
	}
	add("Beschreibung", d.Description)
	add("Zielgruppe", target)
	add("Ziel", d.Goal)
	add("Nachhaltigkeit", d.Sustainability)
	add("Barrierefreiheit", d.Accessibility)

	var space []string
	if d.Space.AreaM2 != nil {
		space = append(space, germanNumber(*d.Space.AreaM2)+" m²")
	}
	if d.Space.VolumeM3 != nil {
		space = append(space, "Volumen "+germanNumber(*d.Space.VolumeM3)+" m³")
	}
	add("Fläche", strings.Join(space, ", "))

	if len(d.Equipment) > 0 {
		lines = append(lines, "- Ausstattung: "+strings.Join(d.Equipment, ", "))
	}
	if d.Budget != nil {
		add("Budget", *d.Budget)
	}
	var credit []string
	if name := strings.TrimSpace(strings.TrimSpace(d.CreditFirstName) + " " + strings.TrimSpace(d.CreditLastName)); name != "" {
		credit = append(credit, name)
	}
	if v := strings.TrimSpace(d.CreditInstitute); v != "" {
		credit = append(credit, v)
	}
	if v := strings.TrimSpace(d.CreditEmail); v != "" {
		credit = append(credit, v)
	}
	add("Credit Line", strings.Join(credit, ", "))
	if concept := strings.TrimSpace(d.MediationConcept); concept != "" {
		lines = append(lines, "", "#### Mediation Concept", concept)
	}
	return strings.Join(lines, "\n")
}

// renderFeedbackPrompt replaces {{allideas}} and {{language}} in one pass, so text inside the ideas is
// never searched for variables again. Other {{…}} stay as they are.
func renderFeedbackPrompt(template string, ideas []ideaDoc, lang string) string {
	blocks := make([]string, len(ideas))
	for i, d := range ideas {
		blocks[i] = formatIdeaText(d)
	}
	all := strings.Join(blocks, "\n\n")
	label := languageLabel(lang)
	return variablePattern.ReplaceAllStringFunc(template, func(m string) string {
		switch strings.TrimSpace(variablePattern.FindStringSubmatch(m)[1]) {
		case "allideas":
			return all
		case "language":
			return label
		}
		return m
	})
}
