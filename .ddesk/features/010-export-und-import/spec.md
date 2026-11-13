---
id: F-010
title: Export und Import
status: refining
---

# F-010 Export und Import

## Beschreibung

### Ziel

Alle einstellbaren Grössen der App lassen sich als eine Datei exportieren und aus dieser Datei wieder importieren. Ein Admin kann so den Stand sichern oder auf eine andere Instanz übertragen.

### Umfang

Der Export enthält:

- **Ideen** inklusive Bilder, die als Base64 im JSON stehen.
- **Masterprompt** (siehe F-008).
- **Seiten-Templates und Kategorien** (siehe F-002 und F-009).
- **Nutzer und Rollen** (siehe F-001). Nutzer mit E-Mail, Rolle und Sperrstatus.

Der Export enthält nicht:

- Passwörter oder Passwort-Hashes. Die Anmeldung bleibt bei Firebase Auth.

Der Import liest genau diese Datei ein. Er ist nur für Admins möglich.

### Entscheidungen

- **Umfang**: Alles, was die App einstellbar speichert (Antwort des Nutzers, Q-010-01).
- **Berechtigung**: Export und Import sind nur für die Rolle Admin (Q-010-02, siehe F-001).
- **Konflikt beim Import**: Existiert eine ID bereits, wird der vorhandene Datensatz durch den importierten ersetzt (Q-010-03).
- **Format**: Eine einzige JSON-Datei, Bilder als Base64 im JSON (Empfehlung übernommen, Q-010-04 nicht beantwortet).
- **Schema-Version**: Die Datei trägt eine Schema-Version. Der Import lehnt unbekannte Versionen ab (Empfehlung übernommen, Q-010-05 nicht beantwortet).

### Annahmen (vom Nutzer zu bestätigen)

- *Einstellungen aus F-006 (Warenkorb) und F-007 (Mehrsprachigkeit) werden mit exportiert, soweit sie gespeichert sind.*
- *Einladungslinks werden nicht exportiert; sie sind kurzlebig (7 Tage).*
- *Passwörter werden nie exportiert (siehe Umfang).*

### Offen

- **Importierte Nutzer ohne Firebase-Konto**: Ein Nutzer aus der Datei hat keinen Login, wenn es in Firebase Auth kein Konto mit dieser E-Mail gibt. Zu klären: Import nur der Rollen für bestehende Konten, oder Anlage des Nutzerdatensatzes mit Hinweis «Konto fehlt»?
- **Dateigrösse**: Base64 vergrössert Bilder um rund ein Drittel. Ob das für viele Ideen tragbar ist, ist offen.
