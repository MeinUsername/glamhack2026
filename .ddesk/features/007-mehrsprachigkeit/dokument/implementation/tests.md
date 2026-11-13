# Tests – Umsetzung F-007

- [neu] `frontend/src/i18n/i18n.test.tsx`: AC-007-1 (fr-CH → Französisch), AC-007-5 (es → Englisch), AC-007-3 (gespeicherte Wahl gewinnt), AC-007-2 (Wechsel im Header ändert Texte, `lang` und `<html lang>`), AC-007-4 (jeder Schlüssel in allen Sprachen nicht leer).
  Warum: Die Erkennung wird über `changeLanguage(undefined)` geprüft, damit kein zweites Modul nötig ist.
- [geändert] `frontend/src/test/setup.ts`: Jeder Test startet auf Englisch; die Firebase-Mock-Meldung ist englisch.
- [geändert] Bestehende Tests erwarten die englischen Texte (Layout, Login, Register, Dashboard, AdminUsers, CategoriesInfo).
- Nicht getestet: Die Vollständigkeit der Übersetzungen fachlich (Begriffe, Tonfall); die Entwürfe für fr und it sind nicht von einer Muttersprachlerin geprüft.
