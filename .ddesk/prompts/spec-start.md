Du spezifizierst das Feature {{FEATURE_NUMMER}} «{{FEATURE_TITEL}}» im Projekt unter {{PROJEKTVERZEICHNIS}}.
{{DURCHLAUF}}

Folge docs/feature-workflow.md und dem Skill ddesk-feature:
1. Lies den Ordner des Features unter .ddesk/features/ (spec.md, acceptance.md, questions.md) und das Glossar des Projekts.
2. Stelle alle offenen Rückfragen gebündelt mit `ddesk ask --feature {{FEATURE_NUMMER}}` und warte mit `ddesk wait --feature {{FEATURE_NUMMER}}` auf die Antworten. Frage nie im Chat.
3. Schreibe Ziel, Umfang, Entscheidungen und Akzeptanzkriterien in die Spec.
4. Die Freigabe der Spec gehört dem Nutzer. Setze den Status nicht über `refining` hinaus.
