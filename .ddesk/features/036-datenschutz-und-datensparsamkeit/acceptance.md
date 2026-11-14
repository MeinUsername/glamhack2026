---
id: F-036
next: 8
---

# F-036 Akzeptanzkriterien

- **AC-036-1** Gegeben eine beliebige Seite der App / Wenn die Fusszeile angezeigt wird / Dann enthält sie Links auf Impressum, Datenschutz und Nutzungsbedingungen, und `/privacy` ist ohne Login erreichbar, mit `X-Robots-Tag: noindex`.
- **AC-036-2** Gegeben `/privacy` in der App-Sprache de, en, fr oder it / Wenn die Seite geöffnet wird / Dann erscheint die Erklärung in dieser Sprache mit allen neun Abschnitten und dem Stand-Datum.
- **AC-036-3** Gegeben irgendeine Seite der App / Wenn sie geladen wird / Dann gehen keine Anfragen an Google Fonts oder andere externe Hosts für Schriften oder Skripte; die Schriften kommen vom eigenen Server.
- **AC-036-4** Gegeben ein Bild mit EXIF-Daten (z. B. GPS-Ort) / Wenn es mit einer Idee hochgeladen wird (Erstellen, Bearbeiten, Import) / Dann enthält die gespeicherte Datei keine EXIF-Metadaten mehr und zeigt dasselbe Bild.
- **AC-036-5** Gegeben ein Admin und eine Idee im Papierkorb / Wenn er sie endgültig löscht / Dann sind Dokument und alle Bilder im Bucket entfernt und die Idee lässt sich nicht mehr wiederherstellen; eine Idee ausserhalb des Papierkorbs lässt sich so nicht löschen.
- **AC-036-6** Gegeben die Datenschutzerklärung / Wenn sie mit dem Code verglichen wird / Dann nennt sie Konten (E-Mail), Credit-Line-Angaben, Sitzungs-Cookie, Sprachwahl im Browser, die tatsächliche Region und alle Empfänger (Google Cloud, Firebase Authentication, Gmail, Mail-Anbieter aus F-030, sobald gewählt).
- **AC-036-7** Gegeben die festgelegte Aufbewahrungsdauer der Server-Logs und das Ablaufdatum der Seite / Wenn die Erklärung gelesen wird / Dann stehen beide Werte konkret darin, keine Platzhalter in eckigen Klammern.
