# F-014 Erweitern von Seiten Template und Übersichtsseite – Implementierungsplan

Grundlage: `spec.md` (Ziel, Felder, D1–D6) und `acceptance.md` (AC-014-1 bis AC-014-6).
Bestand: F-002 ist umgesetzt (`48d2576`). Betroffen sind `ideas.go`, `ideas_test.go`, `frontend/src/ideas/*`, `frontend/src/types.ts`, `frontend/src/prompt/render.ts` und die Locale-Dateien unter `frontend/src/i18n/locales/`.

Hinweis: `ARCHITECTURE.md` und `docs/feature-workflow.md` sind im Repository nicht vorhanden. Dieser Plan folgt dem Muster der Pläne F-002 und F-008.

## Bestätigte Rückfragen

- **Q-014-06 (D6, Vorabantwort «1»):** Die Übersicht bleibt bei Titel und Bild. Die Kurzbeschreibung kommt laut Q-014-08 hinzu.
- **Q-014-08 = 2:** Die Übersicht zeigt je Idee das Feld «Beschreibung» vollständig (nicht gekürzt).
- **Q-014-09 = 2:** Kein Migrationsbefehl. Alte Dokumente mit `audience` werden beim Lesen als `target_group` behandelt.

## Festlegungen dieses Plans

- **Neue Schlüssel (Firestore, Collection `ideas`):** `target_group` (ersetzt `audience`), `description_of_interaction`, `staff_needed`, `exhibit_related`. Alle Strings, leer erlaubt, maximal 5.000 Zeichen wie die übrigen Textfelder (F-002).
- **JSON-Namen (camelCase, wie `areaM2`):** `targetGroup`, `descriptionOfInteraction`, `staffNeeded`, `exhibitRelated`. Die Form sendet und die API liefert diese Namen. T1 legt sie fest, T4 bis T8 bauen darauf auf.
- **Lesefallback für Altbestand:** `ideaDoc` erhält `LegacyAudience` (`firestore:"audience"`), nur zum Lesen. Ist `target_group` leer, wird der Wert von `audience` übernommen. Geschrieben wird nur noch `target_group`. Es gibt keine Migration (Q-014-09).
- **Übersicht (Q-014-08):** `ideaSummary` erhält `description` (vollständiger Text des Feldes «Beschreibung»). Die Liste zeigt Titel, Bild, Beschreibung und den Korb-Button. Die neuen Felder erscheinen dort nicht.
- **Umbenennung:** Das Feld «Zielpublikum» heißt im Code `target group` mit Schlüssel `target_group`. Der i18n-Schlüssel wird von `ideas.field.audience` nach `ideas.field.targetGroup` umbenannt. Die vorhandenen Übersetzungen bleiben (de «Zielpublikum», en «Target audience», fr, it).
- **Labels der drei neuen Felder:** Der englische Text aus der Vorlage (`description of interaction`, `staff needed`, `necessarily related to specific exhibits`) steht in allen vier Sprachen. Übersetzung ist laut Spec nicht Teil des Features. Entscheidung des Plans, bitte beim Review prüfen.
- **Space, Bilder, Sustainability, Budget, Kategorien (D2, D3, D5):** unverändert. Die Validierung von `parseArea`, die Bildprüfung und die Kategorien bleiben.
- **Text trimmen:** Wie bisher werden Textfelder an den Rändern getrimmt. Zeilenumbrüche und Leerzeichen im Inneren bleiben erhalten (AC-014-4).
- **Bilder (AC-014-5):** Einen Bearbeiten-Pfad gibt es noch nicht (F-004). AC-014-5 wird deshalb beim Anlegen geprüft: 6 Bilder, über 5 MB oder falsches Format werden abgelehnt, und es wird nichts gespeichert.

## Aufgaben

### T1 – Datenmodell und Eingabe (Backend)
- `ideas.go`: In `ideaDoc` `Audience` durch `TargetGroup` (`target_group`) ersetzen. Neu: `DescriptionOfInteraction`, `StaffNeeded`, `ExhibitRelated`, jeweils als Firestore-Feld. `LegacyAudience` (`audience`) nur zum Lesen.
- `ideaInput` und `ideaView`: JSON-Felder `targetGroup`, `descriptionOfInteraction`, `staffNeeded`, `exhibitRelated`.
- `validateIdeaInput`: die drei neuen Textfelder in die Längenprüfung und ins Trimmen aufnehmen. Das Feld `Audience` wird in der Map durch `TargetGroup` ersetzt.
- Verweist auf: AC-014-1 (Felder vorhanden), AC-014-2 (Schlüssel `target_group`), AC-014-4 (Textfelder unverändert).

### T2 – Abruf mit Fallback und Übersicht (Backend)
- `toIdeaView`: `targetGroup` aus `TargetGroup`, falls leer aus `LegacyAudience`. Die neuen Textfelder unverändert durchreichen.
- `ideaSummary`: Feld `Description` (`json:"description"`). `apiListIdeas` füllt es aus `d.Description`. Keine der neuen Felder in die Liste.
- Verweist auf: AC-014-2 (Altbestand bleibt lesbar), AC-014-6 (Übersicht).
- Abhängig von T1.

### T3 – Tests Backend (`ideas_test.go`, Namen nach dem Muster `TestAC014_x_...`)
- `TestAC014_1_FormFieldsRoundTrip`: JSON mit allen neuen Feldern dekodieren, durch `validateIdeaInput` und `toIdeaView` schicken, Werte prüfen.
- `TestAC014_2_TargetGroupUnderNewKey`: neues Dokument mit `TargetGroup` liefert `targetGroup`. Altes Dokument nur mit `LegacyAudience` liefert denselben Wert über `targetGroup`. Ist beides gesetzt, gewinnt `target_group`.
- `TestAC014_3_SpaceNumbersOrReject`: beide Zahlen gespeichert, nicht-numerischer Wert ergibt Fehler. Ergänzt `TestAC002_5`, falls dort ein Fall fehlt.
- `TestAC014_4_NewTextFieldsKeepInnerNewlines`: Zeilenumbrüche im Inneren bleiben erhalten. Je neuem Feld wird 5.001 Zeichen abgelehnt.
- `TestAC014_5_ImageLimitsAtCreation`: 6 Bilder, über 5 MB und falsches Format ergeben Fehler in `readIdeaImages`, ohne Firestore-Zugriff. Ergänzt `TestAC002_3_*` um die Fälle aus AC-014-5.
- `TestAC014_6_SummaryHasOnlyTitleImageDescription`: JSON von `ideaSummary` enthält genau `id`, `title`, `imageCount`, `description`.
- Verweist auf: AC-014-1 bis AC-014-6.
- Abhängig von T1 und T2.

### T4 – Typen und Prompt-Generator (Frontend)
- `frontend/src/types.ts`: `Idea.audience` wird zu `targetGroup`. Neu: `descriptionOfInteraction`, `staffNeeded`, `exhibitRelated` (je `string`).
- `frontend/src/prompt/render.ts`: Zeile «Zielgruppe» liest `idea.targetGroup`. Der Ausgabetext bleibt gleich.
- Testdaten umbenennen in `render.test.ts`, `PromptGenerator.test.tsx`, `Basket.test.tsx`, `AdminMasterPrompt.test.tsx`, `IdeaForm.test.tsx`, `IdeaPage.test.tsx`. Die Typprüfung soll keine Fehler mehr zeigen.
- Verweist auf: AC-014-2.
- Abhängig von T1 (JSON-Namen).

### T5 – Übersetzungen (i18n)
- In `de.ts`, `en.ts`, `fr.ts`, `it.ts`: `ideas.field.audience` wird zu `ideas.field.targetGroup`, Werte bleiben.
- Neue Schlüssel in allen vier Dateien: `ideas.field.descriptionOfInteraction`, `ideas.field.staffNeeded`, `ideas.field.exhibitRelated` mit dem englischen Text aus der Vorlage.
- Prüfen, ob `i18n.test.tsx` Schlüsselgleichheit prüft, und ob weitere Verweise auf den alten Schlüssel existieren.
- Verweist auf: AC-014-1 (Labels im Formular).

### T6 – Erfassungsformular (`IdeaForm.tsx`)
- `Draft` und `emptyDraft`: `audience` wird zu `targetGroup`. Neu: `descriptionOfInteraction`, `staffNeeded`, `exhibitRelated`.
- Felder einfügen: `descriptionOfInteraction` nach «Beschreibung», `staffNeeded` und `exhibitRelated` nach «Space». Das Feld `targetGroup` ist als Textfeld wie bisher. Die drei neuen Felder sind mehrzeilige Textareas.
- JSON-Payload um die neuen Namen erweitern.
- Verweist auf: AC-014-1 (Formular enthält alle Felder), AC-014-4 (Speichern der Texte).
- Abhängig von T4 und T5.

### T7 – Darstellung der Seite (`IdeaPage.tsx`)
- Abschnitt «Zielpublikum» wird zu `targetGroup` mit Schlüssel `ideas.field.targetGroup`. Neue Abschnitte für die drei Felder über die vorhandene `Section`-Komponente. Leere Felder zeigen «—».
- Verweist auf: AC-014-2 (Abruf), AC-014-4 (Anzeige unverändert).
- Abhängig von T4 und T5.

### T8 – Übersicht (`IdeasList.tsx`)
- `IdeaRow` erhält `description`. Die Beschreibung wird vollständig unter dem Titel angezeigt, Zeilenumbrüche bleiben erhalten (`whitespace-pre-line`). Ist sie leer, entfällt die Zeile.
- Bild, Titel und Korb-Button bleiben unverändert (F-011).
- Verweist auf: AC-014-6.
- Abhängig von T2.

### T9 – Tests Frontend und Abnahme
- Vitest und React Testing Library: `IdeaForm.test.tsx` (neue Felder werden gesendet, `targetGroup` im Payload), `IdeaPage.test.tsx` (neue Abschnitte, Umbenennung), `IdeasList.test.tsx` (Beschreibung wird angezeigt, neue Felder nicht).
- Vorab: `go vet ./...`, `go test ./...`; im Verzeichnis `frontend/`: `npx tsc --noEmit`, `npx vitest run`, `npm run build`.
- Manuell gegen Firestore oder Emulator, falls verfügbar: eine Seite mit altem Feld `audience` anlegen und abrufen, Ergebnis dokumentieren. Ohne Emulator wird das im Abnahmebericht vermerkt.
- Verweist auf: alle AC-014-1 bis AC-014-6.

## Reihenfolge

T1 → T2 → T3 (Backend). T1 legt die JSON-Namen fest, danach kann T4 starten. T4 → T5 → (T6, T7, T8 parallel). T9 zuletzt.

## Abhängigkeiten zu anderen Features

- **F-002 Eine Seite-Template:** Basis für Erfassung, Speichern, Abruf und Bildprüfung. Der Code ist vorhanden.
- **F-003 Prompt-Generator:** `render.ts` liest `targetGroup`. Die Zeile «Zielgruppe» im Prompt bleibt.
- **F-007 Mehrsprachigkeit:** Neue Schlüssel und die Umbenennung in allen vier Locale-Dateien.
- **F-009 Kategorien:** bleiben erhalten (D5), keine Änderung.
- **F-011 Übersichtseite:** Die Angabe «Keine weiteren Felder» in F-011 D5 wird durch Q-014-08 ergänzt. Die Beschreibung kommt zur Übersicht hinzu. Die Spec von F-011 sollte dazu angepasst werden. Der Plan ändert sie nicht.

## Offen und zur Kenntnis

- **AC-014-2 Wortlaut «altes Feld nicht mehr vorhanden»:** Alte Dokumente behalten `audience` in Firestore, bis sie neu gespeichert werden. Es gibt aber noch keinen Bearbeiten-Pfad (F-004). Der Abruf liefert `targetGroup` in jedem Fall. Dies folgt aus Q-014-09 = 2.
- **AC-014-5 «bestehende Bilder bleiben unverändert»:** Ohne Bearbeiten-Pfad ist nur die Ablehnung beim Anlegen prüfbar.
- **AC-014-6 Begriff «Kurzbeschreibung»:** Nach Q-014-08 ist es das vollständige Feld «Beschreibung». Die Liste kann dadurch bei langen Texten (bis 5.000 Zeichen) lang werden. Der Plan kürzt nichts. Falls das stört, ist das eine neue Rückfrage.
- **AC-014-4 «unverändert»:** Trimmen an den Rändern bleibt (siehe Festlegungen).
- **Labels:** Englisch in allen Sprachen für die drei neuen Felder. Zu prüfen beim Review.
- **Textlänge der neuen Felder** (5.000 Zeichen) ist eine eigene Entscheidung des Plans, übernommen aus F-002.
