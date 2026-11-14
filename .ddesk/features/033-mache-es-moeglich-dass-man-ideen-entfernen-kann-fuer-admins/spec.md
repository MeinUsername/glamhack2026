---
id: F-033
title: Improvment round
status: done
---

# F-033 Improvment round

## Beschreibung

# Mache es möglich, dass man Ideen entfernen kann (für Admins)

- Admins sollen in der Lage sein eine Seite zu löschen
- Terms and Conditions: es fehlt die Checkbox für den Haken zum Bestätigen auf der Edit und New Page für Firefox (es kommt nur die prüfung). Vielelicht auch nicht nur auf Firefox 
- Die Landingspage für die Auswahl zwischen Ideen-Shop and Feedback Prompt Download fehlt
- goodquestion.glamhack@gmail.com
- Name des Projektes ist Good Question – A Tool Kit for Art Mediation (Name and claim)
- Impressum sollte die Email enthalten

### Ziel

Sammelrunde mit Verbesserungen: Admins können Ideen entfernen (Papierkorb), die Terms-Checkbox ist in allen Browsern sichtbar, die App erhält eine Landingpage mit Auswahl «Ideen-Shop» / «Feedback-Prompt Download», und Projektname sowie Kontakt-E-Mail werden gesetzt.

### Umfang

1. **Idee entfernen (Admin):** Button «Löschen» mit Bestätigungsdialog auf der **Detailseite** einer Idee, nur für Admins sichtbar und serverseitig nur für Admins erlaubt. Die Idee wird **weich gelöscht** (Papierkorb, `deleted_at`), nicht endgültig. Gelöschte Ideen erscheinen nirgends mehr öffentlich: nicht in Übersicht, Detailseite (404), Warenkorb, Master-Prompt/`{{allideas}}`, Export. Bilder bleiben erhalten. Admins sehen die gelöschten Ideen auf einer Papierkorb-Seite `/admin/trash` und können sie dort wiederherstellen.
2. **Warenkorb:** Eine gelöschte Idee im Warenkorb eines Besuchers wird beim Laden stillschweigend entfernt.
3. **Terms-Checkbox:** Die Checkbox (F-028) ist auf «Neue Idee» und «Idee bearbeiten» in Firefox, Chrome und Safari sichtbar und anklickbar; heute erscheint dort nur die Fehlermeldung. Ursache (vermutlich Styling/CSS-Reset) wird gefunden und behoben, mit Regressionstest.
4. **Landingpage `/`:** Ersetzt die heutige Startseite. Zeigt Name und Claim und zwei grosse Karten: «Ideen-Shop» (→ `/ideas`) und «Feedback-Prompt Download» (→ `/feedback-prompts`).
5. **Projektname:** «Good Question – A Tool Kit for Art Mediation» (Name «Good Question», Claim «A Tool Kit for Art Mediation») in Header (`app.name`), HTML-Titel, Landingpage (Claim als Untertitel), Impressum und Terms. In allen Sprachen unverändert englisch.
6. **Kontakt-E-Mail** `goodquestion.glamhack@gmail.com` als mailto-Link im Impressum und als Kontakt in den Terms (z. B. für Entfernungsanfragen).
7. **Impressum:** nur Projektname und E-Mail ergänzen, übrige Platzhalter-TODOs bleiben.

Nicht Teil dieses Features: Löschen auf der Übersichtsseite, endgültiges Löschen (Papierkorb leeren), Löschen anderer Inhalte (Feedback-Prompts, Nutzer), Übersetzung von Name/Claim, weitere Impressum-Angaben.

### Entscheidungen

- **D1 (Q-033-01):** «Seite löschen» meint nur Ideen.
- **D2 (Q-033-02):** Weiches Löschen (Papierkorb), wiederherstellbar durch Admins.
- **D3 (Q-033-03):** Löschen nur auf der Detailseite, nicht in der Übersicht.
- **D4 (Q-033-04):** Gelöschte Idee im Warenkorb wird still entfernt.
- **D5 (Q-033-05):** Fehlerbild: Checkbox ist unsichtbar, nur die Prüfmeldung erscheint.
- **D6 (Q-033-06):** Landingpage ersetzt die heutige Startseite auf `/`.
- **D7 (Q-033-07):** Projektname überall (Header, Titel, Landing, Impressum, Terms), Claim als Untertitel.
- **D8 (Q-033-08):** Name und Claim nicht übersetzt.
- **D9 (Q-033-09):** E-Mail im Impressum und in den Terms.
- **D10 (Q-033-10):** Impressum: nur E-Mail und Projektname, sonstige TODOs bleiben.
- **Annahme (bei Freigabe prüfen):** Wiederherstellen braucht eine Papierkorb-Ansicht für Admins (`/admin/trash`), minimal: Liste und Wiederherstellen.

### Abhängigkeiten

- **F-028:** Checkbox, Impressum, Terms.
- **F-011 / F-006 / F-010 / F-025:** Übersicht, Warenkorb, Export, `{{allideas}}` müssen gelöschte Ideen ausblenden.
- **F-007:** Texte in allen Sprachen (Landing, Buttons).
- **F-032:** neue Routen bleiben noindex.

### Akzeptanzkriterien

Siehe `acceptance.md`.
