# API – Umsetzung F-008

- [neu] `GET /api/master-prompt` liefert die aktuelle Version an jede eingeloggte Rolle; 401 ohne Login, 404 ohne Version.
  Warum: Q-008-13 erlaubt allen eingeloggten Rollen das Lesen; der Prompt-Generator (F-003) braucht ihn.
- [neu] `GET /api/admin/master-prompt` liefert alle Versionen, neueste zuerst. Ohne Version: 200 mit leerer Liste.
  Warum: Die Editor-Seite kann so ohne Sonderfall auf „keine Version“ reagieren.
- [neu] `POST /api/admin/master-prompt` speichert den Text als neue Version oder meldet `created: false` bei gleichem Text.
  Warum: AC-008-1 und AC-008-4; die Antwort sagt dem Frontend, ob eine Version entstanden ist.
- [neu] Unbekannte Variablen führen zu 400 mit dem Feld `unknown` (Liste der Namen).
  Warum: AC-008-5; das Frontend zeigt die Namen direkt, ohne eine zweite Fehlerquelle.
- [neu] `POST /api/admin/master-prompt/versions/{n}/restore` kopiert Version n als neue Version, außer der Text ist schon aktuell.
  Warum: AC-008-3; Versionen werden nie gelöscht (D7).
- [neu] Alle Schreib- und Admin-Endpunkte hängen an `requireAdmin`; `GET /api/master-prompt` an `requireSignedIn`.
  Warum: AC-008-2 und Q-008-13.
- [neu] Die Antwort einer Speicherung oder Wiederherstellung trägt `version` und `created`.
  Warum: Das Frontend muss unterscheiden, ob eine Version entstanden ist (AC-008-4).
