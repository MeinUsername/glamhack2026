---
id: F-028
next: 11
---

# F-028 Akzeptanzkriterien

- **AC-028-1** Gegeben eine beliebige Seite der App (auch Login und Registrierung) / Wenn sie geladen wird / Dann zeigt der Footer die Links «Imprint» und «Terms and Conditions».
- **AC-028-2** Gegeben ein nicht angemeldeter Besucher / Wenn er `/imprint` oder `/terms` öffnet / Dann wird die Seite angezeigt, ohne Weiterleitung auf den Login.
- **AC-028-3** Gegeben die Seite `/terms` / Wenn sie geladen wird / Dann enthält sie Abschnitte zu Urheberrecht und Rechten Dritter, Verantwortung für eingereichte Inhalte, Freistellung, Haftungsausschluss und Entfernung von Inhalten.
- **AC-028-4** Gegeben die Seite `/imprint` / Wenn sie geladen wird / Dann sind die noch fehlenden Angaben als Platzhalter klar erkennbar markiert.
- **AC-028-5** Gegeben eine gewählte App-Sprache / Wenn Footer, `/imprint` und `/terms` angezeigt werden / Dann erscheinen alle Texte in dieser Sprache.
- **AC-028-6** Gegeben das Formular zum Anlegen oder Bearbeiten einer Idee / Wenn es geöffnet wird / Dann zeigt es eine nicht vorangekreuzte Checkbox, deren Label auf `/terms` verlinkt.
- **AC-028-7** Gegeben die Checkbox ist nicht gesetzt / Wenn der Nutzer speichern will / Dann ist Speichern nicht möglich, ein Hinweis nennt die fehlende Bestätigung, und es wird nichts an das Backend gesendet.
- **AC-028-8** Gegeben die Checkbox ist gesetzt / Wenn der Nutzer speichert / Dann wird die Idee gespeichert und `terms_accepted_at` mit dem aktuellen Zeitpunkt gesetzt.
- **AC-028-9** Gegeben eine Idee mit gespeichertem Zeitpunkt / Wenn sie erneut bearbeitet und gespeichert wird / Dann muss die Checkbox erneut gesetzt werden und `terms_accepted_at` wird aktualisiert.
- **AC-028-10** Gegeben das Backend / Wenn eine Idee ohne Zustimmung angelegt oder aktualisiert werden soll / Dann lehnt es die Anfrage mit einem Validierungsfehler ab; bestehende Ideen bleiben les- und ladbar (`terms_accepted_at` leer).
