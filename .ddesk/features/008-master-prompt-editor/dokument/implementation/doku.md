# Doku – Umsetzung F-008

> Der Master-Prompt hat Versionen. Gespeichert wird nur, was sich ändert; Wiederherstellen legt eine neue Version an, nichts wird gelöscht.

Lesen dürfen alle eingeloggten Rollen (Q-008-13); Schreiben und Wiederherstellen nur Admins.

*Annahme: Der Text ist höchstens 20.000 Zeichen lang und darf nicht leer sein. Die Grenze steht im Code (`maxMasterPromptRunes`) und ist nicht mit dem Nutzer abgestimmt.*

Die Vorschau nutzt den Korb des Browsers, in dem der Admin den Editor öffnet. Ein Admin mit leerem Korb sieht `{{ideas}}` als leeren Text.

**Künftiges Problem:** Zwei Admins, die gleichzeitig speichern, überschreiben einander ohne Warnung (letzter Schreibvorgang gewinnt, Q-008-11). Die Versionsnummer wird in einer Transaktion vergeben, der Text aber nicht gegen den Stand des Editors geprüft.

**Künftiges Problem:** Die Fehlermeldungen des Servers (z. B. «unbekannte Variablen: foo») bleiben deutsch, auch in der englischen Oberfläche.
