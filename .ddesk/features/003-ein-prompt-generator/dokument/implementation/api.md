# API – Umsetzung F-003

- [entworfen] `GET /api/master-prompt` für alle eingeloggten Rollen, 401 ohne Login, 404 ohne Version (Q-003-10).
  Warum: Der Generator braucht den aktuellen Text im Browser.
- [neu] Der Route-Test prüft 401 ohne Login, bevor Firestore angesprochen wird (`TestAC003_5_MasterPromptReadNeedsSignIn`).
  Warum: AC-003-5 auf API-Ebene; der Server hat in Tests keine Clients.
- [neu] F-003 braucht keinen eigenen Endpunkt: Die Route und der Guard (`requireSignedIn`) kommen aus F-008.
  Warum: Der Plan (T2) sah einen eigenen Guard `guardUser` vor; F-008 hat ihn bereits als `requireSignedIn` gebaut, damit wird doppelter Code vermieden.
