---
id: F-031
---

# F-031 Plan

Eine Idee trägt optional bis zu 20 Links (URL, Titel, Typ). Die Typen sind eine eigene Firestore-Sammlung `link_types`, die Admins pflegen. Die Links liegen als Array im Ideen-Dokument und verweisen per Typ-ID auf den Typ (Antwort Q-031-24). Umbenennen eines Typs wirkt damit sofort auf alle Links. Das Muster für Sammlung, Admin-API und Admin-Seite ist `feedbackprompts.go` bzw. `AdminFeedbackPrompts.tsx` (F-025).

## Entscheidungen aus der Fragerunde

- **Q-031-20 (AC-031-11):** Hängt von F-030 ab. F-030 hat noch keinen Status an der Idee, deshalb wird AC-031-11 hier **nicht umgesetzt**. Aufgabe T9 hält nur fest, was F-030 beachten muss.
- **Q-031-21 (AC-031-10):** Es gibt noch keinen Export (F-010 nur Spec), der CSV-Import (F-015) bleibt unverändert. AC-031-10 wird erst beim Umsetzen von F-010 eingelöst. F-031 stellt dafür die Datenform bereit (T1, T9).
- **Q-031-22 (O1):** Ein Typ hat **einen** Namen ohne Übersetzung. Die Spec-Annahme O1 (de/en) entfällt.
- **Q-031-23 (O2):** Typ-Gruppen werden **alphabetisch** nach Namen sortiert (ohne Gross-/Kleinschreibung), keine Umsortierung durch Admins. Links innerhalb eines Typs bleiben in Eingabereihenfolge.
- **Q-031-24:** Links als Array im Ideen-Dokument, Typ per ID.
- **Q-031-25:** Der Titel ist **optional**. Ist er leer, zeigen Detailseite und Master-Prompt die URL.
- **Q-031-26 (O5):** Ein benutzter Typ lässt sich nicht löschen (AC-031-8). Der letzte Typ darf gelöscht werden. Gibt es keinen Typ, blendet das Formular den Links-Abschnitt aus.
- **Q-031-27:** Die drei Typen werden beim Serverstart einmalig angelegt, wenn die Sammlung leer ist.
- **Q-031-28 (O4):** Keine zusätzliche Spam-Massnahme.

## Aufgaben

- **T1 Backend: Datenmodell und Validierung der Links** (AC-031-2, AC-031-3, AC-031-4)
  In `ideas.go`:
  - Typ `linkDoc` (`url`, `title`, `type_id`) und `linkInput` (JSON `url`, `title`, `typeId`) mit gleicher Form in `ideaView`.
  - `ideaDoc.Links []linkDoc` (`firestore:"links"`), `ideaInput.Links`, `ideaView.Links`; `toIdeaView` gibt `[]` statt `null` zurück. Alte Ideen ohne Feld lesen sich als leere Liste, keine Migration.
  - Konstante `maxLinksPerIdea = 20`, URL-Obergrenze 2048 Zeichen, Titel gegen `maxIdeaTextRunes`.
  - Neue Funktion `checkLinks(in []linkInput, knownTypes map[string]bool) ([]linkDoc, error)`: trimmt Werte; mehr als 20 → `userError`; URL mit `net/url.Parse`, Schema nur `http` oder `https` (Gross-/Kleinschreibung ignorieren), `Host` nicht leer, keine Leerzeichen, sonst `userError`; Titel optional; `typeId` muss ein vorhandener Typ sein, sonst `userError`.
  - `validateIdeaInput` bleibt ohne Firestore-Zugriff. Die Typ-Prüfung geschieht im Aufrufer (Anlegen in `ideas.go`, `PUT` in `ideas_update.go`), der die Typ-IDs einmal lädt und an `checkLinks` übergibt. Ein Link mit unbekanntem Typ lehnt das Backend ab.
  - `PUT` ersetzt das ganze Dokument (`tx.Set`), die Links werden beim Bearbeiten also mitgeschrieben; `ideas_update.go` nur gegenprüfen. Der CSV-Import (`ideas_import.go`) bleibt unverändert und legt `links` leer an.

- **T2 Backend: Link-Typen (Sammlung, Seeding, API)** (AC-031-7, AC-031-8)
  Neue Datei `linktypes.go`, nach dem Muster von `feedbackprompts.go`:
  - Sammlung `link_types`, Dokument `{name, created_at}`, Name getrimmt, nicht leer, höchstens 60 Zeichen, innerhalb der Sammlung eindeutig ohne Gross-/Kleinschreibung (`userError` bei Duplikat).
  - `ensureDefaultLinkTypes(ctx)`: legt Tools, Reference, Institutes an, wenn die Sammlung leer ist. Aufruf beim Serverstart (in `server.go`/`app.go`, dort, wo die übrigen Startschritte laufen). Feste Dokument-IDs, damit ein Doppelstart nichts verdoppelt.
  - Öffentlich `GET /api/link-types` (Liste alphabetisch sortiert, mit `id` und `name`). Öffentlich, weil Formular, Detailseite und Master-Prompt sie ohne Login brauchen (F-012).
  - Admin (`requireAdmin`): `POST /api/admin/link-types`, `PUT /api/admin/link-types/{id}` (umbenennen), `DELETE /api/admin/link-types/{id}`.
  - Löschen: In einer Transaktion bzw. nach Abfrage prüfen, ob eine Idee den Typ nutzt. Firestore kann ein Array von Objekten nicht per `array-contains` auf ein Feld abfragen, deshalb zusätzlich ein Hilfsfeld `ideaDoc.LinkTypeIDs []string` (`link_type_ids`), das beim Speichern aus den Links abgeleitet wird; die Abfrage ist dann `Where("link_type_ids", "array-contains", id).Limit(1)`. Existiert eine Idee, antwortet das Backend mit `userError` und Hinweis «Type is still used by an idea.» (HTTP 409 oder wie `answerFeedback` Fehler abbildet). Das Hilfsfeld wird nicht an die API ausgeliefert.
  - Bekannte Lücke: Ideen, die vor F-031 entstanden, haben keine Links und damit keinen Eintrag; es ist keine Migration nötig.
  - Routen in `server.go` registrieren, dazu `GET /admin/link-types` auf `s.requireAdmin(s.adminPage)` für die Seite (Nicht-Admins verweigert).
  - Firestore-Regeln/Indizes: Prüfen, ob `security.md` oder Index-Dateien für neue Sammlungen angepasst werden müssen, und dort `link_types` ergänzen.

- **T3 Frontend: Typen, API, Texte** (AC-031-1, AC-031-4, AC-031-7)
  - `frontend/src/types.ts`: `IdeaLink` (`url`, `title`, `typeId`), `LinkType` (`id`, `name`), `Idea.links`.
  - `frontend/src/api.ts`: Funktionen für `GET /api/link-types` und die Admin-Aufrufe; Hook `useLinkTypes()` (einmal laden, Cache).
  - `frontend/src/i18n/locales/{en,de,fr,it}.ts`: Texte für Abschnitt «Links», Feldbezeichnungen (URL, Titel, Typ), «Link hinzufügen», «Entfernen», Fehler «ungültige URL», «höchstens 20 Links», Titel der Admin-Seite «Link-Typen», Bedienelemente und Hinweis beim Löschen. `messages.ts` und der i18n-Test verlangen vollständige Schlüssel in allen vier Sprachen.
  - `frontend/src/ideas/rules.ts`: `isValidLinkUrl(value)` (nur `http`/`https`, Host vorhanden, kein Leerzeichen; gleiche Regeln wie das Backend, nicht strenger) und `MAX_LINKS = 20`; Test in `rules.test.ts`.

- **T4 Frontend: Formular-Abschnitt «Links»** (AC-031-1, AC-031-2, AC-031-3, AC-031-4)
  In `IdeaForm.tsx` (Anlegen und Bearbeiten teilen sich das Formular):
  - Draft, `fromIdea`, Leer-Draft und Payload `data` um `links` erweitern.
  - Neuer `fieldset` «Links» **hinter** dem Credit-Block und **vor** dem `MarkdownEditor` des Mediation Concepts (das Concept bleibt letztes Feld, F-026). Er ist ohne Login bedienbar.
  - Pro Zeile: URL-Eingabe, Titel-Eingabe (optional), Typ-Auswahl aus `useLinkTypes()`, Schaltfläche «Entfernen». Schaltfläche «Link hinzufügen» ist bei 20 Links deaktiviert (AC-031-3). Neue Zeilen wählen den ersten Typ vor.
  - In `handleSubmit` vor dem Senden jede URL mit `isValidLinkUrl` prüfen. Bei Fehler wird nicht gesendet, `error` nennt die Zeile. Ganz leere Zeilen (URL und Titel leer) werden beim Senden verworfen.
  - Gibt es keine Typen, entfällt der Abschnitt (Q-031-26). Bestehende Links mit gelöschtem Typ gibt es nicht, da das Löschen verweigert wird.

- **T5 Frontend: Detailseite** (AC-031-5, AC-031-6)
  In `IdeaPage.tsx` nach `<Credit …/>` und vor dem Mediation-Concept-Abschnitt eine Komponente `Links`:
  - Gruppiert nach Typ, Typen alphabetisch (ohne Gross-/Kleinschreibung), Überschrift je Typ, Links in Eingabereihenfolge.
  - Text des Links ist der Titel, sonst die URL. `<a href target="_blank" rel="noopener noreferrer">`.
  - Ohne Links (oder ohne einen Link mit bekanntem Typ) wird der ganze Abschnitt nicht gerendert.
  - Die gemeinsame Gruppierung/Sortierung kommt als reine Funktion `groupLinks(links, types)` nach `frontend/src/ideas/links.ts`, damit T6 sie wiederverwendet.

- **T6 Master-Prompt** (AC-031-9)
  In `frontend/src/prompt/render.ts` (`formatIdea`): Hat die Idee Links, kommt hinter der Credit-Line und **vor** dem Mediation-Concept-Block ein Abschnitt «Links» als Liste je Typ (`- Tools:` gefolgt von `  - Titel: URL`, bei leerem Titel nur die URL). Gruppierung über `groupLinks`. `formatIdea` braucht dazu die Typen als zusätzliches Argument. Die Aufrufer (`PromptGenerator.tsx` und weitere) laden sie über `useLinkTypes()`. Master-Prompt-Vorlagen und `masterprompt.go` bleiben unverändert.

- **T7 Admin-Seite «Link-Typen»** (AC-031-7, AC-031-8)
  - Neue `frontend/src/pages/AdminLinkTypes.tsx` nach dem Muster von `AdminFeedbackPrompts.tsx`: Liste, Anlegen, Umbenennen, Löschen mit Bestätigung. Fehler beim Löschen eines benutzten Typs zeigt den Hinweis des Backends.
  - Route `/admin/link-types` in `App.tsx`, Eintrag in der Admin-Navigation (`Layout.tsx`).
  - Nicht-Admins: Seite wird serverseitig von `requireAdmin` verweigert, der Client verhält sich wie bei den anderen Admin-Seiten.

- **T8 Tests** (alle umgesetzten AC)
  - Backend `ideas_test.go` / neuer `linktypes_test.go`: `checkLinks` (leer gültig, 20 gültig, 21 abgelehnt, `ftp://`, `javascript:`, `http:/x`, kein Host, Leerzeichen abgelehnt, `HTTPS://Beispiel.ch` akzeptiert, unbekannter Typ abgelehnt, Titel optional und getrimmt; AC-031-2/3/4); Typ-Validierung (leer, zu lang, Duplikat); Seeding legt drei Typen nur bei leerer Sammlung an und ist idempotent; Löschen verweigert, wenn eine Idee den Typ nutzt, sonst erlaubt (AC-031-7/8); `ideaDoc.LinkTypeIDs` wird aus den Links abgeleitet. Admin-Routen verweigern Nicht-Admins (Muster `public_test.go` bzw. `feedbackprompts_test.go`); `GET /api/link-types` öffentlich. Falls Firestore nur über den Emulator testbar ist, folgen die Tests dem vorhandenen Muster.
  - `rules.test.ts`: `isValidLinkUrl`.
  - `IdeaForm.test.tsx`: Abschnitt liegt nach Credit und vor Concept (AC-031-1); Link hinzufügen, Payload enthält ihn, Bearbeiten füllt vor (AC-031-2); Hinzufügen bei 20 Links gesperrt (AC-031-3); ungültige URL sendet nicht (AC-031-4); ohne Login bedienbar.
  - `IdeaPage.test.tsx`: Gruppen mit Überschriften, alphabetisch, Eingabereihenfolge im Typ, vor dem Concept (AC-031-5); URL als Text bei leerem Titel; `target="_blank"` und `rel="noopener noreferrer"` (AC-031-6); ohne Links kein Abschnitt.
  - `render.test.ts`: Liste je Typ, Reihenfolge vor dem Concept, Idee ohne Links unverändert (AC-031-9). Bestehende Erwartungen bleiben grün.
  - Neu `AdminLinkTypes.test.tsx`: Anlegen, Umbenennen, Löschen, Hinweis bei Verweigerung (AC-031-7/8).
  - `i18n.test.tsx` deckt die neuen Schlüssel in allen Sprachen ab.

- **T9 Übergabe an F-010 und F-030** (AC-031-10, AC-031-11: nicht umgesetzt)
  Keine Code-Änderung, nur Dokumentation in dieser Datei und beim Abschluss des Features:
  - **F-010 (AC-031-10):** Der Export muss `links` (Array von `{url, title, typeId}`) **und** die Sammlung `link_types` (`id`, `name`) mitführen, der Import beide einlesen (Typen zuerst, damit die IDs stimmen; vorhandene IDs werden ersetzt). Das Hilfsfeld `link_type_ids` wird beim Import neu abgeleitet. Die Kriterien AC-031-10 bleiben bis dahin offen.
  - **F-030 (AC-031-11):** Der Weg `PUT /api/ideas/{id}` läuft bereits über `validateIdeaInput`. F-030 muss eine Änderung von `links` wie jede andere Änderung der Idee behandeln (zurück auf `pending`, Admins benachrichtigen). Der Vergleich «geändert?» muss das Array `links` einschliessen. AC-031-11 bleibt bis dahin offen.

- **T10 Verifikation** (alle umgesetzten AC)
  `go test ./...` und `npm test` im Ordner `frontend` laufen grün. `ideas_import.go`, `masterprompt.go` und `IdeasList.tsx` bleiben unverändert. Manuell: Idee mit Links anlegen und bearbeiten, Detailseite, Master-Prompt, Admin-Seite (Anlegen, Umbenennen, Löschen eines benutzten und eines freien Typs).

## Reihenfolge

T1 und T2 sind unabhängig. T3 folgt nach T2 (API-Form). T4, T5, T6 und T7 folgen auf T3 (T5 und T6 teilen `links.ts`, es entsteht in T5). T8 begleitet die Aufgaben, T9 ist Dokumentation, T10 zuletzt.

## Offene Abhängigkeiten

- AC-031-10 wartet auf F-010, AC-031-11 auf F-030 (siehe T9). Beide Kriterien sind mit diesem Plan nicht abgedeckt.
