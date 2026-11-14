---
id: F-035
next: 8
---

# F-035 Akzeptanzkriterien

- **AC-035-1** Gegeben die JSON-Datei mit den ICOM-Kategorien / Wenn das Backend startet / Dann kennt es genau die Kategorie-IDs dieser Datei, ohne eigene Liste im Go-Code.
- **AC-035-2** Gegeben eine Kategorie-ID, die in der JSON-Datei steht / Wenn eine Idee damit gespeichert wird / Dann akzeptiert das Backend sie; eine ID, die nicht darin steht, lehnt es mit einer Meldung ab.
- **AC-035-3** Gegeben das Deploy-Paket / Wenn die Anwendung in der Cloud läuft / Dann ist die JSON-Datei enthalten und die Prüfung funktioniert wie lokal.
- **AC-035-4** Gegeben mehrere gewählte Kategorien / Wenn die Übersicht filtert / Dann erscheinen nur Ideen, die alle gewählten Kategorien haben (UND).
- **AC-035-5** Gegeben gewählte Kategorien und Orte / Wenn die Übersicht filtert / Dann gilt zusätzlich, dass die Idee mindestens einen der gewählten Orte hat; die Auswahl steht weiter in der URL.
- **AC-035-6** Gegeben die Filterleiste / Wenn eine Kategorie angezeigt wird / Dann ist ihre Beschreibung in der gewählten Sprache sichtbar.
- **AC-035-7** Gegeben eine Idee mit ICOM-Kategorien / Wenn die Detailseite geöffnet wird / Dann zeigt sie zu jeder Kategorie die ICOM-Referenzen aus der JSON-Datei.
