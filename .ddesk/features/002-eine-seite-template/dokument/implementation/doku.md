# Dokumentation – Umsetzung F-002

> Jede Ausstellungsidee ist eine gespeicherte Seite mit denselben Feldern; Pflichtfelder gibt es keine.

Die Erfassung ist nur für angemeldete Nutzer (Rolle User oder Admin) möglich; gesperrte Konten bekommen keine Antwort außer 401.

*Annahme: Die Grenzen von 5.000 Zeichen je Textfeld, 50 Zeichen je Gerät und 50 Geräte je Seite sind eigene Vorschläge und können im Review geändert werden.*

*Annahme: Die Oberfläche ist englisch; die Fehlermeldungen dieser Erfassung ebenfalls.*

**Künftiges Problem: Die Bilder können über `GET /api/ideas/{id}/images/{n}` nur angesehen, nicht geändert werden. Ein Endpoint zum Ändern kommt mit F-004 und braucht eigene Regeln für die Bildgröße.**

**Künftiges Problem: Die Abfrage des Katalogs ist ein Präfix-Vergleich. Eine Suche in der Mitte des Namens ist nicht möglich.**
