package app

import (
	"context"
	"fmt"
	"time"

	firebase "firebase.google.com/go/v4"

	"cloud.google.com/go/firestore"
)

var errSetupDone = userError("Das Setup wurde bereits ausgeführt.")

// SetupFirstAdmin makes the existing account with the given e-mail address the
// first admin. It runs once: the document system/setup blocks any second run.
// The account must already exist, because the setup only sets its role.
func SetupFirstAdmin(ctx context.Context, project, email string) error {
	fbApp, err := firebase.NewApp(ctx, &firebase.Config{ProjectID: project})
	if err != nil {
		return fmt.Errorf("firebase: %w", err)
	}
	authc, err := fbApp.Auth(ctx)
	if err != nil {
		return fmt.Errorf("firebase auth: %w", err)
	}
	rec, err := authc.GetUserByEmail(ctx, email)
	if err != nil {
		return fmt.Errorf("kein Konto mit der E-Mail %s: %w", email, err)
	}

	db, err := firestore.NewClient(ctx, project)
	if err != nil {
		return fmt.Errorf("firestore: %w", err)
	}
	defer db.Close()

	setupRef := db.Collection("system").Doc("setup")
	userRef := db.Collection("users").Doc(rec.UID)
	return db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		// All reads come before the writes, as Firestore requires.
		_, err := tx.Get(setupRef)
		if err == nil {
			return errSetupDone
		}
		if !isNotFound(err) {
			return err
		}
		_, err = tx.Get(userRef)
		userExists := err == nil
		if err != nil && !isNotFound(err) {
			return err
		}

		if err := tx.Create(setupRef, map[string]any{
			"admin_uid":  rec.UID,
			"created_at": time.Now().UTC(),
		}); err != nil {
			return err
		}
		if !userExists {
			return tx.Create(userRef, userDoc{Email: email, Role: roleAdmin, CreatedAt: time.Now().UTC()})
		}
		// The account may already be blocked; the first admin must be able to sign in.
		return tx.Update(userRef, []firestore.Update{
			{Path: "role", Value: roleAdmin},
			{Path: "disabled", Value: false},
		})
	})
}
