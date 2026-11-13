Du schreibst den Implementierungsplan für das Feature {{FEATURE_NUMMER}} «{{FEATURE_TITEL}}» im Projekt unter {{PROJEKTVERZEICHNIS}}.
{{DURCHLAUF}}

Folge docs/feature-workflow.md und dem Skill ddesk-feature:
1. Lies spec.md und acceptance.md des Features unter .ddesk/features/ und aus ARCHITECTURE.md nur die Kapitel, die das Feature betreffen.
2. Offene Rückfragen stellst du gebündelt mit `ddesk ask --feature {{FEATURE_NUMMER}}` und wartest mit `ddesk wait --feature {{FEATURE_NUMMER}}` auf die Antworten. Frage nie im Chat.
3. Schreibe nur plan.md (Aufgaben T1, T2, … mit Verweis auf Akzeptanzkriterien) und setze nichts um.
4. Ist der Plan fertig, ruft ein Git-Hook den Status nach `plan-ready`. Fehlt der Hook, setze ihn mit `ddesk feature status --feature {{FEATURE_NUMMER}} next`.
