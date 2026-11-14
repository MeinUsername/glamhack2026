---
id: F-030
title: Two step publishing
status: plan-ready
---

# F-030 Two step publishing

## Beschreibung

Ideen werden in zwei Schritten veröffentlicht: Einreichen, dann Freigabe durch einen Admin. Alle aktiven Admins werden per E-Mail benachrichtigt und prüfen die Idee auf einer neuen Seite «Freigaben».

### Ziel

Neue und geänderte Ideen sind erst für alle sichtbar, nachdem ein Admin sie veröffentlicht hat. Admins erfahren per E-Mail, dass eine Idee auf Prüfung wartet.

### Umfang

- **Status der Idee:** `pending` (in Prüfung), `published`, `rejected` (abgelehnt, mit optionaler Begründung). Neue Ideen starten als `pending`.
- **Sichtbarkeit:** Nur `published` erscheint in der Übersicht (F-011), auf der Detailseite, bei den Bildern und im Warenkorb. `pending` und `rejected` sind nur für Admins sichtbar; für alle anderen antwortet die API mit 404.
- **Freigaben-Seite** (Admin, z. B. `/admin/approvals`): Liste der Ideen in Prüfung mit Vorschau, Aktionen «Veröffentlichen» und «Ablehnen» (optionale Begründung).
- **Benachrichtigung:** Beim Einreichen und bei erneuter Prüfung geht eine E-Mail an alle aktiven (nicht gesperrten) Admins, mit Titel der Idee und Link auf die Freigaben-Seite.
- **Bearbeiten:** Wird eine veröffentlichte Idee geändert, geht sie zurück auf `pending` und löst erneut eine Mail aus.
- **Ablehnen:** Status `rejected`, Begründung wird gespeichert; ist eine Credit-Line-E-Mail (F-027) vorhanden, geht dorthin eine Info-Mail. Die Idee kann überarbeitet werden und läuft danach erneut in die Prüfung.
- **Migration:** Bestehende Ideen gelten als `published`.
- **CSV-Import (F-015):** Importierte Ideen sind sofort `published`.
- **Mail-Versand:** neue Komponente; Anbieter ist noch offen (D8). Der Versand sitzt hinter einer Schnittstelle, in Tests wird ein Fake verwendet.

Nicht Teil dieses Features: Mail an Einreicher bei Veröffentlichung, mehrstufige Freigabe, Kommentarverlauf, Digest-Mails.

### Entscheidungen

- **D1 (Q-030-01):** Einreichen und Bearbeiten bleiben ohne Login möglich.
- **D2 (Q-030-02):** Bestehende Ideen gelten als veröffentlicht.
- **D3 (Q-030-03):** Nicht veröffentlichte Ideen sieht nur ein Admin.
- **D4 (Q-030-04):** Auch Ideen von Admins brauchen eine Freigabe; Ausnahme ist der CSV-Import (D12).
- **D5 (Q-030-05):** Eine Änderung an einer veröffentlichten Idee setzt sie zurück in die Prüfung, mit neuer Mail.
- **D6 (Q-030-06):** Ablehnen mit optionaler Begründung, Einreicher wird informiert, Idee bleibt überarbeitbar.
- **D7 (Q-030-07):** Keine Mail an den Einreicher bei Veröffentlichung.
- **D8 (Q-030-08):** Mail-Anbieter noch offen; vor der Planung zu entscheiden (SMTP oder Transaktions-API).
- **D9 (Q-030-09):** Freigabe auf einer neuen Admin-Seite «Freigaben»; die Mail verlinkt dorthin.
- **D10 (Q-030-10):** Empfänger sind alle aktiven Admins, gesperrte nicht.
- **D11 (Q-030-11):** Schlägt der Mailversand fehl, wird trotzdem eingereicht; der Fehler wird geloggt, die Idee bleibt auf der Freigaben-Seite.
- **D12 (Q-030-12):** Admin-CSV-Import veröffentlicht sofort.

### Offene Punkte (Vorschlag, zu bestätigen)

Folgen aus D1, D3, D6, D7, die in den Antworten nicht geklärt sind:

- **O1:** Da Einreichen anonym bleibt (D1) und nur Admins `pending` sehen (D3), sieht der Einreicher seine Idee nach dem Einreichen nicht mehr. Vorschlag: Bestätigungsseite «Deine Idee wurde zur Prüfung eingereicht».
- **O2:** Der Einreicher ist oft unbekannt. Vorschlag: Ablehnungs-Mail nur, wenn eine Credit-Line-E-Mail vorhanden ist; sonst keine Mail.
- **O3:** «Überarbeitbar» für `rejected`: Vorschlag, dass das Bearbeiten wie heute über den Bearbeiten-Einstieg läuft; der Admin kann die Idee also selbst überarbeiten. Ein Zugriff des anonymen Einreichers setzt einen Link voraus, der hier noch nicht definiert ist.
- **O4:** Da das Bearbeiten ohne Login möglich ist (D1), kann jeder eine veröffentlichte Idee zurück in die Prüfung bringen (D5). Vorschlag: so lassen, da die Freigabe-Hürde ohnehin besteht.

### Abhängigkeiten

- **F-006:** Warenkorb, **F-011:** Übersicht, **F-012:** Bearbeiten ohne Login, **F-015:** CSV-Import, **F-027:** Credit-Line-E-Mail.

### Akzeptanzkriterien

Siehe `acceptance.md`.
