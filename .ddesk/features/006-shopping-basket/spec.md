---
id: F-006
title: Shopping Basket
status: testing
---

# F-006 Shopping Basket

## Beschreibung

## Ziel

Nutzer können Ausstellungsideen (F-002) in einen Korb legen, den Korb einsehen und Ideen wieder daraus entfernen. Ideen, die im Korb liegen, sind als «gekauft» markiert.

## Ausgangslage

- Die Ideen sollen in einen Shopping Basket gelegt werden können.
- Der Korb wird im Localstorage gespeichert.
- Ideen lassen sich wieder entfernen. Dafür gibt es eine Übersichtsseite der gekauften Ideen.
- Eine Idee kann nur einmal in den Korb gelegt werden.
- Eine «gekaufte» Idee wird markiert.

## Umfang

**Enthalten**

- Schaltfläche «In den Korb» je Idee in der Ideenliste.
- Korbseite als Übersicht der Ideen im Korb, mit Entfernen-Aktion je Eintrag.
- Markierung «gekauft» an Ideen, die im Korb liegen, in der Ideenliste und auf der Korbseite.
- Speicherung des Korbs im Localstorage des Browsers.

**Nicht enthalten**

- Speicherung des Korbs auf dem Server oder im Nutzerkonto.
- Synchronisation zwischen Geräten oder Browsern.
- Bezahlung, Checkout, Mengen oder Preise.

## Entscheidungen

- **D1 Gekauft = im Korb.** Eine Idee gilt als gekauft, sobald sie in den Korb gelegt wird. Es gibt keine eigene Aktion «als gekauft markieren» und keinen getrennten Kaufstatus.
- **D2 Entfernen an zwei Stellen.** Eine Idee wird auf der Korbseite und in der Ideenliste aus dem Korb entfernt.
- **D3 Sichtbarkeit.** Der Korb ist für alle eingeloggten Rollen sichtbar. Nicht eingeloggte Besucher sehen ihn nicht.
- **D4 Gelöschte Ideen.** Ist eine Idee in F-002 inzwischen gelöscht, entfernt die Korbseite den Eintrag beim Öffnen stillschweigend aus dem Korb.
- **D5 Speicherort.** Der Korb liegt pro Browser im Localstorage und ist unabhängig vom Login. Er bleibt beim Abmelden erhalten.
- **Eindeutigkeit.** Eine Idee kann höchstens einmal im Korb liegen.

## Akzeptanzkriterien

- Gegeben ein eingeloggter Nutzer sieht eine Idee in der Ideenliste, wenn er «In den Korb» wählt, dann liegt die Idee im Korb und ist als gekauft markiert.
- Gegeben eine Idee liegt bereits im Korb, wenn der Nutzer erneut «In den Korb» wählt, dann bleibt sie genau einmal im Korb.
- Gegeben eine Idee liegt im Korb, wenn der Nutzer sie auf der Korbseite entfernt, dann verschwindet sie vom Korb und ihre Markierung in der Ideenliste entfällt.
- Gegeben eine Idee liegt im Korb, wenn der Nutzer die Seite neu lädt oder sich ab- und wieder anmeldet, dann ist der Korb unverändert.
- Gegeben eine Idee im Korb ist in F-002 gelöscht, wenn der Nutzer die Korbseite öffnet, dann wird der Eintrag nicht angezeigt und ist aus dem Korb entfernt.
- Gegeben ein nicht eingeloggter Besucher, wenn er die Korbseite aufruft, dann sieht er den Korb nicht und wird zur Anmeldung geleitet.
