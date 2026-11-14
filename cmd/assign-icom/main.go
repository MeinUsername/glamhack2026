// Command assign-icom gives ideas that existed before F-024 their ICOM categories and locations.
// The mapping lives in zuordnung.json (title → IDs). Without -apply it is a dry run.
//
//	go run ./cmd/assign-icom -project glamhack-hack-2026            # dry run
//	go run ./cmd/assign-icom -project glamhack-hack-2026 -apply     # write
//
// Ideas that already have ICOM categories or locations are kept unless -overwrite is set.
// The project defaults to the PROJECT_ID environment variable. The command needs
// Application Default Credentials (for example gcloud auth application-default login).
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"

	app "github.com/MeinUsername/glamhack2026"
)

func main() {
	project := flag.String("project", os.Getenv("PROJECT_ID"), "Firebase/GCP project ID (default: $PROJECT_ID)")
	file := flag.String("file", "cmd/assign-icom/zuordnung.json", "Zuordnung Titel → ICOM-Kategorien und Orte")
	apply := flag.Bool("apply", false, "wirklich schreiben (ohne: Probelauf)")
	overwrite := flag.Bool("overwrite", false, "auch Ideen überschreiben, die schon Kategorien oder Orte haben")
	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "Aufruf: assign-icom [-project ID] [-file PFAD] [-apply] [-overwrite]\n")
		flag.PrintDefaults()
	}
	flag.Parse()

	if *project == "" {
		log.Fatal("kein Projekt: -project oder PROJECT_ID setzen")
	}
	list, err := app.ReadICOMAssignments(*file)
	if err != nil {
		log.Fatalf("Zuordnung: %v", err)
	}
	if err := app.AssignICOM(context.Background(), *project, list, *apply, *overwrite, os.Stdout); err != nil {
		log.Fatalf("assign: %v", err)
	}
}
