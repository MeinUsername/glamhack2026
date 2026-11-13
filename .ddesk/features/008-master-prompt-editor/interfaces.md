# Schnittstellen F-008

- Route `GET /api/master-prompt`: jede eingeloggte Rolle (Q-008-13); 200 `{version, text, createdAt}`, 404 wenn keine Version existiert, 401 ohne Login. Für F-003 T2.
- Route `GET /api/admin/master-prompt`: nur Admins; 200 `{versions: [{number, text, authorEmail, createdAt}]}`, neueste zuerst; leere Liste, wenn es keine Version gibt.
- Route `POST /api/admin/master-prompt`: nur Admins; Body `{text}`; 200 `{version, created}`; 400 `{error, unknown: [...]}` bei unbekannten Variablen; 400 bei leerem oder zu langem Text.
- Route `POST /api/admin/master-prompt/versions/{n}/restore`: nur Admins; 200 `{version, created}`; 404 wenn Version n fehlt.
- Route `GET /admin/master-prompt`: React-Seite `AdminMasterPrompt`, nur Admins (Weiterleitung/403 wie `/admin/users`).
- Go-Funktion `currentMasterPrompt(ctx) (promptVersionDoc, bool, error)` (`masterprompt.go`); `bool` ist `false`, wenn es keine Version gibt. Vertrag für F-003.
- Go-Guard `requireSignedIn` / `guardSignedIn` (`admin.go`): nur Login, keine Rollenprüfung.
- Frontend-Funktion `renderPrompt(template, ideas, locale)` und `unknownVariables(template)` in `frontend/src/prompt/render.ts` (F-003 T1, hier mitgeliefert).
- Firestore-Collection `master_prompt_versions`, Dokument-ID = Nummer mit führenden Nullen (`000001`).
