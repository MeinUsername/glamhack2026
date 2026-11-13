# Schnittstellen F-002

- Route `POST /api/ideas`: multipart, Feld `data` (JSON) und `images` (0 bis 5 Dateien), Antwort 201 `{id}`
- Route `GET /api/ideas/{id}`: liefert eine Seite als JSON (`ideaView`), 401 ohne Anmeldung, 404 bei unbekannter ID
- Route `GET /api/ideas/{id}/images/{n}`: streamt Bild `n` (0-basiert) aus dem Bucket mit gespeichertem Content-Type
- Route `GET /api/equipment?q=<text>`: Autocomplete, höchstens 10 Anzeigenamen, leeres `q` ergibt `[]`
- Seiten `GET /ideas/new` und `GET /ideas/{id}`: liefern die React-Seite (`serveApp`)
- Go-Funktion `validateIdeaInput(ideaInput) (ideaDoc, []equipmentDoc, error)`: reine Validierung ohne Firestore
- Go-Funktion `normalizeEquipment([]string) ([]string, []equipmentDoc, error)`: trimmen, Duplikate ignorieren, Katalogeinträge
- Go-Funktion `checkImage([]byte) (contentType, ext string, err error)`: JPEG, PNG, WebP über die Bytes
- Go-Funktion `storeIdeaImages(ctx, ideaID, []checkedImage) ([]imageDoc, error)` und `deleteObjects(ctx, []imageDoc)`
- Firestore-Collection `ideas`: Dokument mit `title`, `description`, `audience`, `goal`, `sustainability`, `accessibility`, `space`, `equipment`, `budget`, `images`, `created_by`, `created_at`
- Firestore-Collection `equipment`: Dokument-ID `name_key`, Felder `name`, `name_key`
- Bucket-Objekte `ideas/<id>/<zufall>.<ext>`
- React-Komponente `IdeaForm` (Route `/ideas/new`), `IdeaPage` (Route `/ideas/:id`), `EquipmentInput` (Props `value`, `onChange`)
- Frontend-Regeln `imageProblem(files: File[]) => string` in `frontend/src/ideas/rules.ts`
