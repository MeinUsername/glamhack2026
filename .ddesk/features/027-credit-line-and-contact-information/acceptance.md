---
id: F-027
next: 10
---

# F-027 Akzeptanzkriterien

- **AC-027-1** Gegeben das Formular zum Anlegen oder Bearbeiten einer Idee / Wenn es geöffnet wird / Dann gibt es die optionalen Felder Vorname, Nachname, Institut und E-Mail, jedes mit Platzhalter, vor dem Mediation Concept.
- **AC-027-2** Gegeben alle vier Felder leer / Wenn die Idee gespeichert wird / Dann ist das Speichern möglich.
- **AC-027-3** Gegeben ausgefüllte Felder / Wenn die Idee gespeichert und neu geladen oder bearbeitet wird / Dann sind die Werte unverändert vorhanden.
- **AC-027-4** Gegeben eine ungültige E-Mail-Adresse / Wenn gespeichert wird / Dann wird sie im Frontend und vom Backend abgelehnt, mit verständlicher Meldung.
- **AC-027-5** Gegeben die Detailseite einer Idee mit Angaben / Wenn sie geladen wird / Dann erscheint vor dem Mediation Concept ein Abschnitt mit den ausgefüllten Angaben; die E-Mail ist ein `mailto:`-Link.
- **AC-027-6** Gegeben eine Idee ohne jede Angabe, auch eine bestehende / Wenn die Detailseite geladen wird / Dann ist kein Abschnitt sichtbar.
- **AC-027-7** Gegeben ein nicht angemeldeter Besucher (F-012) / Wenn er die Detailseite öffnet / Dann sieht er die Angaben inklusive E-Mail.
- **AC-027-8** Gegeben Ideen mit Angaben im Warenkorb / Wenn der Master-Prompt erzeugt wird / Dann enthält er die Credit Line jeder Idee, die welche hat.
- **AC-027-9** Gegeben eine CSV-Datei im Import (F-015) / Wenn sie importiert wird / Dann werden die Felder weder gelesen noch gesetzt.
