# Abweichungen F-007

## Accept-Language wird nicht ausgewertet

- **Geplant (Spec):** Automatische Auswahl «anhand der Browsersprache (bzw. über den Header)».
- **Gebaut:** Nur `localStorage` und `navigator.languages`.
- **Warum:** Die Oberfläche ist eine SPA, der Server rendert keine übersetzten Seiten. Der Plan hält die Abweichung fest; die Information ist dieselbe.

## Signatur von `imageProblem` geändert (F-002)

- **Geplant (Plan T4):** `imageProblem(files, t)`.
- **Gebaut:** Dasselbe; `t` ist vom Typ `TFunction` aus i18next.
- **Warum:** Die Meldungen müssen in der aktuellen Sprache erscheinen.

## Kategorie-Erklärungen übersetzt, Labels nicht (F-009)

- **Geplant (F-009):** Tooltip-Texte deutsch, Übersetzung nicht Teil von F-009.
- **Gebaut:** Erklärungen in allen vier Sprachen; die Labels Affirmative, Reproductive, Deconstructive, Transformation bleiben englisch.
- **Warum:** AC-007-4 verlangt keine englischen Reste; die Labels sind aber Begriffe der Vorlage. Der Konflikt ist offen und wird dem Nutzer gemeldet.

## Server-Fehlermeldungen nicht übersetzt

- **Geplant (AC-007-4):** Alle Hinweise des Frontends in der gewählten Sprache.
- **Gebaut:** Fehlertexte, die vom Server kommen, bleiben in der Sprache des Servers.
- **Warum:** Der Server liefert Texte, keine Schlüssel. Das Ändern gehört nicht zu diesem Feature.
