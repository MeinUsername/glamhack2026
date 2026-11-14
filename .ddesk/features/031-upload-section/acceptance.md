---
id: F-031
next: 12
---

# F-031 Akzeptanzkriterien

- **AC-031-1** Gegeben das Ideenformular (Anlegen und Bearbeiten) / Wenn es geöffnet wird / Dann steht der Abschnitt «Links» nach der Credit Line und vor dem Mediation Concept, ohne Login bedienbar.
- **AC-031-2** Gegeben der Abschnitt / Wenn ein Link mit URL, Titel und Typ hinzugefügt und gespeichert wird / Dann ist er an der Idee gespeichert; Links sind optional.
- **AC-031-3** Gegeben eine Idee / Wenn mehr als 20 Links gespeichert werden sollen / Dann lehnt das Backend ab und das Formular verhindert das Hinzufügen.
- **AC-031-4** Gegeben eine URL / Wenn sie nicht mit `http://` oder `https://` beginnt oder kein gültiges Format hat / Dann wird sie in Frontend und Backend abgelehnt.
- **AC-031-5** Gegeben eine Idee mit Links / Wenn die Detailseite geöffnet wird / Dann erscheinen die Links vor dem Mediation Concept, gruppiert nach Typ mit Überschrift je Typ; ohne Links entfällt der Abschnitt.
- **AC-031-6** Gegeben ein Link auf der Detailseite / Wenn er angeklickt wird / Dann öffnet er in neuem Tab mit `rel="noopener noreferrer"`.
- **AC-031-7** Gegeben ein Admin / Wenn er die Seite «Link-Typen» öffnet / Dann kann er Typen anlegen, umbenennen und löschen; vorbelegt sind Tools, Reference, Institutes; Nicht-Admins wird der Zugriff verweigert.
- **AC-031-8** Gegeben ein Typ, den noch ein Link nutzt / Wenn ein Admin ihn löschen will / Dann wird das Löschen mit Hinweis verweigert.
- **AC-031-9** Gegeben eine Idee mit Links / Wenn der Master-Prompt gerendert wird / Dann enthält er die Links als Liste je Typ.
- **AC-031-10** Gegeben Export und Import (F-010, F-015) / Wenn eine Idee mit Links exportiert und wieder importiert wird / Dann sind die Links unverändert vorhanden.
- **AC-031-11** Gegeben eine veröffentlichte Idee (F-030) / Wenn ihre Links geändert und gespeichert werden / Dann ist sie wieder `pending` und die Admins werden benachrichtigt.
