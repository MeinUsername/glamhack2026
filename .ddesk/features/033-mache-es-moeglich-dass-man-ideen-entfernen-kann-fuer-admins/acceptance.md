---
id: F-033
next: 13
---

# F-033 Akzeptanzkriterien

- **AC-033-1** Gegeben ein angemeldeter Admin auf der Detailseite einer Idee / Wenn er «Löschen» wählt und den Dialog bestätigt / Dann ist die Idee weich gelöscht und er wird zur Übersicht geleitet; bricht er den Dialog ab, bleibt die Idee unverändert.
- **AC-033-2** Gegeben ein Besucher ohne Login oder ein Nutzer ohne Admin-Rolle / Wenn er die Detailseite sieht oder das Löschen per API versucht / Dann gibt es keinen Löschen-Button und die API antwortet mit 401 bzw. 403; die Idee bleibt bestehen.
- **AC-033-3** Gegeben eine gelöschte Idee / Wenn sie über Übersicht, Detailseite, API, Master-Prompt, `{{allideas}}` oder Export abgerufen wird / Dann erscheint sie nirgends; die Detailseite und `GET /api/ideas/{id}` antworten mit 404.
- **AC-033-4** Gegeben ein Besucher mit einer inzwischen gelöschten Idee im Warenkorb / Wenn der Warenkorb geladen wird / Dann ist die Idee stillschweigend entfernt, ohne Fehler oder Hinweis.
- **AC-033-5** Gegeben ein Admin / Wenn er `/admin/trash` öffnet / Dann sieht er die gelöschten Ideen und kann jede wiederherstellen; danach ist sie wieder öffentlich sichtbar. Nicht-Admins werden abgewiesen.
- **AC-033-6** Gegeben die Seiten «Neue Idee» und «Idee bearbeiten» / Wenn sie in Firefox, Chrome oder Safari geöffnet werden / Dann ist die Terms-Checkbox sichtbar und anklickbar; ohne Haken ist Speichern nicht möglich, mit Haken gelingt es.
- **AC-033-7** Gegeben `/` / Wenn die Seite geöffnet wird / Dann zeigt sie Name «Good Question» mit Claim «A Tool Kit for Art Mediation» und zwei Karten: «Ideen-Shop» führt zu `/ideas`, «Feedback-Prompt Download» zu `/feedback-prompts`; ohne Login erreichbar.
- **AC-033-8** Gegeben eine beliebige App-Sprache (de, en, it, fr) / Wenn Header, HTML-Titel und Landingpage angezeigt werden / Dann lautet der Projektname «Good Question – A Tool Kit for Art Mediation» unübersetzt; die Kartenbeschriftungen sind übersetzt.
- **AC-033-9** Gegeben `/imprint` / Wenn sie geöffnet wird / Dann enthält sie Projektname und einen mailto-Link auf `goodquestion.glamhack@gmail.com`; die übrigen Platzhalter bleiben als TODO markiert.
- **AC-033-10** Gegeben `/terms` / Wenn sie geöffnet wird / Dann nennt sie den Projektnamen und `goodquestion.glamhack@gmail.com` als Kontakt, in allen App-Sprachen.
- **AC-033-11** Gegeben eine Idee mit Bildern, die gelöscht und wiederhergestellt wird / Wenn sie wieder aufgerufen wird / Dann sind alle Felder und Bilder unverändert vorhanden.
- **AC-033-12** Gegeben die neuen Routen (`/admin/trash`, Lösch- und Wiederherstellen-API) / Wenn sie ausgeliefert werden / Dann gelten Bot-Sperre und noindex wie in F-032.
