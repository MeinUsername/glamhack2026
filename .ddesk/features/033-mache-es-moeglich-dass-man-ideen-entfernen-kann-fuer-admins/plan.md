---
id: F-033
---

# F-033 Plan

Ideen werden weich gelöscht: `ideaDoc` erhält `deleted_at` (`*time.Time`, `nil` = aktiv). Firestore findet ein fehlendes Feld nicht mit `where deleted_at == nil`; wie in F-030 (Q-030-18) gibt es deshalb **keine Datenmigration**, sondern einen Filter im Code (`isDeleted(d)`). Alle lesenden Pfade laufen durch diesen einen Filter: Übersicht, Detail, Bilder, `{{allideas}}` (`loadAllIdeas`). Der Warenkorb lädt über `GET /api/ideas/{id}` und wirft Einträge bei 404 bereits still heraus (F-006 D4, `Basket.tsx`); er braucht nur einen Regressionstest. Das Wiederherstellen setzt `deleted_at` zurück; Bilder im Bucket und alle Felder bleiben unangetastet (AC-033-11).

Es gibt im Backend keinen separaten Idea-Export; «Export» in der Spec ist der Prompt/Warenkorb-Pfad und deckt `{{allideas}}` plus Warenkorb ab.

Festlegungen des Plans (Vorschläge, nicht aus der Spec):
- Bearbeiten (`PUT /api/ideas/{id}`) einer gelöschten Idee ergibt 404.
- Der CSV-Import (`loadExistingTitles`) zählt gelöschte Ideen weiterhin als vorhanden, damit ein Re-Import keine Dublette zu einer wiederherstellbaren Idee anlegt.
- Löschen und Wiederherstellen sind idempotent (zweites Löschen: 204, unbekannte ID: 404).
- Die Terms-Ursache ist im Code nicht offensichtlich (`<input type="checkbox" className="mt-1">` ohne Reset); T6 beginnt deshalb mit Reproduktion im Browser, nicht mit einer Vermutung.

**Abstimmung mit F-030** (Plan liegt, noch nicht umgesetzt): F-030 führt `canView(r, d)` für `status` ein. Wird F-030 zuerst umgesetzt, wird `isDeleted` in `canView` integriert (gelöscht ⇒ nie sichtbar, auch nicht für Admins auf der öffentlichen Detail-API); sonst bleibt `isDeleted` eigenständig, und F-030 ruft es mit auf. Der Trash-Endpunkt liest bewusst an `canView` vorbei.

## Aufgaben

- **T1 Datenmodell und Sichtbarkeitsfilter** (AC-033-3, AC-033-11)
  nutzt F-011: Übersicht `apiListIdeas`, F-025: `loadAllIdeas`
  - `ideas.go`: `ideaDoc.DeletedAt *time.Time firestore:"deleted_at"`, `isDeleted(d ideaDoc) bool`.
  - `apiListIdeas` und `loadAllIdeas` überspringen gelöschte Ideen (beim `Limit(maxAllIdeas)` in `loadAllIdeas` nach dem Filter weiterlesen, damit gelöschte Ideen keine Plätze belegen).
  - `apiGetIdea`, `apiIdeaImage`, `apiUpdateIdea`: gelöscht ⇒ 404 «idea not found» (gleiche Antwort wie unbekannte ID).
  - Tests in `ideas_test.go`/`feedbackprompts_test.go`: gelöschte Idee fehlt in Liste, Detail (404), Bild (404), `{{allideas}}`; `isDeleted` als Unit-Test.

- **T2 Löschen und Wiederherstellen (API, Admin)** (AC-033-1, AC-033-2, AC-033-5, AC-033-11, AC-033-12)
  nutzt F-012: `requireAdmin`
  - Neue Datei `ideas_trash.go`:
    - `DELETE /api/ideas/{id}` → `requireAdmin(apiDeleteIdea)`: setzt `deleted_at = now`, 204; 401/403 über `requireAdmin`; unbekannte ID 404.
    - `GET /api/admin/trash` → Liste gelöschter Ideen (`id`, `title`, `deletedAt`, Titelbild-Version), neueste Löschung zuerst.
    - `POST /api/admin/trash/{id}/restore` → `deleted_at = nil` (Firestore `Update` mit `firestore.Delete`/Nullwert), 204; nicht gelöschte oder unbekannte ID 404.
  - Bilder und übrige Felder werden nicht angefasst (nur `Update` auf `deleted_at`, kein `Set`).
  - Routen in `server.go` registrieren; Page-Route `GET /admin/trash` mit `requireAdmin(s.adminPage)`.
  - Tests: Nicht-Admin 403, anonym 401, Löschen → Detail 404, Wiederherstellen → alle Felder und Bilder wieder da, Idempotenz. Bot-Sperre/noindex: ein Test in `robots_test.go`, dass die neuen Pfade `X-Robots-Tag` tragen und Bots 403 bekommen (greift über `botGuard`, kein neuer Code nötig).

- **T3 Löschen-Button auf der Detailseite** (AC-033-1, AC-033-2)
  nutzt F-023: `IdeaPage`
  - `IdeaPage.tsx`: `useMe()`; nur bei `role === 'admin'` Button «Löschen». Bestätigung per `window.confirm` (Abbruch ⇒ keine Anfrage), dann `DELETE /api/ideas/{id}` und Weiterleitung auf `/ideas`; Fehler als `errorText`.
  - Übersetzungen `ideas.delete`, `ideas.delete.confirm`, `ideas.delete.error` in `de/en/fr/it.ts` (`messages.ts` prüft Vollständigkeit).
  - Tests in `IdeaPage.test.tsx`: Button nur für Admin; Bestätigen löscht und leitet um; Abbrechen sendet nichts.

- **T4 Papierkorb-Seite** (AC-033-5, AC-033-11, AC-033-12)
  nutzt F-012: Admin-Navigation in `Layout.tsx`
  - Neue `pages/AdminTrash.tsx`, Route `/admin/trash` in `App.tsx`: Liste (Titel, Löschdatum) mit «Wiederherstellen» je Zeile; nach Erfolg verschwindet die Zeile; leerer Zustand und Fehlertext.
  - Link «Papierkorb» in der Admin-Navigation von `Layout.tsx`.
  - Übersetzungen `nav.trash`, `trash.*` in allen vier Sprachen.
  - Tests `AdminTrash.test.tsx` (Liste, Wiederherstellen, leer); `Layout.test.tsx` um den Admin-Link ergänzen.

- **T5 Warenkorb: gelöschte Idee still entfernen** (AC-033-4)
  nutzt F-006: `Basket.tsx`, `PromptGenerator`
  - Prüfen, dass `BasketEntry` und `PromptGenerator` ein 404 von `GET /api/ideas/{id}` wie «unbekannt» behandeln (Eintrag aus dem Warenkorb und aus `localStorage` entfernen, ohne Fehlermeldung). Falls eine Stelle nur anzeigt statt entfernt, anpassen.
  - Regressionstest in `Basket.test.tsx` mit einer 404-Antwort; Zähler im `BasketButton` aktualisiert sich.

- **T6 Terms-Checkbox in allen Browsern** (AC-033-6)
  nutzt F-028: `IdeaForm.tsx`
  - Ursache zuerst reproduzieren (Neue Idee und Idee bearbeiten, Firefox, Chrome, Safari; Dark Mode; gebautes `static/app` statt Dev-Server prüfen, ob dort ein veralteter Build ausgeliefert wird). Kandidaten: Tailwind-Preflight/`appearance`, Layout (`flex items-start` mit `mt-1` ohne feste Grösse), veralteter eingebetteter Build.
  - Fix: Checkbox mit expliziter Grösse und Farbe (`h-4 w-4 shrink-0 accent-indigo-600`), `required` ergänzen, Label mit `htmlFor`/`id` verbinden; Ursache im Commit/Plan-Notiz festhalten.
  - Regressionstest in `IdeaForm.test.tsx`: Checkbox ist per `getByRole('checkbox', { name: … })` auffindbar und anklickbar, ohne Haken kein Speichern, mit Haken `termsAccepted: true` gesendet; gleich für `IdeaEdit`. Wegen jsdom (kein CSS) zusätzlich Assertion auf die Klassen für Grösse/Sichtbarkeit; die Browser-Prüfung bleibt manuell (Abnahme).
  - `static/app` neu bauen und einchecken (`npm run build` im `frontend/`).

- **T7 Projektname und Claim** (AC-033-8, AC-033-9, AC-033-10)
  nutzt F-007: Texte in allen Sprachen
  - Neue Konstante `frontend/src/brand.ts`: `PROJECT_NAME = 'Good Question'`, `PROJECT_CLAIM = 'A Tool Kit for Art Mediation'`, `PROJECT_TITLE = 'Good Question – A Tool Kit for Art Mediation'`, `CONTACT_EMAIL = 'goodquestion.glamhack@gmail.com'`.
  - `app.name` in allen vier Sprachen auf `PROJECT_TITLE` (unübersetzt, D8); `frontend/index.html` `<title>` ebenso. Prüfen, dass kein Test oder anderer Text die alten Namen («Ideen-Shop», «Idea Shop») als Projektnamen erwartet; die Navigationsbeschriftung `nav.ideas` bleibt «Ideen-Shop».
  - Test in `i18n.test.tsx`: `app.name` ist in allen Sprachen identisch.

- **T8 Landingpage `/`** (AC-033-7, AC-033-8)
  nutzt F-016: `Home.tsx`
  - `Home.tsx` ersetzen: `h1` «Good Question», Claim als Untertitel, zwei grosse Karten (`card`-Stil, gesamte Fläche klickbar): «Ideen-Shop» → `/ideas`, «Feedback-Prompt Download» → `/feedback-prompts`; je eine kurze übersetzte Zeile. Ohne Login erreichbar, keine `useMe`-Abhängigkeit.
  - Alte Keys `home.title/intro/newIdea/signedInAs/toFiles/or/createAccount` entfernen, soweit sie nicht mehr gebraucht werden (nach `grep`); neue Keys `home.card.ideas.*`, `home.card.feedback.*` in vier Sprachen.
  - Go-Seite: `GET /{$}` liefert bereits `serveApp`; prüfen, dass `auth.go` (Redirect auf `/ideas` nach Login) und `spa_test.go` `/` nicht mehr als Weiterleitung erwarten, und Test «/ ist öffentlich und 200» ergänzen.
  - Test `Home.test.tsx`: Name, Claim, beide Links mit richtigem Ziel, Beschriftung je Sprache.

- **T9 Impressum und Terms: Name und E-Mail** (AC-033-9, AC-033-10)
  nutzt F-028: `Imprint.tsx`, `Terms.tsx`
  - `Imprint.tsx`: Projektname als Überschrift/Absatz; im Feld «Kontakt» ein `mailto:`-Link auf `CONTACT_EMAIL` statt Platzhalter; `operator`, `address`, `responsible` bleiben TODO.
  - `Terms.tsx`: Projektname im Einleitungs-/Geltungsbereich-Text (`terms.s1.p`) und neuer Abschnitt `terms.s8` «Kontakt» (Entfernungsanfragen an die E-Mail) bzw. `terms.s6.p` ergänzen; `SECTIONS` und alle vier Sprachen anpassen. Der E-Mail-Link ist ein `mailto:`, die Adresse selbst unübersetzt.
  - Tests in `Legal.test.tsx`: Projektname und `mailto:`-Link im Impressum, E-Mail in den Terms, in de/en/fr/it; verbleibende `data-placeholder`-Felder = 3.

- **T10 Abschluss** (AC-033-1 bis AC-033-12)
  - `go test ./...` und `npm test` im `frontend/` grün; `npm run build`, `static/app` aktualisiert.
  - README/Glossar: Begriffe «Papierkorb» / «Trash» (weich gelöscht) und Projektname ergänzen (`ddesk glossary`).
  - Manuelle Abnahme: Terms-Checkbox in Firefox, Chrome, Safari (AC-033-6); Löschen → Papierkorb → Wiederherstellen mit Bildern (AC-033-11).

## Reihenfolge

T1 → T2 → T3/T4/T5 (parallel möglich) → T10. T6, T7 → T8/T9 sind voneinander unabhängig; T7 vor T8 und T9 wegen `brand.ts`.

## Abdeckung der Akzeptanzkriterien

| AC | Aufgaben |
|----|----------|
| AC-033-1 | T2, T3 |
| AC-033-2 | T2, T3 |
| AC-033-3 | T1 |
| AC-033-4 | T5 |
| AC-033-5 | T2, T4 |
| AC-033-6 | T6 |
| AC-033-7 | T8 |
| AC-033-8 | T7, T8 |
| AC-033-9 | T7, T9 |
| AC-033-10 | T7, T9 |
| AC-033-11 | T1, T2, T4 |
| AC-033-12 | T2, T4 |
