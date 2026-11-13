# Schnittstellen F-003

- Route `GET /api/master-prompt` (F-008, nicht von F-003 gebaut): jede eingeloggte Rolle; 200 `{version, text, createdAt}`, 404 ohne Version, 401 ohne Login.
- React-Komponente `PromptGenerator` (`frontend/src/prompt/PromptGenerator.tsx`), eingebettet in die Korbseite; Prop `ids: string[]`.
- Frontend-Funktion `renderPrompt(template, ideas, locale)`, `localeFor(code)`, `formatIdea(idea)`, `formatLanguage(locale)` in `frontend/src/prompt/render.ts`.
- Frontend-Funktion `fileName(date)` → `prompt-JJJJ-MM-TT.md` in `PromptGenerator.tsx`.
