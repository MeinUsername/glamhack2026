---
id: F-001
title: Ein Nutzerverwaltung
status: done
---

# F-001 Ein Nutzerverwaltung

## Beschreibung

### Ziel

Nutzer registrieren sich und melden sich mit E-Mail und Passwort an. Jeder registrierte Nutzer kann Einladungslinks erzeugen. Admins verwalten Rollen und sperren Nutzer.

### Umfang

- Rollen: **Admin** und **User**.
- Registrierung per Formular mit E-Mail und Passwort. Die Anmeldung bleibt bei Firebase Auth (E-Mail/Passwort), wie heute in `templates/register.html` und `web/src/auth.js`.
- Die Registrierung ist offen (Selbstregistrierung), wie heute.
- **Invitationslink**: Jeder registrierte Nutzer kann einen erzeugen. Er ist einmalig nutzbar und 7 Tage gültig. Wer über einen Link registriert wird, erhält bei der Registrierung eine feste Rolle.
- **Admin**: vergibt Rollen und sperrt Nutzer (und hebt die Sperre auf).
- **Erster Admin**: entsteht über ein einmaliges Setup-Kommando.
- Rollen werden in der eigenen Speicherung der App geführt, nicht in Firebase.
- Keine E-Mail-Bestätigung nach der Registrierung.

### Entscheidungen

| Frage | Entscheidung |
|---|---|
| Wie kommt ein Nutzer ins System? | Offene Selbstregistrierung wie heute |
| Wer darf Invitationslinks erzeugen? | Jeder registrierte Nutzer |
| Was darf ein Admin über den User hinaus? | Rollen vergeben, Nutzer sperren |
| Gültigkeit eines Invitationslinks | Einmalig, 7 Tage |
| Wie entsteht der erste Admin? | Einmaliges Setup-Kommando |
| Basis für Login und Rollen | Firebase Auth (E-Mail/Passwort) bleibt; Rollen in eigener Speicherung |
| E-Mail-Bestätigung nach Registrierung | Nein |
| Was bewirkt ein Invitationslink bei offener Registrierung? | Vergibt eine feste Rolle bei der Registrierung |

*Annahme: Ein Invitationslink vergibt die Rolle **User**. Welche Rolle er vergibt, hat der Nutzer nicht festgelegt.*

**Offen:** Ob Admin-Rechte weitere Aktionen umfassen (z. B. Einladungen widerrufen, Nutzer löschen). Bis zur Klärung gilt nur das oben Genannte.

### Nicht im Umfang

- Passwort zurücksetzen und Profil bearbeiten (nicht entschieden, bis zur Klärung nicht umgesetzt).
