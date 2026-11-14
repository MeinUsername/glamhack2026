# F-023 Concept Feld einfügen – Implementierungsplan

Grundlage: `spec.md` (D1–D7) und `acceptance.md` (AC-023-1 bis AC-023-9). Es gibt kein `docs/feature-workflow.md` und kein `ARCHITECTURE.md` im Projekt; der Plan stützt sich auf den Code.

## Bestand (Stand Code)

- Idee: `ideaDoc` / `ideaInput` / `ideaView` in `ideas.go`; `validateIdeaInput` trimmt und begrenzt alle Texte auf `maxIdeaTextRunes` (5000). `apiUpdateIdea` (`ideas_update.go`) nutzt dieselbe Validierung; `toIdeaView` baut die Antwort. Die Übersicht (`ideaSummary`) liefert nur Titel, Bildzahl und `description`, daher bleibt sie von selbst frei vom Concept (AC-023-7).
- Frontend: `IdeaForm.tsx` (Anlegen und Bearbeiten, `Draft`, `draftFrom`, Payload ab Zeile ~146), `IdeaPage.tsx` (Komponente `Section` für Text), Typ `Idea` in `types.ts`, Sprachdateien `de/en/fr/it` unter `frontend/src/i18n/locales/`.
- Master-Prompt: Die Idee-Blöcke entstehen im Browser in `formatIdea` (`prompt/render.ts`); `{{ideas}}` setzt sie zusammen. Das Backend (`masterprompt.go`) kennt nur die Variablen-Namen, nicht den Idee-Text.
- CSV-Import (F-015): `ideas_import.go` füllt `ideaInput` nur aus bekannten Spalten (`description of idea` usw.), ein Concept-Feld kommt dort nicht vor.
- Export (F-010): exportiert laut Spec nur Einstellungen (Master-Prompts, Warenkorb, Sprachen), keine Ideen. Der offene Punkt «Export» entfällt, es ist nichts zu tun.
- `frontend/package.json` enthält weder CodeMirror noch einen Markdown-Renderer (D3 bestätigt: beides kommt neu dazu).

## Festlegungen (offene Punkte aus der Spec)

- **Prompt-Injection (D5):** Keine neue Variable. Das Concept wird in `formatIdea` an den Idee-Block angehängt, nach den Stichpunkten, als eigener Absatz `#### Mediation Concept` mit dem Markdown unverändert (getrimmt). Bestehende Master-Prompts bleiben gültig, `KNOWN_VARIABLES` und `masterprompt.go` ändern sich nicht. Leeres Concept: nichts anhängen.
- **Pakete:** `@uiw/react-codemirror` mit `@codemirror/lang-markdown` und `@codemirror/language-data` nicht nötig (nur Markdown); Renderer `react-markdown` mit `remark-gfm`. **Kein** `rehype-raw`, kein `dangerouslySetInnerHTML`. `react-markdown` ignoriert rohes HTML standardmässig (wird als Text angezeigt, nicht ausgeführt, AC-023-5). Links über die `components.a`-Überschreibung mit `target="_blank"` und `rel="noopener noreferrer"`; `urlTransform` (Standard) bleibt aktiv, damit `javascript:`-Links entfernt werden.
- **D7 / Firestore-Limit:** Keine fachliche Längenbegrenzung. Als rein technische Absicherung ein hoher Server-Deckel `maxConceptRunes = 200000` (≤ ca. 800 KB UTF-8, unter der Dokumentgrenze von 1 MiB) mit klarer Fehlermeldung. Das Feld ist von der 5000-Zeichen-Grenze der anderen Texte ausgenommen. Das Frontend setzt keinen Zähler. (Weicht der Nutzer davon ab, nur T1 anpassen.)
- **Glossar:** Begriff «Mediation Concept» / «Mediation concept» mit `ddesk glossary` aufnehmen (T7).
- Neue Texte kommen in alle vier Sprachdateien.

## Aufgaben

### T1 – Backend: Feld `mediationConcept`
- `ideas.go`: `ideaDoc.MediationConcept string \`firestore:"mediation_concept"\``, `ideaInput.MediationConcept` (`json:"mediationConcept"`), `ideaView.MediationConcept`; `toIdeaView` setzt es (fehlendes Feld bei alten Ideen ergibt `""`, kein Migrationsbedarf).
- `validateIdeaInput`: Concept nicht in die `texts`-Map mit 5000er-Grenze, sondern eigene Prüfung gegen `maxConceptRunes`. Der Text wird **nicht** umgebrochen oder verändert; nur `strings.TrimSpace` am Rand wie bei den anderen Feldern (innere Zeilenumbrüche und Einrückungen bleiben, wichtig für Markdown-Listen und Code).
- `ideas_update.go`: keine Änderung nötig (gleiche Validierung, `writeIdea` schreibt das ganze Dokument); per Test absichern.
- `ideaSummary` / `apiListIdeas` bleiben unverändert (AC-023-7).
- `ideas_import.go` bleibt unverändert; ein Test belegt, dass `mediationConcept` leer bleibt (AC-023-9).
- Tests (`ideas_test.go`, `ideas_import_test.go`): Concept bleibt in `validateIdeaInput` mit Zeilenumbrüchen erhalten (AC-023-3); mehr als 5000 Zeichen erlaubt, über dem Deckel Fehler; ohne Concept gültig (AC-023-6); `toIdeaView` mit leerem und gesetztem Wert; `ideaSummary` enthält kein Concept (AC-023-7); CSV-Zeilen liefern leeres Concept (AC-023-9).
- Verweist auf: AC-023-3, AC-023-6, AC-023-7, AC-023-9.
- Abhängig von keiner anderen Aufgabe.

### T2 – Abhängigkeiten und Typ im Frontend
- `frontend/package.json`: `react-markdown`, `remark-gfm`, `@uiw/react-codemirror`, `@codemirror/lang-markdown` (Versionen mit `npm install` aktuell wählen, Lockfile mitführen). Prüfen, dass `npm run build` und `vitest` (jsdom) mit CodeMirror laufen; falls nötig Mocks/Setup in `frontend/src/test` ergänzen.
- `types.ts`: `Idea.mediationConcept: string`.
- Verweist auf: AC-023-1, AC-023-4.
- Abhängig von keiner anderen Aufgabe.

### T3 – Wiederverwendbare Komponente `MarkdownView`
- Neu `frontend/src/components/MarkdownView.tsx`: rendert Markdown mit `react-markdown` + `remark-gfm` (Überschriften, Listen, Tabellen, Links, Code); kein `rehype-raw`; Link-Komponente mit `target="_blank"` und `rel="noopener noreferrer"`; Styling mit Tailwind (Typografie für h1–h4, Listen, Tabellen mit Rand, `pre`/`code` mit Hintergrund und horizontalem Scroll, Dark-Mode wie im Rest der App; kein neues Plugin nötig, Klassen direkt auf den Elementen über `components`).
- Test `MarkdownView.test.tsx`: Überschrift, Liste, Tabelle, Code werden als passende Elemente gerendert; `<script>alert(1)</script>` und `<b>x</b>` erscheinen als Text, es gibt kein `script`/`b`-Element; Link hat `target="_blank"` und `rel="noopener noreferrer"`; `[x](javascript:alert(1))` hat kein ausführbares `href`.
- Verweist auf: AC-023-4, AC-023-5.
- Abhängig von T2.

### T4 – Markdown-Editor mit Vorschau
- Neu `frontend/src/ideas/MarkdownEditor.tsx`: Props `value`, `onChange`, `label`. Zwei Reiter/Umschalter «Schreiben» / «Vorschau» (`role="tablist"`/`tab`, `aria-selected`). «Schreiben» zeigt CodeMirror mit Markdown-Sprache (Zeilenumbruch an, Mindesthöhe ca. 12 Zeilen, Hell/Dunkel nach Seitenmodus, `aria-label` am Editor). «Vorschau» zeigt `MarkdownView` mit dem aktuellen Text, leer ergibt einen Hinweis «Nichts zur Vorschau». Das Umschalten verändert den Text nicht und speichert nichts (AC-023-2).
- Tests `MarkdownEditor.test.tsx`: Umschalten auf Vorschau rendert den Text (z. B. `# Titel` als Überschrift), Zurückschalten zeigt wieder den Editor mit unverändertem Text, `onChange` wird beim Tippen aufgerufen (CodeMirror in jsdom ggf. über die Textarea-Schnittstelle oder einen gezielt gemockten `@uiw/react-codemirror`).
- Verweist auf: AC-023-1, AC-023-2.
- Abhängig von T2, T3.

### T5 – Formular: Feld im Anlegen und Bearbeiten
- `IdeaForm.tsx`: `Draft.mediationConcept`, `draftFrom` (aus `idea.mediationConcept ?? ''`), `emptyDraft` (`''`), Payload `mediationConcept: draft.mediationConcept`. Neues Feld direkt nach «Beschreibung der Interaktion» bzw. unter der kurzen Beschreibung (Position: nach `description`-Block, mit Hilfetext «Ausführlich, Markdown möglich. Nur auf der Detailseite sichtbar; die kurze Beschreibung oben erscheint in der Übersicht.»). Das Feld ist optional, es gibt keine Pflichtprüfung (AC-023-6). Der Text wird beim Senden nicht verändert.
- Tests `IdeaForm.test.tsx`: Feld «Mediation Concept» ist beim Anlegen vorhanden und leer; Payload enthält `mediationConcept` mit dem getippten Markdown inklusive Zeilenumbrüchen; Bearbeiten einer Idee mit Concept ist vorbelegt und wird unverändert wieder gesendet (AC-023-3); Absenden ohne Concept funktioniert (AC-023-6).
- Verweist auf: AC-023-1, AC-023-3, AC-023-6.
- Abhängig von T1 (Payload-Feld), T2, T4.

### T6 – Detailseite und Master-Prompt
- `IdeaPage.tsx`: Nach dem `description`-Abschnitt einen Abschnitt `ideas.field.mediationConcept` mit `<MarkdownView>`; nur rendern, wenn `idea.mediationConcept?.trim()` nicht leer ist (AC-023-6, D6). Die Überschrift bleibt eine `h2` wie bei `Section`; im Markdown vorkommende `h1` werden kleiner dargestellt, damit die Seitenstruktur bleibt (Teil von T3-Styling).
- `prompt/render.ts` `formatIdea`: Nach den Stichpunkten, falls Concept nicht leer, `\n\n#### Mediation Concept\n<concept getrimmt>` anhängen; `renderPrompt`-Aufbau unverändert (`join('\n\n')` zwischen den Ideen).
- Tests: `IdeaPage.test.tsx` (Concept als Markdown gerendert: Überschrift/Liste/Tabelle; HTML/Skript wird nicht ausgeführt; ohne Concept und bei Leerzeichen-only kein Abschnitt, auch bei einer Idee ohne das Feld im JSON; Übersicht `IdeasList.test.tsx` zeigt weiterhin nur die Beschreibung); `render.test.ts` (Idee mit Concept enthält den Text im Prompt, zwei Ideen mit und ohne Concept, ohne Concept ist die Ausgabe wie bisher; `PromptGenerator.test.tsx` mit einer Idee mit Concept).
- Verweist auf: AC-023-4, AC-023-5, AC-023-6, AC-023-7, AC-023-8.
- Abhängig von T2, T3.

### T7 – Texte, Glossar, Abschluss
- Sprachdateien `de.ts`, `en.ts`, `fr.ts`, `it.ts`: `ideas.field.mediationConcept` («Mediation Concept»), Hilfetext, Reiter «Schreiben»/«Vorschau», Leer-Vorschau, `aria-label` des Editors. Alle vier Dateien gleich vollständig (vorhandener i18n-Test, falls es einen gibt, prüft das).
- Glossar: `ddesk glossary` um «Mediation Concept» (de) / «Mediation concept» (en) mit Definition ergänzen (Ausführliches Vermittlungskonzept einer Idee, Markdown, nur auf der Detailseite).
- `go test ./...`, `npm run typecheck`, `npm test`, `npm run build` müssen grün sein; kurzer manueller Lauf: Idee mit Concept anlegen, Vorschau umschalten, Detailseite, Übersicht, Warenkorb-Prompt, CSV-Import ohne Concept.
- Verweist auf: AC-023-1 bis AC-023-9 (Gesamtprüfung).
- Abhängig von T1 bis T6.

## Abdeckung der Akzeptanzkriterien

| AC | Aufgaben |
|----|----------|
| AC-023-1 | T2, T4, T5, T7 |
| AC-023-2 | T4 |
| AC-023-3 | T1, T5 |
| AC-023-4 | T2, T3, T6 |
| AC-023-5 | T3, T6 |
| AC-023-6 | T1, T5, T6 |
| AC-023-7 | T1, T6 |
| AC-023-8 | T6 |
| AC-023-9 | T1 |
