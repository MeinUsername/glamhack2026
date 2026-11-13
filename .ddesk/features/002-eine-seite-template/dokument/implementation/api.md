# API – Umsetzung F-002

- [neu] `POST /api/ideas` nimmt multipart entgegen: Feld `data` als JSON, Feld `images` für bis zu 5 Dateien. Antwort 201 mit `{id}`.
  Warum: Seite und Bilder werden in einem Request gespeichert, wie im Plan festgelegt.
- [neu] `GET /api/ideas/{id}` liefert JSON mit camelCase-Schlüsseln (`areaM2`, `volumeM3`, `createdAt`). Bilder erscheinen als Liste aus `contentType` und `bytes`, ohne Speicherpfad.
  Warum: Die Oberfläche soll den Bucket-Pfad nicht kennen; die Bilder werden nur über den Bildendpoint geholt.
- [neu] `GET /api/ideas/{id}/images/{n}` streamt das Bild aus dem Bucket mit dem gespeicherten Content-Type, 0-basiert, 404 bei unbekanntem Index.
  Warum: Der Bucket bleibt privat, es gibt keine öffentlichen URLs.
- [neu] `GET /api/equipment?q=` liefert Präfix-Treffer über `name_key`, höchstens 10. Leeres `q` liefert `[]`.
  Warum: Keine Vollauflistung des Katalogs, wie im Plan.
- [neu] Die Seiten `GET /ideas/new` und `GET /ideas/{id}` liefern die React-Seite.
  Warum: Die Oberflächenrouten liegen im Go-Server wie die bestehenden Seiten.
- [neu] Fehlerantworten zu dieser Erfassung sind englisch (`not signed in`, `Budget must be S, M, L, XL or empty.`).
  Warum: Der Plan verlangt englische Fehlermeldungen, passend zur englischen Oberfläche. Die älteren Endpoints bleiben deutsch.
