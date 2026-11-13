package app

import (
	"context"
	"log"
	"os"
	"time"

	"cloud.google.com/go/firestore"
	"firebase.google.com/go/v4/auth"
)

// F-012 D3: the initial admin comes from the configuration and exists after the start.
const defaultInitialAdminEmail = "glamhack@x99.ch"

type initialAdminAction int

const (
	initialAdminSkip    initialAdminAction = iota // no account and no password: nothing to do
	initialAdminCreate                            // no account yet, password given: create it
	initialAdminPromote                           // account exists: only its role is set
)

// planInitialAdmin decides what happens at start. An existing account is never
// changed in its password (Q-012-09).
func planInitialAdmin(accountExists bool, password string) initialAdminAction {
	switch {
	case accountExists:
		return initialAdminPromote
	case password != "":
		return initialAdminCreate
	default:
		return initialAdminSkip
	}
}

// initialAdminEmail is the configured address, or the default.
func initialAdminEmail() string {
	if e := os.Getenv("INITIAL_ADMIN_EMAIL"); e != "" {
		return e
	}
	return defaultInitialAdminEmail
}

// ensureInitialAdmin creates the initial admin account (if needed) and sets its role to admin.
// The block flag is not touched. Without a password and without an existing account, it only logs.
func (s *server) ensureInitialAdmin(ctx context.Context) error {
	email := initialAdminEmail()
	rec, err := s.authc.GetUserByEmail(ctx, email)
	if err != nil && !auth.IsUserNotFound(err) {
		return err
	}
	exists := err == nil

	switch planInitialAdmin(exists, os.Getenv("INITIAL_ADMIN_PASSWORD")) {
	case initialAdminSkip:
		log.Printf("initial admin %s: no account and no INITIAL_ADMIN_PASSWORD, skipped", email)
		return nil
	case initialAdminCreate:
		rec, err = s.authc.CreateUser(ctx, (&auth.UserToCreate{}).Email(email).Password(os.Getenv("INITIAL_ADMIN_PASSWORD")))
		if err != nil {
			return err
		}
		log.Printf("initial admin %s: account created", email)
	}
	return s.makeAdmin(ctx, rec.UID, email)
}

// makeAdmin sets role admin on the users document; a missing document is created.
func (s *server) makeAdmin(ctx context.Context, uid, email string) error {
	ref := s.db.Collection("users").Doc(uid)
	_, err := ref.Get(ctx)
	if isNotFound(err) {
		_, err := ref.Create(ctx, userDoc{Email: email, Role: roleAdmin, CreatedAt: time.Now().UTC()})
		return err
	}
	if err != nil {
		return err
	}
	_, err = ref.Update(ctx, []firestore.Update{{Path: "role", Value: roleAdmin}})
	return err
}
