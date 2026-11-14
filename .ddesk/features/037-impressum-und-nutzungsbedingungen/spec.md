---
id: F-037
title: Impressum und Nutzungsbedingungen aktualisieren
status: refining
---

# F-037 Impressum und Nutzungsbedingungen aktualisieren

## Beschreibung

Impressum (F-028, mit TODO-Platzhaltern, Kontakt aus F-033) und Nutzungsbedingungen (F-028, acht Abschnitte) werden auf den Stand des Rechtstext-Entwurfs «Good Question – Impressum, Rechtstexte & To-Do» (14. Nov. 2026) gebracht. Die Texte sind Entwürfe und noch nicht rechtlich geprüft. Die Datenschutzerklärung ist F-036, der Link «Melden» F-034.

### Ziel

Impressum und Nutzungsbedingungen nennen Herausgeber, Lizenz, Prototyp-Status und Kontakt so, wie der Entwurf es vorsieht, in allen vier App-Sprachen, und die Zustimmung im Formular passt dazu.

### Ist und Soll

| | Heute (`main`) | Soll |
|---|---|---|
| Impressum | Betreiber, Adresse, Verantwortliche Person als TODO; Kontakt `mailto` | Herausgeber, Projekt, Hinweis, Inhalte von Nutzenden, Lizenzen |
| Nutzungsbedingungen | 8 Abschnitte (Geltungsbereich … Änderungen, Kontakt) | 10 Abschnitte, neu: Lizenz und Nutzung (CC BY 4.0), Prototyp; Satz zu Namen und Kontaktdaten Dritter; Kontakt am Ende |
| Zustimmung im Formular | «Ich bestätige, dass meine Inhalte die Nutzungsbedingungen einhalten» | «Ich habe die Nutzungsbedingungen gelesen und stimme zu (CC BY 4.0).» |
| LICENSE-Datei | keine im Repo | MIT-Lizenz für den Code, wie im Impressum angegeben |
| Projekttitel | «A Tool Kit for Art **Mediation**» (`brand.ts`) | im Entwurf steht «Art **Moderation**»; gemeint ist Mediation (Entwurf korrigieren) |
| Sprachen | de, en, fr, it | wie heute; der Entwurf liegt nur deutsch vor, die Übersetzungen schreibt die Umsetzung |

### Umfang

**Impressum** (Zielinhalt, deutsch):

- **Herausgeber:** Opendata.ch, 4000 Basel.
- **Kontakt zum Projekt:** goodquestion.glamhack@gmail.com (mailto-Link).
- **Projekt:** «Good Question – A Tool Kit for Art Mediation», entstanden am GLAMhack 2026 «Hack the Gap – Bridging Analog and Digital Worlds».
- **Hinweis:** Die Seite ist ein Prototyp aus dem GLAMhack 2026, kein offizielles Angebot einer Institution.
- **Inhalte von Nutzenden:** Die Ideen werden von Nutzenden eingereicht, die Beitragenden sind dafür verantwortlich. Bei Rechtsverletzung oder Unangemessenem: Link «Melden» bei der Idee (F-034) oder E-Mail an die Projekt-Adresse; Meldungen werden geprüft, betroffene Inhalte gegebenenfalls entfernt. Solange F-034 nicht umgesetzt ist, steht nur die E-Mail darin.
- **Lizenzen:** Code unter MIT-Lizenz; Texte und eingereichte Beiträge unter CC BY 4.0, siehe Nutzungsbedingungen.
- Die TODO-Platzhalter «Betreiber», «Adresse», «Verantwortliche Person» entfallen, soweit der Entwurf sie ersetzt.

**Nutzungsbedingungen** (Zieltext, deutsch, 10 Abschnitte):

1. Geltungsbereich: gilt für jede Idee, die auf der Plattform «Good Question – A Tool Kit for Art Mediation» erstellt, geändert oder eingereicht wird.
2. Urheberrecht und Rechte Dritter: wie heute, ergänzt um «Gib Namen, Adressen und Kontaktdaten nur von Personen an, die damit einverstanden sind.»
3. **Lizenz und Nutzung (neu):** Die Idee (Text und Bilder) steht unter CC BY 4.0; andere dürfen sie nutzen, verändern und weitergeben, wenn sie die Quelle nennen. Mit dem Einreichen erlaubt man den Betreibenden, die Idee auf der Plattform zu speichern, anzuzeigen und zu bearbeiten.
4. Verantwortung für eingereichte Inhalte (wie heute, ohne den Satz zur Erlaubnis, der nach 3 wandert).
5. Freistellung. 6. Haftungsausschluss. 7. Entfernen von Inhalten (wie heute).
8. **Prototyp (neu):** Die Plattform ist im Rahmen einer Challenge am GLAMhack 2026 entstanden, kann jederzeit geändert oder abgeschaltet werden; in diesem Fall würden alle Beiträge gelöscht.
9. Änderungen. 10. Kontakt: Fragen zu den Bedingungen und Anträge auf Entfernung von Inhalten an goodquestion.glamhack@gmail.com.

**Weiteres:**

- Pflicht-Checkbox im Formular «Idee erfassen» und beim Bearbeiten: «Ich habe die Nutzungsbedingungen gelesen und stimme zu (CC BY 4.0).» (de, en, fr, it); das Feld `termsAcceptedAt` (F-028) bleibt.
- Datei `LICENSE` (MIT) im Repo-Root. Inhaber der Rechte: Rückfrage.
- Der Hinweis «Prototyp aus dem GLAMhack 2026, kein offizielles Angebot einer Institution.» steht in der Fusszeile jeder Seite (die Fusszeile selbst mit dem Datenschutz-Link kommt aus F-036; die Zeile gehört hierher).

### Voraussetzungen vor Veröffentlichung (nicht Code, offen beim Team)

- Opendata.ch hat schriftlich (z. B. per E-Mail) zugestimmt, als Herausgeber genannt zu werden.
- Die Postadresse von Opendata.ch ist von Opendata.ch bestätigt (für die Schweiz wird eine Postadresse erwartet). Bis dahin steht nur «4000 Basel» im Text.

### Nicht im Umfang

- Rechtliche Prüfung; Datenschutzerklärung (F-036); Link «Melden» selbst (F-034).
- Zustimmung bestehender Ideen nachholen: Ideen mit früherer Zustimmung bleiben, wie in F-028 festgelegt, unverändert.

### Offene Fragen

Siehe Rückfragen in ddesk (Rückfrage bis Rückfrage).
