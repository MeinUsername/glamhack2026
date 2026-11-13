// Command setup-admin makes an existing account the first admin. It runs once per project.
//
//	go run ./cmd/setup-admin -project glamhack-hack-2026 admin@example.ch
//
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
	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "Aufruf: setup-admin [-project ID] <E-Mail>\n")
		flag.PrintDefaults()
	}
	flag.Parse()

	if flag.NArg() != 1 {
		flag.Usage()
		os.Exit(2)
	}
	if *project == "" {
		log.Fatal("kein Projekt: -project oder PROJECT_ID setzen")
	}
	email := flag.Arg(0)

	if err := app.SetupFirstAdmin(context.Background(), *project, email); err != nil {
		log.Fatalf("setup: %v", err)
	}
	fmt.Printf("Fertig: %s ist jetzt Admin.\n", email)
}
