# Schnittstellen F-030

- Typ `ideaDoc`: neue Felder `Status` (`pending`|`published`|`rejected`, leer = `published`) und `RejectionReason`.
- Funktionen `effectiveStatus(ideaDoc) string`, `(*server).canView(r, ideaDoc) bool`, `nextStatusOnEdit(old string, isAdmin bool) string` (geplant, `ideas_status.go`).
- Port `Mailer { Send(ctx, Message) error }`, `Message{To, Subject, Body}` (`mail.go`); Umgebungsvariable `APP_BASE_URL`.
- Routen `GET /api/admin/approvals`, `POST /api/admin/approvals/{id}/publish`, `POST /api/admin/approvals/{id}/reject`; Seiten `/admin/approvals`, `/ideas/submitted`.
- `POST /api/ideas` und `PUT /api/ideas/{id}` antworten `{id, status}`.
