---
id: F-028
title: Terms and Conditions
status: done
---

# F-028 Terms and Conditions

## Beschreibung

# Terms and Conditions

Mache eine Impressums Seite mit eine Terms and Concidtions Section. 

Mache eien Checkbox beim editieren und neu übermitteln einer Idee, dass die Terms und Conditions eingehalten wurde

Die Terms and Condiions Page sollte die rechtlichen Konsequenzen minimieren d.h. keine Copy Right verstösse oder sonst was. 

Impressium-Details kommen noch

Beide Seite im Footer der Seite (der noch nicht existiert)

### Ziel

Die App erhält einen globalen Footer mit Links auf zwei öffentliche Rechtsseiten: «Imprint» (Impressum) und «Terms and Conditions». Die Terms minimieren die rechtlichen Folgen für die Betreiber (u. a. keine Urheberrechtsverstösse durch eingereichte Inhalte). Beim Anlegen und Bearbeiten einer Idee bestätigt der Nutzer per Pflicht-Checkbox, dass die Terms eingehalten sind; der Zeitpunkt der Bestätigung wird gespeichert.

### Umfang

- **Footer** im globalen `Layout`, auf allen Seiten (auch Login und Registrierung), mit Links zu `/imprint` und `/terms`.
- **Seite `/imprint`** (Impressum), öffentlich ohne Login. Details fehlen noch: klar markierte Platzhalter (TODO), Inhalt wird später nachgeliefert.
- **Seite `/terms`** (Terms and Conditions), öffentlich ohne Login. Claude entwirft einen Standardtext (Urheberrecht und Rechte Dritter, Verantwortung für eingereichte Inhalte, Freistellung, Haftungsausschluss, Entfernung von Inhalten); der Nutzer prüft ihn juristisch.
- **Mehrsprachig** gemäss F-007: beide Seiten und der Footer in allen App-Sprachen.
- **Checkbox** im Formular zum Anlegen und Bearbeiten (Neu-Übermitteln) einer Idee: Pflichtfeld, mit Link auf `/terms`.
- **Backend:** Zeitpunkt der Zustimmung pro Idee speichern.

Nicht Teil dieses Features: juristische Prüfung des Textes, endgültige Impressum-Angaben, Versionierung der Terms, Cookie-Banner, Zustimmung bei der Registrierung.

### Entscheidungen

- **D1 (Q-028-01):** Zwei getrennte Seiten `/imprint` und `/terms`, je ein Footer-Link.
- **D2 (Q-028-02):** Beide Seiten sind öffentlich ohne Login erreichbar.
- **D3 (Q-028-03):** Rechtstexte in jeder App-Sprache übersetzt (F-007).
- **D4 (Q-028-04):** Claude entwirft den Terms-Text, der Nutzer prüft ihn juristisch.
- **D5 (Q-028-05):** Impressum jetzt mit klar markierten Platzhaltern umsetzen.
- **D6 (Q-028-06):** Checkbox ist Pflicht beim Anlegen und Bearbeiten; ohne Haken ist Speichern gesperrt. Label verlinkt auf `/terms`.
- **D7 (Q-028-07):** Der Zeitpunkt der Zustimmung wird pro Idee gespeichert (`terms_accepted_at`) und bei jedem Speichern aktualisiert. Bestehende Ideen haben `null`, bis sie erneut gespeichert werden. Nicht im Master-Prompt oder Export.
- **D8 (Q-028-08):** Footer global im Layout, auf allen Seiten.

### Abhängigkeiten

- **F-007:** Mehrsprachigkeit (Texte der Seiten, Footer, Checkbox).
- **F-012:** Öffentlicher Zugriff (Routen ohne Login).
- **F-014:** Formular der Idee (Anlegen/Bearbeiten).
- **F-027:** Ebenfalls Änderung am Formular; Feldreihenfolge abstimmen.

### Akzeptanzkriterien

Siehe `acceptance.md`.
