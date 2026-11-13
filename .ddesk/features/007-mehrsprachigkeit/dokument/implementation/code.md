# Code – Umsetzung F-007

- [neu] `frontend/src/i18n/index.ts`: Initialisierung mit `supportedLngs`, `fallbackLng: 'en'`, `load: 'languageOnly'`; Erkennung in der Reihenfolge `localStorage` (Schlüssel `lang`), dann `navigator`; `caches: []`.
  Warum: Nur eine explizite Wahl wird gespeichert (Q-007-11). Würde der Detektor die Browsersprache cachen, bliebe sie beim späteren Wechsel des Browsers stehen.
- [neu] `chooseLanguage` speichert die Wahl selbst und ignoriert blockierten Speicher.
  Warum: Im Privatmodus darf der Wechsel nicht scheitern; dann gilt die Wahl nur für diese Seite.
- [neu] `document.documentElement.lang` wird beim Start und bei jedem Wechsel gesetzt.
  Warum: Plan, damit Screenreader und Browser die Sprache kennen.
- [neu] `frontend/src/i18n/messages.ts` und die vier Wörterbücher; `en` ist die Quelle, `de` enthält die bisherigen deutschen Texte, `fr` und `it` sind Entwürfe.
  Warum: Q-007-12 (Entwürfe prüft der Nutzer).
- [neu] `components/LanguageSwitch.tsx`: Auswahl mit den Namen in der jeweiligen Sprache, im Header neben der Navigation.
- [geändert] Alle Seiten und Komponenten (Layout, AuthForm, Home, Login, Register, Dashboard, AdminUsers, IdeaForm, IdeaPage, EquipmentInput, CategoriesInfo) nutzen `t()`.
- [geändert] `auth/firebase.ts`: Firebase-Fehlercodes werden auf Schlüssel abgebildet und in der aktuellen Sprache ausgegeben.
- [geändert] `ideas/rules.ts`: `imageProblem(files, t)`.
  Warum: Die Meldungen müssen in der aktuellen Sprache sein; das ändert die Signatur aus F-002 (im Plan vorgesehen, siehe `abweichungen.md`).
- [geändert] `ideas/categories.ts`: Erklärungen sind Schlüssel. Die Labels bleiben englisch (F-009).
- [geändert] `main.tsx` importiert `./i18n` vor der App.
