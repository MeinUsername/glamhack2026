# F-018 Mehre Masterprompt für verschiedene Detailierungsgrade – Implementierungsplan

Grundlage: `spec.md` (Entscheidungen D1–D8) und `acceptance.md` (AC-018-1 bis AC-018-7).
Bestand: `masterprompt.go` (F-008: Collection `master_prompt_versions`, Versionen mit Transaktion, `checkMasterPromptText`, Routen `GET /api/master-prompt`, `GET/POST /api/admin/master-prompt`, `POST …/versions/{n}/restore`), `frontend/src/pages/AdminMasterPrompt.tsx`, `frontend/src/prompt/PromptGenerator.tsx` (Kopieren/Herunterladen), `frontend/src/prompt/render.ts` (`renderPrompt`, `unknownVariables`), i18n unter `frontend/src/i18n/locales/{de,en,fr,it}.ts` mit `LANGUAGES` aus `i18n/index.ts`.
Hinweis: `docs/feature-workflow.md` und `ARCHITECTURE.md` existieren im Repo nicht; der Plan stützt sich auf Spec, Code und den Plan von F-008.

## Rückfragen

Keine offenen Rückfragen. Die Spec entscheidet D1–D8; die Punkte aus «Offene Punkte für den Plan» sind unten als Festlegungen getroffen. Die vier unbestätigten Annahmen der Spec (englischer Rückfall, «erster» = erster in Admin-Reihenfolge, Dialog abbrechbar, Vorschau zeigt gewählten Detailgrad) gelten unverändert.

## Festlegungen

- **Speicher.** Neue Collection `prompt_levels`, ein Dokument je Detailgrad: `titles` (Map Sprache→Text), `descriptions` (Map Sprache→Text), `position` (int), `created_at`. Dokument-ID: Slug-freier Zufallswert (Firestore Auto-ID); der migrierte Detailgrad bekommt die feste ID `standard`.
- **Versionen je Detailgrad** als Subcollection `prompt_levels/{id}/versions/{000001}` mit denselben Feldern wie `promptVersionDoc` (`number`, `text`, `author_id`, `author_email`, `created_at`). Nummerierung je Detailgrad ab 1, in einer Transaktion (max + 1), Regel «gleicher Text = keine neue Version» bleibt (`planAppend` wird wiederverwendet).
- **Titel und Beschreibung.** Pflicht ist `en` (nicht leer); `de`, `fr`, `it` optional. Grenzen: Titel max. 80, Beschreibung max. 500 Zeichen je Sprache. Prompt-Text: bestehende Prüfung (`checkMasterPromptText`: nicht leer, max. 20 000 Zeichen, nur `{{ideas}}` und `{{language}}`) – gilt für alle Detailgrade gleich (AC-018-6).
- **Speichern eines Detailgrads** ist ein Vorgang: Metadaten (Titel, Beschreibung) werden aktualisiert, und der Text wird als neue Version angehängt, wenn er sich vom aktuellen unterscheidet. Beim Anlegen entsteht immer Version 1.
- **Reihenfolge** über `position`; neue Detailgrade kommen ans Ende. Ändern der Reihenfolge schreibt die Positionen aller Detailgrade in einer Batch-Operation. Lesen sortiert nach `position`, bei Gleichstand nach `created_at`.
- **Löschen** entfernt das Dokument samt Versionen; der letzte verbleibende Detailgrad wird abgelehnt (409/400 mit Meldung, AC-018-2). Prüfung und Löschen in einer Transaktion.
- **Migration (D6, AC-018-7).** `migrateMasterPrompt(ctx)` läuft beim Start in `newServer` nach `ensureInitialAdmin` (Fehler wird geloggt, App startet trotzdem, wie F-012). Ablauf, idempotent: Gibt es mindestens einen Eintrag in `prompt_levels`, passiert nichts. Sonst werden alle Dokumente aus `master_prompt_versions` unverändert (Nummern, Autor, Zeitstempel) als Versionen von `prompt_levels/standard` kopiert; Titel `en: "Standard"`, `de: "Standard"`, `position: 0`. Gibt es keine alten Versionen, wird kein Detailgrad angelegt (dann ist die Liste leer, bis der Admin einen anlegt). Die alte Collection bleibt unangetastet (kein Datenverlust, Rückweg möglich). Alter Code schreibt danach nicht mehr dorthin, weil die alten Routen ersetzt werden.
- **API-Anpassung.** Die F-008-Routen werden ersetzt (die einzigen Aufrufer sind die beiden Frontend-Seiten):
  - `GET /api/prompt-levels` (`requireSignedIn`, alle Rollen, D8): `[{ id, title, description, text, version }]` in Reihenfolge, Titel und Beschreibung als Map `{de,en,fr,it}`; das Frontend wählt die UI-Sprache mit Rückfall auf `en`. Der Text ist enthalten, damit der Dialog ohne zweiten Aufruf auskommt. Liste leer → `200 []`.
  - `GET /api/admin/prompt-levels` (`requireAdmin`): wie oben, zusätzlich je Detailgrad alle Versionen (neueste zuerst, mit Autor und Zeitstempel).
  - `POST /api/admin/prompt-levels` – anlegen; `PUT /api/admin/prompt-levels/{id}` – speichern; `DELETE /api/admin/prompt-levels/{id}`; `PUT /api/admin/prompt-levels/order` mit `{ ids: [...] }` (muss genau die vorhandenen IDs enthalten); `POST /api/admin/prompt-levels/{id}/versions/{n}/restore`.
  - `GET /api/master-prompt` und `/api/admin/master-prompt…` entfallen. Die Seite `/admin/master-prompt` bleibt unter diesem Pfad (Navigation, Lesezeichen).
  - Fehlerformat wie F-008: `400 { error, unknown: [...] }` bei unbekannten Variablen, `404` bei fehlendem Detailgrad oder Version, `userError` für Eingabefehler.
- **Frontend-Auswahl (D2, D8).** `PromptGenerator` lädt `/api/prompt-levels`. Bei ≥ 2 Detailgraden öffnet Klick auf Kopieren oder Herunterladen einen Dialog (Radio-Liste, erster vorausgewählt, Titel und Beschreibung in UI-Sprache, Rückfall `en`), Buttons «Bestätigen» und «Abbrechen»; Abbruch (Button, Escape) tut nichts. Bei genau einem Detailgrad läuft die Aktion direkt. Die Vorschau auf der Korbseite zeigt den Detailgrad, der zuletzt gewählt wurde, vor der ersten Wahl den ersten; die Auswahl wird nicht gespeichert (nicht im Umfang). Dialog: natives `<dialog>` mit `showModal()` (Fokus, Escape, Tastatur geschenkt).
- **Keine neuen Variablen** (Umfang); `renderPrompt` bleibt unverändert.

## Aufgaben

### T1 – Modell und Validierung (Backend, pure Funktionen)
- Neue Datei `promptlevels.go`: Typen `promptLevelDoc`, Eingabetyp mit `Titles`, `Descriptions`, `Text`; `checkLevelInput(in)` prüft: `en`-Titel und `en`-Beschreibung nicht leer, nur Sprachen aus `de|en|fr|it`, Längen, Prompt-Text via bestehendes `checkMasterPromptText`. Leere Einträge optionaler Sprachen werden verworfen.
- `masterprompt.go`: Konstante `masterPromptCollection` wird zu `legacyMasterPromptCollection` (nur noch Migration); `planAppend`, `versionDocID`, `findVariables`, `unknownVariables`, `checkMasterPromptText` bleiben.
- `planOrder(existing []string, requested []string) error` (pure): verlangt dieselbe Menge ohne Duplikate.
- Verweist auf: AC-018-1 (Pflichtangaben), AC-018-6 (gleiche Variablenprüfung für alle).

### T2 – Speicher je Detailgrad (Backend)
- `promptlevels.go`: `listPromptLevels`, `createPromptLevel`, `savePromptLevel` (Metadaten + Version in einer Transaktion über `planAppend`), `deletePromptLevel` (Transaktion: Anzahl prüfen, Versionen und Dokument löschen), `reorderPromptLevels`, `restorePromptLevelVersion` (neue Version mit altem Text, nichts wird gelöscht).
- `appendVersion` aus `masterprompt.go` wird auf eine Level-ID parametrisiert (Subcollection statt fester Collection); `latestPromptVersion`/`listMasterPromptVersions` entsprechend.
- Verweist auf: AC-018-1 (legt Version 1 an), AC-018-2 (Bearbeiten, Löschen, Reihenfolge, letzter bleibt), AC-018-3 (Wiederherstellen).

### T3 – Migration (Backend)
- `migrateMasterPrompt(ctx)` wie unter Festlegungen, aufgerufen in `newServer` nach `ensureInitialAdmin`. Idempotent; Schreibvorgang in Batches (Firestore-Limit 500) – oder Transaktion, wenn die Versionszahl klein ist (Batches genügen, da die Prüfung «`prompt_levels` leer» vor dem Start liegt und das Level-Dokument zuletzt geschrieben wird, so dass ein Abbruch beim nächsten Start wiederholt wird).
- Verweist auf: AC-018-7.

### T4 – API und Routen (Backend)
- `server.go`: neue Routen aus «API-Anpassung» registrieren, alte `master-prompt`-API-Routen entfernen, `GET /admin/master-prompt` bleibt. Handler in `promptlevels.go`; `answerVersion` wird für Level-Antworten wiederverwendet.
- `GET /api/prompt-levels` mit `requireSignedIn`, Admin-Routen mit `requireAdmin`.
- Verweist auf: AC-018-1 bis AC-018-3, AC-018-6 (alle Rollen sehen alle Detailgrade und Texte).

### T5 – Admin-Seite (Frontend)
- `AdminMasterPrompt.tsx` umbauen: links/oben Liste der Detailgrade (Titel in UI-Sprache, Auf/Ab-Knöpfe für die Reihenfolge, «Neu», «Löschen» mit Bestätigung; «Löschen» deaktiviert beim letzten Detailgrad). Rechts/unten der Editor des gewählten Detailgrads: Titel- und Beschreibungsfelder je Sprache (en markiert als Pflicht), Textbereich mit Quelltext/Vorschau-Umschalter, Speichern deaktiviert ohne Änderung, Variablenprüfung vor dem Absenden (wie F-008), Versionsliste mit «Wiederherstellen».
- Vorhandene Teile (Variablenprüfung, Vorschau mit Korb, Versionsliste) werden in Unterkomponenten übernommen, nicht neu geschrieben.
- Verweist auf: AC-018-1, AC-018-2, AC-018-3, AC-018-6.

### T6 – Auswahldialog im Prompt-Generator (Frontend)
- `PromptGenerator.tsx`: `/api/prompt-levels` statt `/api/master-prompt`; Zustandsmodell `levels` + `selectedId`. Neue Komponente `prompt/LevelDialog.tsx` (natives `<dialog>`). Kopieren/Herunterladen rufen `run(action)` auf: bei ≥ 2 Detailgraden Dialog, sonst direkt (AC-018-5); nach Bestätigung wird mit dem Text des gewählten Detailgrads gerendert (`renderPrompt`) und die Aktion ausgeführt.
- Hilfsfunktion `pickLocalized(map, lang)` (UI-Sprache, Rückfall `en`) in `i18n/` oder `prompt/`.
- Liste leer → vorhandene Meldung `prompt.noVersion`; Fehler → `prompt.loadError`.
- Verweist auf: AC-018-4, AC-018-5, AC-018-6.

### T7 – Übersetzungen
- Neue Schlüssel in `en.ts` (Quelle), `de.ts`, `fr.ts`, `it.ts` (Typ `MessageKey` erzwingt Vollständigkeit): Detailgrad-Verwaltung (Neu, Löschen, Bestätigung, «letzter Detailgrad kann nicht gelöscht werden», Reihenfolge, Titel/Beschreibung je Sprache, «Pflicht»), Dialog (Titel «Detailgrad wählen», Bestätigen, Abbrechen). Bestehende `masterPrompt.*`-Schlüssel werden angepasst, nicht verdoppelt.
- Verweist auf: AC-018-2, AC-018-4.

### T8 – Tests
- Go (`promptlevels_test.go`, Namen `TestAC018_<n>_…`, Muster `masterprompt_test.go`; reine Funktionen ohne Firestore, wo möglich):
  - AC-018-1: `checkLevelInput` akzeptiert Titel/Beschreibung nur mit `en`, lehnt fehlendes `en` und leeren Text ab.
  - AC-018-2: `planOrder` (gleiche Menge, Duplikate, fehlende ID); Löschentscheidung `canDelete(count)` lehnt beim letzten ab.
  - AC-018-3: `planAppend`-Fälle für Wiederherstellen (Version 2 bei aktuell 4 → 5, gleicher Text → keine neue).
  - AC-018-6: dieselbe Variablenprüfung für jeden Text; `{{foo}}` wird abgelehnt.
  - AC-018-7: `planMigration(legacy []promptVersionDoc, levelsExist bool)` (pure): kopiert Nummern und Texte nach `standard`, tut nichts bei vorhandenen Detailgraden oder ohne Altbestand.
  - Rollenzugriff: `guardAdmin` für Admin-Routen, `requireSignedIn` für `GET /api/prompt-levels` (Muster der vorhandenen Tests).
- Frontend (Vitest):
  - `PromptGenerator.test.tsx`: AC-018-4 (zwei Detailgrade: Klick auf Kopieren öffnet Dialog, Aktion erst nach Wahl, gewählter Text wird kopiert; Titel/Beschreibung in UI-Sprache mit englischem Rückfall; Abbrechen tut nichts; erster ist vorausgewählt), AC-018-5 (ein Detailgrad: kein Dialog, `clipboard.writeText`/Download direkt), Download-Variante ebenso.
  - `AdminMasterPrompt.test.tsx`: AC-018-1 (Speichern deaktiviert ohne Änderung, `en` Pflicht), AC-018-2 (Löschen beim letzten Detailgrad deaktiviert, Reihenfolge-Aufruf), AC-018-3 (Wiederherstellen ruft Endpunkt auf), AC-018-6 (Variablenmeldung nennt `foo`).
  - Bestehende F-008- und F-003-Tests an die neuen Endpunkte anpassen.
- Verweist auf: AC-018-1 bis AC-018-7.

## Risiken und Hinweise

- **Reihenfolge der Auslieferung:** Backend (T1–T4) und Frontend (T5–T7) müssen zusammen ausgerollt werden, da die alten Routen entfallen. Die Migration (T3) läuft beim ersten Start des neuen Servers; bis dahin sind die alten Daten unverändert vorhanden.
- **Parallele Starts** (mehrere Cloud-Run-Instanzen): Die Migration schreibt feste IDs (`standard`, `000001…`) mit `Set`; doppelte Läufe überschreiben mit identischen Daten und sind harmlos.
- **Löschen ist endgültig** (inkl. Versionen), da D4 nur Wiederherstellen früherer Versionen eines bestehenden Detailgrads verlangt; das UI fragt vor dem Löschen nach.

## Reihenfolge

T1 → T2 → T3 → T4 (Backend, Tests dazu je Schritt) → T6 und T5 (parallel, sobald T4 steht) → T7 (begleitet T5/T6) → T8 (Frontend-Tests nach T5/T6).
