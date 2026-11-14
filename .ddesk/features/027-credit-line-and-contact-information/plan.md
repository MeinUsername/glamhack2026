---
id: F-027
---

# F-027 Plan

Vier optionale Textfelder (`creditFirstName`, `creditLastName`, `creditInstitute`, `creditEmail`) durch alle Schichten: Firestore-Dokument, API (Anlegen, Bearbeiten, Lesen), Formular, Detailseite, Master-Prompt. Der CSV-Import (`ideas_import.go`) bleibt unverändert (D6). Bestehende Ideen ohne die Felder lesen sich als leere Strings, es ist keine Migration nötig. `PUT` ersetzt das ganze Dokument (`tx.Set`), die Felder werden also beim Bearbeiten mitgeschrieben.

## Aufgaben

- **T1 Backend: Datenmodell und Validierung** (AC-027-2, AC-027-3, AC-027-4, AC-027-9)
  In `ideas.go`:
  - `ideaDoc`: Felder `CreditFirstName`, `CreditLastName`, `CreditInstitute`, `CreditEmail` (Firestore-Tags `credit_first_name`, …).
  - `ideaInput` und `ideaView`: gleiche vier Felder (JSON `creditFirstName`, `creditLastName`, `creditInstitute`, `creditEmail`); `toIdeaView` übernimmt sie.
  - `validateIdeaInput`: Werte trimmen. Name und Institut gegen `maxIdeaTextRunes` prüfen (Namens-Map `texts`), E-Mail gegen eine technische Obergrenze (254 Zeichen). Ist die E-Mail nicht leer, mit `net/mail.ParseAddress` prüfen und nur die reine Adresse ohne Anzeigenamen akzeptieren (`addr.Address == value`), sonst `userError("Credit line email address is not valid.")`. Leere Felder sind gültig.
  - Der Import-Pfad ruft `validateIdeaInput` weiterhin mit leeren Credit-Feldern auf, `parseIdeaCSV` bleibt unverändert.
  - `ideas_update.go` braucht keine Änderung, bitte nur gegenprüfen.

- **T2 Frontend: Typen, Texte, E-Mail-Prüfung** (AC-027-1, AC-027-4)
  - `frontend/src/types.ts`: vier Felder in `Idea`.
  - `frontend/src/i18n/locales/{en,de,fr,it}.ts`: Texte für Block-Überschrift «Credit Line and Contact Information», die vier Feldbezeichnungen, die vier Platzhalter (z. B. «First name», «Last name», «Institute», «name@example.org») und die Fehlermeldung «ungültige E-Mail». `messages.ts` und der i18n-Test verlangen vollständige Schlüssel in allen Sprachen.
  - `frontend/src/ideas/rules.ts`: Funktion `isValidEmail(value)`. Ein leerer Wert ist gültig, sonst einfaches Muster `local@domain.tld` ohne Leerzeichen. Es ist bewusst nicht strenger als das Backend.

- **T3 Formular** (AC-027-1, AC-027-2, AC-027-3, AC-027-4)
  In `IdeaForm.tsx`:
  - Draft-Typ, `fromIdea` und Leer-Draft um die vier Felder erweitern, Payload `data` um `creditFirstName`, … ergänzen.
  - Neuer Block (`fieldset` mit `legend` «Credit Line and Contact Information», vier `Field`-Inputs mit `placeholder`, E-Mail mit `type="email"`) hinter dem Budget-Feld und **vor** dem `MarkdownEditor` des Mediation Concepts. Das Concept bleibt letztes Feld (F-026).
  - In `handleSubmit` vor dem Senden `isValidEmail` prüfen. Bei einem Fehler wird nicht gesendet, `error` zeigt die verständliche Meldung. Das Formular nutzt `noValidate` oder gleichwertig, damit die eigene Meldung erscheint und nicht die des Browsers. Das Backend-Fehlerbild läuft über den bestehenden `error`-Pfad.

- **T4 Detailseite** (AC-027-5, AC-027-6, AC-027-7)
  In `IdeaPage.tsx` vor dem Mediation-Concept-Abschnitt einen `<section>` «Credit Line and Contact Information» einfügen. Er wird nur gerendert, wenn mindestens ein Feld nach `trim()` nicht leer ist. Name (Vorname + Nachname) und Institut erscheinen als Text, leere Angaben entfallen. Die E-Mail ist ein `<a href={'mailto:' + email}>`. Der Abschnitt hängt nicht von der Anmeldung ab (öffentliche Route, F-012). Bestehende Ideen ohne Felder zeigen keinen Abschnitt.

- **T5 Master-Prompt** (AC-027-8)
  In `frontend/src/prompt/render.ts` (`formatIdea`): Hat die Idee mindestens eine Credit-Angabe, kommt eine Zeile `- Credit Line: Vorname Nachname, Institut, E-Mail` (nur ausgefüllte Teile, kommagetrennt) über `add(...)` hinter «Budget» und **vor** den Mediation-Concept-Block. Die Master-Prompt-Vorlagen und `masterprompt.go` bleiben unverändert (das Rendern passiert im Frontend).

- **T6 Tests** (alle AC)
  - Backend `ideas_test.go`: leere Felder gültig (AC-027-2); Werte werden getrimmt und in `ideaDoc` übernommen, `toIdeaView` gibt sie zurück (AC-027-3); ungültige E-Mails (`abc`, `a@`, `Name <a@b.ch>`, zu lang) liefern `userError`, gültige passieren (AC-027-4); zu lange Namen werden abgelehnt.
  - Backend `ideas_import_test.go`: Import setzt die Credit-Felder nicht, auch wenn Spalten gleichen Namens vorkommen (AC-027-9).
  - `IdeaForm.test.tsx`: Felder und Platzhalter vorhanden, vor dem Concept (AC-027-1); Speichern mit leeren Feldern (AC-027-2); Payload enthält die Werte, Bearbeiten füllt sie vor (AC-027-3); ungültige E-Mail sendet nicht und zeigt die Meldung (AC-027-4).
  - `IdeaPage.test.tsx`: Abschnitt vor dem Concept mit `mailto:`-Link (AC-027-5); ohne Angaben kein Abschnitt, auch wenn die Felder fehlen (AC-027-6); öffentlicher Besucher sieht die E-Mail (AC-027-7), z. B. in `public.test.tsx`.
  - `render.test.ts`: Credit-Zeile vorhanden, nur ausgefüllte Teile, ohne Angaben unverändert (AC-027-8). Bestehende Erwartungen bleiben grün.
  - `i18n.test.tsx` deckt die neuen Schlüssel in allen Sprachen ab.

- **T7 Verifikation** (alle AC)
  `npm test` im Ordner `frontend` und `go test ./...` laufen grün. Keine Änderung an `ideas_import.go`, `masterprompt.go` und `IdeasList.tsx`.

## Reihenfolge

T1 und T2 sind unabhängig. T3, T4 und T5 folgen auf T2 (T3 auch auf T1 für den Ende-zu-Ende-Fluss). T6 begleitet die Aufgaben, T7 zuletzt.
