---
id: F-011
title: Übersichtseite der Ideen
status: done
---

# F-011 Übersichtseite der Ideen

## Beschreibung

## Ziel

Nutzer sehen auf einer Übersichtseite alle erfassten Ausstellungsideen (F-002), können sie direkt in den Korb legen (F-006) und erkennen am Kaufstatus, welche Ideen schon im Korb liegen.

## Ausgangslage

- Ideen sind erfasst (F-002), der Korb mit «In den Korb» und der Markierung «gekauft» ist beschrieben (F-006).
- Die Übersichtseite soll alle erfassten Ideen zeigen, nicht nur die Korb-Einträge.

## Umfang

**Enthalten**

- Übersichtseite mit allen erfassten Ideen.
- Je Idee: Titel, Bild-Vorschau und Kaufstatus.
- Schaltfläche «In den Korb» je Idee, dieselbe Aktion wie in F-006.
- Kaufstatus «gekauft», wenn die Idee im Korb liegt.

**Nicht enthalten**

- Eigener Kaufstatus neben dem Korb (z. B. «bezahlt», «reserviert»).
- Bezahlung, Checkout, Mengen oder Preise.
- Filter und Sortierung über die Standardreihenfolge hinaus.
- Speicherung des Korbs auf dem Server (bleibt Localstorage nach F-006).

## Entscheidungen

- **D1 Kaufstatus = Korb.** Der Kaufstatus ist die Markierung «gekauft» aus F-006: eine Idee gilt als gekauft, sobald sie im Korb liegt. Es gibt keinen eigenen Status. (Antwort auf Q-011-01.)
- **D2 Einkaufen auf der Übersicht.** Die Übersichtseite hat «In den Korb» je Idee, mit derselben Aktion wie F-006. Eine Idee kann nur einmal im Korb liegen; liegt sie bereits dort, ist die Schaltfläche nicht erneut wählbar und die Idee ist als gekauft markiert. (Antwort auf Q-011-02.)
- **D3 Sichtbarkeit (Annahme).** Die Übersicht ist für alle eingeloggten Rollen sichtbar, wie der Korb in F-006 (D3). Nicht eingeloggte Besucher werden zur Anmeldung geleitet. Offen: Q-011-05.
- **D4 Ideenliste oder eigene Seite (Annahme).** Die Übersicht ist eine eigene Seite. Die Ideenliste aus F-006 bleibt unverändert, ob beide Seiten zusammengeführt werden, ist offen. Offen: Q-011-03.
- **D5 Angaben je Idee (Annahme).** Titel, Bild-Vorschau und Kaufstatus. Keine weiteren Felder der Idee. Offen: Q-011-04.

## Akzeptanzkriterien

- Gegeben ein eingeloggter Nutzer, wenn er die Übersichtseite öffnet, dann sieht er alle erfassten Ideen mit Titel, Bild-Vorschau und Kaufstatus.
- Gegeben eine Idee liegt nicht im Korb, wenn der Nutzer auf der Übersichtseite «In den Korb» wählt, dann liegt sie im Korb und ist als gekauft markiert.
- Gegeben eine Idee liegt bereits im Korb, wenn die Übersichtseite geöffnet wird, dann ist sie als gekauft markiert und «In den Korb» ist für sie nicht erneut wählbar.
- Gegeben eine Idee liegt im Korb, wenn der Nutzer sie aus dem Korb entfernt, dann zeigt die Übersichtseite sie wieder ohne Kaufstatus «gekauft».
- Gegeben ein nicht eingeloggter Besucher, wenn er die Übersichtseite aufruft, dann wird er zur Anmeldung geleitet.
