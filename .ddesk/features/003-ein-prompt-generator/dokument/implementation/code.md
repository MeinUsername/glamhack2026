# Code – Umsetzung F-003

- [neu] `frontend/src/prompt/render.ts`: reine Funktionen für Ersetzung, Format der Ideen, Sprache und unbekannte Variablen.
  Warum: Eine Implementierung für F-003 und F-008 (Plan, Festlegung „Rendern im Browser“).
- [neu] `frontend/src/prompt/PromptGenerator.tsx`: Vorschau, Herunterladen, Zwischenablage, Hinweise für Besucher, leeren Korb und fehlende Version.
  Warum: Umsetzung der Plan-Aufgaben T3 bis T7.
- [geändert] `frontend/src/pages/Basket.tsx`: bindet `PromptGenerator` unter die Korbliste ein.
  Warum: Q-003-13 legt den Generator auf die Korbseite, nicht auf eine eigene Route.
- [neu] Übersetzungsschlüssel `prompt.*` in de, en, fr, it. Die fr- und it-Texte sind Entwürfe.
  Warum: Alle Oberflächentexte sind in allen Sprachen vorhanden.
