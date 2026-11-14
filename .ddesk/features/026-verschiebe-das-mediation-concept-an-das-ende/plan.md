---
id: F-026
---

# F-026 Plan

Reine Umordnung im Frontend (`frontend/src/ideas/`). Kein Backend, kein Master-Prompt, kein Datenformat betroffen (D3).

## Aufgaben

- **T1 Detailseite umordnen** (AC-026-1, AC-026-2)
  In `IdeaPage.tsx` den Block `{idea.mediationConcept?.trim() && <section>…</section>}` (derzeit direkt nach «Beschreibung») hinter den Abschnitt «Budget» als letztes Element des Artikels verschieben. Bedingung (`trim()`), Überschrift und `MarkdownView` bleiben unverändert; alle übrigen Abschnitte behalten ihre Reihenfolge.

- **T2 Formular umordnen** (AC-026-3, AC-026-4)
  In `IdeaForm.tsx` den `MarkdownEditor` für `mediationConcept` samt Hilfetext `<p className={muted}>{t('ideas.markdown.help')}</p>` hinter das Budget-Feld und vor die Fehlermeldung und die Aktionen (Speichern) setzen. Draft-Felder, `set(...)` und Payload bleiben unverändert, die übrigen Felder behalten ihre Reihenfolge.

- **T3 Tests ergänzen** (AC-026-1 bis AC-026-4)
  - `IdeaPage.test.tsx`: Mit Concept ist die Überschrift «Mediation concept» die letzte `h2` und folgt auf «Budget» (AC-026-1). Die bestehenden Tests zu AC-023-6 decken das Ausblenden ab (AC-026-2).
  - `IdeaForm.test.tsx`: Im Anlege- und im Bearbeitungsformular ist das Concept-Feld das letzte Eingabefeld, nach dem Budget-Select und vor dem Speichern-Button (AC-026-3). Der bestehende Test AC-023-1/3 belegt, dass Speichern und Payload unverändert sind (AC-026-4).
  - Prompt-Ausgabe (AC-026-4): keine Änderung nötig, `masterprompt_test.go` bleibt unverändert grün.

- **T4 Verifikation** (alle AC)
  `npm test` im Ordner `frontend` und `go test ./...` laufen grün; keine Änderung an `ideas.go` oder `masterprompt.go`.

## Reihenfolge

T1 und T2 sind unabhängig, T3 danach, T4 zuletzt.
