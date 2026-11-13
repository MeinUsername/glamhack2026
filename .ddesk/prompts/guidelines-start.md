Du erfasst die projektweiten Vorgaben des Projekts unter {{PROJEKTVERZEICHNIS}}.
{{DURCHLAUF}}

Projektweite Vorgaben gelten für jedes Feature, ändern sich selten und werden von Tooling oder Review durchgesetzt. Feature-spezifisches (Fachlogik, Akzeptanzkriterien) gehört nicht hierher, sondern in die Spec des Features.

1. Lies zuerst AGENTS.md, ARCHITECTURE.md und `ddesk guideline list`, damit du nichts erfragst, was schon feststeht.
2. Gehe die sieben Kategorien nacheinander durch. Je Kategorie stellst du die offenen Fragen gebündelt mit `ddesk ask --feature 0`: jede mit Auswahlmöglichkeiten, einer Empfehlung (`*`) und, wo mehrere zugleich gelten können, `?multi`. Der Nutzer kann eine eigene Option ergänzen. Warte danach mit `ddesk wait --feature 0` auf die Antworten. Frage nie im Chat.
   - architektur: Architekturstil und Schichtung samt erlaubter Abhängigkeitsrichtung; wie Module untereinander kommunizieren; querschnittliche Entscheidungen als ADR.
   - technologie: Sprache, Framework, Datenbank, Build-Werkzeug mit Versionen; erlaubte Bibliotheken und wie neue aufgenommen werden; ausgeschlossene Technologien.
   - code-struktur: Ordner- und Paketstruktur; Fehlerbehandlung; Logging, Konfiguration, Secrets; Zeit, IDs, Transaktionsgrenzen; bei einer Oberfläche Designsystem und Barrierefreiheit.
   - tests: Teststrategie je Ebene, Frameworks, Ablage- und Namensregeln; Definition of Done.
   - konventionen: Benennung in Code, Datenbank, API und Events; Sprachregel; Formatierung und Linting; Commit-, Branch- und PR-Regeln.
   - betrieb: Build-, Test- und Startbefehle; API-Konventionen; Sicherheitsgrundsätze; nicht-funktionale Mindestziele; Abgrenzung des Projekts.
   - ki-arbeitsweise: was nie ohne Rückfrage geändert wird; wann nachfragen und wann selbst entscheiden.
3. Lege aus jeder eindeutigen Antwort eine Vorgabe an: `ddesk guideline add --category <kategorie> [--enforcement hook|linter|review|text] "<Text>"`. Eine eigene Option des Nutzers übernimmst du als Text. Setze die Durchsetzung nur, wenn der Nutzer sie genannt hat oder sie aus der Antwort folgt.
4. Schreibe keine Dateien unter `.ddesk/guidelines/` und keinen Block in AGENTS.md selbst: das übernimmt ddesk. Ändere keinen Feature-Status.
