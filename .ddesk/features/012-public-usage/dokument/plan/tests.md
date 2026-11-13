- [entworfen] `ideas_test.go`: `TestAC002_7_IdeaEndpointsRequireSignIn` wird ersetzt durch einen Test, dass die Endpunkte ohne Anmeldung antworten
  Warum: AC-012-1 und AC-012-2 heben die Anmeldepflicht auf. Der alte Test würde sonst das Gegenteil prüfen.
- [entworfen] `invitations_test.go`: `TestAC001_3_ExpiredInvitationIsRejected` wird durch «alter Link wird angenommen» ersetzt
  Warum: AC-012-8 (kein Ablaufdatum).
- [entworfen] `invitations_test.go`: `TestAC001_2_InvitationIsSingleUseAndExpiresAfter7Days` prüft nur noch die Einmaligkeit
  Warum: AC-012-7 und AC-012-9 bleiben, der Ablauf fällt weg.
- [entworfen] Neu: Tabellentest für `ensureInitialAdmin` (Account fehlt und Passwort gesetzt → anlegen; Account da → nur Rolle; Account fehlt, Passwort leer → kein Fehler)
  Warum: AC-012-3 und AC-012-4. Die Entscheidungslogik lässt sich ohne Firebase-Client prüfen.
- [entworfen] Neu: Einlösung setzt Rolle admin; Registrierung ohne Link wird abgelehnt
  Warum: Q-012-10 und Q-012-11.
- [entworfen] `spa_test.go`: `/ideas/{id}/edit` wird als Seiten-Route geprüft
  Warum: Die neue Route muss ohne Session die React-Seite liefern.
- [entworfen] Vitest `Layout.test.tsx`: Besucher sehen keinen Link auf `/login`
  Warum: AC-012-6.
- [entworfen] Vitest `Register.test.tsx`: ohne Einladungslink kein Formular, nur der Hinweis
  Warum: Q-012-11.
- [entworfen] Vitest `Dashboard.test.tsx`: Nicht-Admin sieht «Nur für Admins.»; Einladung ohne Ablaufdatum
  Warum: AC-012-5 und D5.
- [entworfen] Vitest `IdeaForm.test.tsx`, `IdeaPage.test.tsx`: ohne Anmeldung nutzbar, Bearbeiten-Link vorhanden
  Warum: AC-012-1 und AC-012-2.
- [entworfen] Manuell: Besucher legt eine Seite an, ändert sie; Initialadmin meldet sich über `/login` an; zehn Fehlversuche ohne Sperre
  Warum: Die Abnahme der nicht automatisierbaren Kriterien AC-012-1, AC-012-2, AC-012-4 und AC-012-13.
