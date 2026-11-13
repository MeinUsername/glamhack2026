# Tests – Umsetzung F-012

- [geändert] `TestAC002_7_IdeaEndpointsRequireSignIn` ist ersetzt durch `TestAC012_1_IdeaEndpointsNeedNoSignIn`.
  Warum: Die Anmeldepflicht entfällt. Der Test prüft, dass kein 401 kommt. Der Server hat in Tests keinen Firestore-Client, deshalb endet der Aufruf nach dem Login-Check mit einer abgefangenen Panic.
- [geändert] `invitations_test.go`: Die Tests zu 7 Tagen und Ablauf sind entfernt. Die Einmaligkeit steht in `public_test.go`.
- [neu] `public_test.go`: AC-012-3 (Entscheidung Initialadmin, Standard-E-Mail), AC-012-4 (Einlösung gibt Admin), AC-012-7 und -9 (einmalig), AC-012-8 (kein Ablauf), AC-012-10 (Nicht-Admin darf keine Einladung), AC-012-11 (zwei Admins), AC-012-2 (`selectKeptImages`).
- [neu] `TestIdeaEditRouteServesReactIndex` in `spa_test.go`.
- [geändert] Vitest: `Layout.test.tsx`, `Dashboard.test.tsx`, `Login.test.tsx`, `IdeasList.test.tsx` an die neuen Regeln angepasst.
- [neu] `frontend/src/public.test.tsx`: AC-012-6 (Register ohne Link zeigt Hinweis), AC-012-1 (Bearbeiten-Link ohne Anmeldung, Übersicht öffentlich), AC-012-2 (Bearbeiten ohne Anmeldung sendet PUT mit `keepImages`).
- [nicht getestet] Die Firestore-Pfade (Initialadmin anlegen, Einladung einlösen in der Transaktion, Bearbeiten mit Bildlöschen) laufen nicht gegen einen Emulator. Es gibt keinen im Projekt.
- [nicht getestet] AC-012-12 (bestehende Konten melden sich unverändert an) und AC-012-13 (kein Rate-Limit) sind nicht als Test umgesetzt. Die Anmeldung ist unverändert, und ein Rate-Limit wird nicht gebaut.
