# API – Plan F-030

- [entworfen] `GET /api/ideas`, `GET /api/ideas/{id}`, `GET /api/ideas/{id}/images/{n}`: Nicht-Admins erhalten nur `published`, sonst 404. Antworten tragen `status`, Admins zusätzlich `rejectionReason`.
  Warum: D3 und AC-030-2; dieselbe 404-Antwort wie bei unbekannter ID verrät nicht, dass eine Idee existiert.
- [entworfen] `POST /api/ideas` und `PUT /api/ideas/{id}` antworten `{id, status}`. `PUT` einer nicht sichtbaren Idee ergibt 404.
  Warum: Das Frontend entscheidet damit zwischen Bestätigungsseite und Detailseite (Q-030-14).
- [entworfen] `GET /api/admin/approvals`, `POST /api/admin/approvals/{id}/publish`, `POST /api/admin/approvals/{id}/reject` (Body `{reason?}`), alle nur für Admins; 409, wenn die Idee nicht mehr `pending` ist.
  Warum: D9 und AC-030-12; zwei Admins können gleichzeitig entscheiden.
- [entworfen] Seite `GET /admin/approvals` (nur Admin) und öffentliche Seite `GET /ideas/submitted`.
  Warum: Freigaben-Seite nach D9, Bestätigungsseite nach Q-030-14.
