---
id: F-015
title: Schreibe einen Importer auf der Admin Seite um ein Intial CSV zum Importieren
status: plan-ready
---

# F-015 Schreibe einen Importer auf der Admin Seite um ein Intial CSV zum Importieren

## Beschreibung

### Ziel

Ein Admin lädt auf der Admin-Seite eine CSV-Datei hoch, und jede Zeile wird als Idee angelegt. Die Spalten entsprechen dem erweiterten Seiten-Template aus F-014. Damit lässt sich der Start-Bestand an Ideen einspielen, ohne jede Idee von Hand zu erfassen.

### Umfang

- Upload einer CSV-Datei auf der Admin-Seite. Nur die Rolle Admin darf importieren (wie F-010).
- Zuordnung der CSV-Spalten zu den Feldern aus F-014 (siehe Tabelle).
- Vorschau vor dem Speichern: Anzahl neuer, übersprungener und fehlerhafter Zeilen, mit Bestätigung durch den Admin.
- Speichern der gültigen Zeilen als Ideen.
- Meldung je Zeile für fehlerhafte und übersprungene Zeilen.

Nicht Teil dieses Features: Import der JSON-Exportdatei aus F-010, Bilder aus der CSV, Export als CSV, Übersetzung der Labels.

### Spalten-Zuordnung

| CSV-Spalte | Feld (F-014) | Behandlung |
|---|---|---|
| Title | Titel | Pflicht |
| description of idea | Beschreibung | Text |
| description of interaction | description of interaction | Text |
| goal | Goal | Text |
| target group | Zielpublikum (`target_group`) | Text |
| equipment needed | Needed Equipment | Komma-getrennt in Chips (Annahme, siehe unten) |
| space needed | Needed Space | nicht übernommen (Entscheidung D4) |
| staff needed | staff needed | Text |
| necessarily related to specific exhibits | necessarily related to specific exhibits | Text |
| accessibility | Accessibility | Text |
| picture | Bilder | leer, kein Bildimport (D6) |

Felder, die die CSV nicht enthält (Sustainability, Budget, Kategorien aus F-009), bleiben leer (D7).

### Entscheidungen

- **D1 (Q-015-01):** Jede CSV-Zeile ergibt eine Idee.
- **D2 (Q-015-02):** Existiert bereits eine Idee mit gleichem Titel, wird die Zeile übersprungen und gemeldet. Es gibt kein Überschreiben.
- **D3 (Q-015-03):** Gültige Zeilen werden gespeichert, fehlerhafte Zeilen werden gemeldet. Eine fehlerhafte Zeile bricht den Import nicht ab. Fehlerhaft ist eine Zeile ohne Titel.
- **D4 (Q-015-04):** Die Spalte «space needed» wird nicht als Zahl geparst. Der Wert «Skip this value» des Nutzers bedeutet: Der Wert wird verworfen, das Feld bleibt leer, die Zeile wird trotzdem importiert.
- **D5 (Q-015-05, Empfehlung übernommen):** Kein Bildimport. Bilder werden später über die Oberfläche hochgeladen.
- **D6 (Q-015-06, Empfehlung übernommen):** Upload über die Admin-Seite, kein fest eingebetteter Seed.
- **D7 (Q-015-09, Empfehlung übernommen):** Felder ohne CSV-Spalte bleiben leer.
- **D8 (Q-015-07, Empfehlung übernommen):** Der Import darf mehrfach laufen, nur für Admin.
- **D9 (Q-015-08, Empfehlung übernommen):** Vorschau mit Bestätigung vor dem Speichern.

### Annahmen (vom Nutzer zu bestätigen)

- *«equipment needed» wird an Kommas getrennt und als einzelne Chips gespeichert.*
- *«necessarily related to specific exhibits» und «staff needed» sind Freitext, wie in D4 von F-014 festgelegt, auch wenn die CSV dort «yes» oder «no» enthält.*
- *Der Rohtext von «space needed» wird nicht gespeichert, auch nicht als Notiz. Das folgt aus «Skip this value»; bitte bestätigen, weil F-014 dafür strukturierte Werte vorsieht.*
- *Die Dublettenprüfung vergleicht Titel ohne Beachtung von Gross- und Kleinschreibung.*

### Abhängigkeiten

- **F-002 Eine Seite-Template:** Die Felder und die Ideen-Speicherung kommen von dort.
- **F-009 Kategorien hinzufügen zu Seiten-Template:** Kategorien bleiben leer (D7).
- **F-014 Erweitern von Seiten-Template:** Die Zielfelder kommen aus F-014. F-014 ist noch nicht abgeschlossen; der Import setzt die neuen Felder voraus.
- **F-010 Export und Import:** Eigene Funktion für die JSON-Datei. Die Abgrenzung der Admin-Oberfläche beider Importe ist beim Plan zu prüfen.

### Offen

- **Ablauf der Vorschau:** Zeigt die Admin-Seite die Vorschau direkt nach dem Upload oder in einem zweiten Schritt? Beim Plan zu entscheiden.

### Ausgangsdatei

Die CSV des Nutzers, Grundlage für Tests und Abnahme:

```csv
Title,description of idea,description of interaction,goal,target group,equipment needed,space needed,staff needed,necessarily related to specific exhibits,accessibility,picture
E-ink,Small screen displaying general questions about the visitor's art experience. three buttons,"Visitor presses next, back or random button.",make visitors think about their experience,general literate visitors,"e-ink device, wiring",depends on the size of the screen,no,no,Text only: needs reading. Mount screen and buttons at wheelchair height; large font.,
Postcards,Postcards with question or inputs,Visitor picks them up and reads them.,make visitors think about their experience,general literate visitors,Printed postcards,Postcard holder or even surface,no,no,Text only: needs reading. Large print; holder within reach from a wheelchair.,
"""Am I the only one?"" counter","Screen next to a work showing one real visitor question and a button ""I wondered this too""; a counter shows how many pressed it.",Visitor reads the question and presses the button if they share it.,show visitors they are not alone with their questions; show the museum which questions are common,"shy or first-time visitors, teenagers","e-ink device, button, wiring",about 30 × 30 cm of wall or pedestal next to the work,no,yes,"Text only: needs reading. Button at wheelchair height, tactile.",
Second label,"Extra label next to the wall text with the most-asked visitor question about this work and a short answer, updated regularly.",Visitor reads it next to the work.,answer recurring questions where they arise,general literate visitors,printed labels and holders (or small e-ink label),next to the existing wall text,no,yes,Plain language; large print; easy-language version possible.,
Question wall over time,"Wall where visitors post their questions, sorted by date, next to questions from earlier years and other generations.","Visitor writes a question on a sticky note, puts it on the wall and reads the others.",connect visitors across time and generations; collect questions,"all ages, families, school classes","board, sticky notes, pens",2–3 m of wall,no,no,Writing needed: allow drawings; pens and notes at several heights.,
Talking hour,Fixed time slot when talking in the gallery is welcome; a mediator moderates a conversation that starts from visitor questions.,"Visitor joins the group, listens and shares their view.","conversation among visitors; museum as moderator, not teacher","adults, regular visitors, seniors, local community","stools, sign with the time, question cards",quiet corner for 8–15 people,yes,no,Spoken: state the language; seats available; hearing loop to check.,
The museum asks back,"The museum puts one open question next to a work (e.g. ""What would you title this?""); some answers are shown nearby.",Visitor reads the question and writes an answer on a card or via QR code.,turn explanation into conversation; learn how visitors read the works,general literate visitors,"printed question, answer cards, box, pens or QR code","next to the work, small surface for the box",no,yes,Written: offer QR and card; large print.,
Mediator logbook,Mediators and guards note the questions visitors ask them during the day.,Visitor asks a mediator; the mediator records the question (no personal data).,capture questions that are asked but stay invisible,"internal: mediators, curators; visitors who talk to staff",notebook or tablet with a short form,none in the gallery,yes,no,Works in any language the mediator speaks; no reading needed for the visitor.,
Exit question (QR),"At the exit one question is shown: ""What did you still want to know?""",Visitor scans a QR code and answers on their phone; results can appear on a screen.,show the museum what was missing,"smartphone users, younger visitors","QR sign, online form or Mentimeter, optional screen","exit area, wall for the sign",no,no,Needs a smartphone: offer a paper card as alternative.,
Digital feedback station,Touchscreen where visitors type a question and read questions others left about the same room.,Visitor types a question and browses others.,low-threshold digital way to ask; see others' questions,visitors comfortable with screens,"touchscreen or tablet on a stand, network",about 1 m² of floor,no,no,Screen at adjustable or seated height; large font; several languages.,
Audio guide question track,"Extra track per work in the audio guide: real visitor questions read aloud, with a short answer or another visitor's view.",Visitor chooses the question track in the audio guide.,bring visitors' voices and questions into the visit,audio guide users,"existing audio guide, recordings",none,no,yes,Good for visually impaired visitors; add a text transcript for deaf visitors.,
Question-led guided tour,Guided tour built around the most frequent visitor questions instead of a fixed script.,Visitors name their questions at the start; the guide builds the route around them.,answer what visitors actually want to know,"tour participants, groups, school classes",question cards,existing tour route,yes,yes,Spoken: state the language; step-free route and seats to check.,
Question workshop,Workshop where participants learn to look closely and formulate questions about artworks.,"Participants look, write and exchange questions in small groups.",value questions as knowledge; build confidence in front of art,"schools, families, adult learners","paper, pens, printed images, flipchart",workshop room or gallery corner,yes,yes,Adaptable: drawing or speaking instead of writing.,
Visitor meetups,The museum announces meetups on Meetup or Spontacts around a question from the archive.,"Visitors sign up online, meet in the museum and visit together.",connect visitors who share a curiosity,"young adults, newcomers, people visiting alone",account on a meetup platform,meeting point in the museum,yes,no,Online sign-up needed; meeting point step-free.,
Social media video answers,"Short videos in which mediators, artists or visitors answer one visitor question each.",Visitor watches the video on a screen or via QR code next to the work.,"answers in a familiar format, also online","younger visitors, online audience","smartphone or camera, screen or QR sign",small screen or sign next to the work,no,yes,Subtitles needed; audio description to check.,
FAQ booklet / page,"The most frequent questions per exhibition and their answers, in a booklet and on the website.",Visitor reads it before or during the visit.,answer common information needs,"visitors preparing their visit, teachers","printed booklet, web page",display at the entrance,no,no,Easy-language and large-print versions.,
Online question archive,"Searchable archive of all collected questions, by work, date and type.",Visitor or curator searches and reads questions online.,"make visitors' questions lasting, shared knowledge","museums, researchers, curators, interested public","database, website",none (online),no,no,Website accessibility (WCAG) to check.,
Curator AI assistant,Platform where curators describe their exhibition and get a prompt for reflection and new interventions.,"Curator fills in a form, copies the prompt into an AI assistant.",help curators choose and plan their own interventions,curators and education teams,"computer, AI assistant",none,no,no,"Prompt can ask for answers in DE, FR, EN, IT.",
```
