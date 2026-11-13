- [entworfen] `initialadmin.go`: `ensureInitialAdmin(ctx)` legt den Initialadmin beim Start an, setzt bei bestehendem Account nur die Rolle admin
  Warum: D3 und Q-012-09. Idempotent, weil die Function beim Kaltstart läuft und nicht nur einmal pro Projekt.
- [entworfen] `invitations.go`: `usable` prüft nur `UsedAt == nil`; neue Einladungen ohne `expires_at`; Einlösung legt Rolle admin an
  Warum: D5 (ohne Ablauf) und Q-012-10. Alte Dokumente mit `expires_at` bleiben lesbar, das Feld wird ignoriert.
- [entworfen] `auth.go`: `register` ohne Einladung wird abgelehnt und das neue Konto entfernt; `loginPage` leitet Nicht-Admins auf `/`
  Warum: Q-012-11, und Nicht-Admins landen nicht auf einer Seite, die sie nicht sehen dürfen.
- [entworfen] `ideas.go`: Die Prüfung `currentUser` fällt bei Anlegen, Lesen, Bildern, Equipment und Übersicht weg; `created_by` ist leer bei anonymen Seiten
  Warum: D1 (ohne Login alles öffentlich).
- [entworfen] `ideas.go`: `apiUpdateIdea` nutzt `validateIdeaInput`, `storeIdeaImages`, `deleteObjects`
  Warum: Bearbeiten (Q-012-13) soll die Anlege-Logik wiederverwenden, damit Validierung und Bilder gleich bleiben.
- [entworfen] Frontend `Layout.tsx`, `Home.tsx`, `Login.tsx`, `Register.tsx`, `Dashboard.tsx`: keine Links auf `/login` und `/register` für Besucher
  Warum: D6 und AC-012-6. Register zeigt ohne Link nur den Hinweis.
- [entworfen] Frontend `IdeaForm.tsx` (Edit-Modus), `IdeaPage.tsx` (Link «Bearbeiten»), `IdeasList.tsx`: keine Weiterleitung auf `/login`
  Warum: D1 und Q-012-13. Die Edit-Seite ist eine Route mit eigener Komponentenlogik, damit die Anlege-Seite nicht überladen wird.
- [entworfen] `i18n/locales/de.ts`, `en.ts`, `fr.ts`, `it.ts`: neue Texte in allen vier Sprachen
  Warum: Die App hat vier Locales (F-007), fehlende Schlüssel fallen sonst auf Deutsch zurück.
