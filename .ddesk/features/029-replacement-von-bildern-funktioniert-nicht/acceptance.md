---
id: F-029
next: 7
---

# F-029 Akzeptanzkriterien

- **AC-029-1** Gegeben eine Idee mit Bild / Wenn es im Bearbeiten-Formular abgewählt, ein neues hochgeladen und gespeichert wird / Dann zeigt die Detailseite sofort das neue Bild und nicht mehr das alte, auch bei vorher gecachtem alten Bild.
- **AC-029-2** Gegeben ein ersetztes Bild / Wenn die Bild-URL verglichen wird / Dann unterscheidet sie sich von der des alten Bildes (versioniert), und Bilder werden weiterhin mit Cache-Control ausgeliefert.
- **AC-029-3** Gegeben ein abgewähltes Bild / Wenn gespeichert wird / Dann ist das zugehörige Objekt aus dem Bucket gelöscht.
- **AC-029-4** Gegeben eine Idee mit mehreren Bildern / Wenn nur eines ersetzt wird / Dann bleiben die übrigen Bilder und ihre Reihenfolge erhalten, das neue steht hinten.
- **AC-029-5** Gegeben eine Idee mit Bildern / Wenn alle abgewählt werden und keines hochgeladen wird / Dann wird gespeichert und die Idee hat keine Bilder.
- **AC-029-6** Gegeben das Bearbeiten-Formular / Wenn es nach dem Speichern erneut geöffnet wird / Dann zeigt die Liste der bestehenden Bilder das neue Bild, nicht das alte.
