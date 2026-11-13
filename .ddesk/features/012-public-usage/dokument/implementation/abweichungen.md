# Abweichungen F-012

## Deploy-Secret nicht in `cloudbuild.yaml`
- Geplant: `INITIAL_ADMIN_PASSWORD` per `--set-secrets` in den Deploy-Befehl (T10).
- Gebaut: Der Befehl bleibt unverändert, die README beschreibt das Einbinden.
- Warum: Ein fehlendes Secret würde den Deploy abbrechen. Das Secret muss vorher angelegt werden, das ist eine Aufgabe des Nutzers.

## Admin-API-Liste in der README
- Geplant: `PUT /api/ideas/{id}` in der Admin-API-Liste der README.
- Gebaut: Die README hat keine solche Liste. Der Abschnitt zu Einladungen und Initialadmin ist aktualisiert.
- Warum: Die Liste existiert im Projekt nicht.

## Spec mit 13 Kriterien
- Geplant laut Plan: Die 13 Kriterien werden alle abgedeckt, der Plan weist auf die Vorgabe von drei bis acht hin.
- Gebaut: Alle 13 Kriterien sind umgesetzt oder geprüft; AC-012-12 und AC-012-13 ohne eigenen Test.
- Warum: Das Schneiden des Features ist Entscheidung des Nutzers.
