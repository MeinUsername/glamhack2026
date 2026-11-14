---
id: F-037
next: 7
---

# F-037 Akzeptanzkriterien

- **AC-037-1** Gegeben `/imprint` in einer der Sprachen de, en, fr, it / Wenn sie geöffnet wird / Dann nennt sie Herausgeber «Opendata.ch, 4000 Basel», den Projekttitel mit GLAMhack-2026-Bezug, einen mailto-Link auf goodquestion.glamhack@gmail.com, den Prototyp-Hinweis, den Abschnitt zu Inhalten von Nutzenden und die Lizenzen (Code MIT, Texte und Beiträge CC BY 4.0); die Platzhalter «Betreiber», «Adresse» und «Verantwortliche Person» sind weg.
- **AC-037-2** Gegeben `/terms` in einer der Sprachen de, en, fr, it / Wenn sie geöffnet wird / Dann hat sie zehn Abschnitte in der Reihenfolge Geltungsbereich, Urheberrecht, Lizenz und Nutzung, Verantwortung, Freistellung, Haftungsausschluss, Entfernen von Inhalten, Prototyp, Änderungen, Kontakt.
- **AC-037-3** Gegeben Abschnitt «Lizenz und Nutzung» / Wenn er gelesen wird / Dann nennt er CC BY 4.0 für Text und Bilder der Idee und die Erlaubnis an die Betreibenden, die Idee auf der Plattform zu speichern, anzuzeigen und zu bearbeiten.
- **AC-037-4** Gegeben das Formular «Idee erfassen» und «Idee bearbeiten» / Wenn die Zustimmung angezeigt wird / Dann lautet sie «Ich habe die Nutzungsbedingungen gelesen und stimme zu (CC BY 4.0).» (in der App-Sprache), ohne Haken lässt sich nicht speichern, mit Haken wird `termsAccepted` gesendet.
- **AC-037-5** Gegeben irgendeine Seite der App / Wenn die Fusszeile angezeigt wird / Dann enthält sie den Hinweis «Prototyp aus dem GLAMhack 2026, kein offizielles Angebot einer Institution.» in der App-Sprache.
- **AC-037-6** Gegeben das Repository / Wenn der Wurzelordner angesehen wird / Dann liegt dort eine `LICENSE`-Datei mit dem Text der MIT-Lizenz.
