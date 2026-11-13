package app

import (
	"context"
	"errors"
	"log"
	"sort"
	"time"

	"cloud.google.com/go/firestore"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/iterator"
)

const (
	roleAdmin = "admin"
	roleUser  = "user"
)

// userDoc lives in the "users" collection, keyed by the Firebase UID. Role and
// block flag are read on every request, so a change takes effect immediately.
type userDoc struct {
	Email     string    `firestore:"email"`
	Role      string    `firestore:"role"`
	Disabled  bool      `firestore:"disabled"`
	CreatedAt time.Time `firestore:"created_at"`
}

// userView is a user as shown on the admin page.
type userView struct {
	UID      string `json:"uid"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	Disabled bool   `json:"disabled"`
}

// Messages for the admin page. They are shown to the user as they are.
const (
	errBadRole       = userError("Unbekannte Rolle.")
	errNoSuchUser    = userError("Nutzer nicht gefunden.")
	errSelfRole      = userError("Du kannst deine eigene Rolle nicht ändern.")
	errSelfBlock     = userError("Du kannst dich nicht selbst sperren.")
	errLastAdminRole = userError("Der letzte aktive Admin kann nicht degradiert werden.")
	errLastAdminLock = userError("Der letzte aktive Admin kann nicht gesperrt werden.")
)

// newUser is the default state of an account: role user, not blocked.
func newUser(email string) userDoc {
	return userDoc{Email: email, Role: roleUser, CreatedAt: time.Now().UTC()}
}

// loadOrCreateUser returns the users document of uid and creates it with role
// user if it is missing. Accounts from before F-001 get their document on first use.
func (s *server) loadOrCreateUser(ctx context.Context, uid, email string) (userDoc, error) {
	ref := s.db.Collection("users").Doc(uid)
	snap, err := ref.Get(ctx)
	if err == nil {
		var d userDoc
		return d, snap.DataTo(&d)
	}
	if !isNotFound(err) {
		return userDoc{}, err
	}

	var d userDoc
	err = s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		snap, err := tx.Get(ref)
		if err == nil {
			return snap.DataTo(&d) // created in the meantime
		}
		if !isNotFound(err) {
			return err
		}
		d = newUser(email)
		return tx.Create(ref, d)
	})
	return d, err
}

// checkRoleChange decides whether actorID may give targetID the role newRole.
// activeOthers counts the enabled admins other than the target.
// Rule: an admin cannot change their own role; the last active admin stays admin.
func checkRoleChange(actorID, targetID string, target userDoc, newRole string, activeOthers int) error {
	if newRole != roleAdmin && newRole != roleUser {
		return errBadRole
	}
	if targetID == actorID && newRole != target.Role {
		return errSelfRole
	}
	if target.Role == roleAdmin && !target.Disabled && newRole != roleAdmin && activeOthers == 0 {
		return errLastAdminRole
	}
	return nil
}

// checkBlock decides whether actorID may block (disabled=true) or unblock targetID.
// Rule: an admin cannot block themselves; the last active admin cannot be blocked.
func checkBlock(actorID, targetID string, target userDoc, disabled bool, activeOthers int) error {
	if !disabled {
		return nil
	}
	if targetID == actorID {
		return errSelfBlock
	}
	if target.Role == roleAdmin && !target.Disabled && activeOthers == 0 {
		return errLastAdminLock
	}
	return nil
}

// activeAdminsOther counts enabled admins other than exclude. It only filters on
// role in Firestore and checks the block flag in memory, so no composite index is needed.
func (s *server) activeAdminsOther(tx *firestore.Transaction, exclude string) (int, error) {
	it := tx.Documents(s.db.Collection("users").Where("role", "==", roleAdmin))
	defer it.Stop()
	n := 0
	for {
		snap, err := it.Next()
		if errors.Is(err, iterator.Done) {
			return n, nil
		}
		if err != nil {
			return 0, err
		}
		if snap.Ref.ID == exclude {
			continue
		}
		var d userDoc
		if err := snap.DataTo(&d); err != nil {
			return 0, err
		}
		if !d.Disabled {
			n++
		}
	}
}

// setRole stores a new role after the rule check, in one transaction.
func (s *server) setRole(ctx context.Context, actorID, targetID, role string) error {
	ref := s.db.Collection("users").Doc(targetID)
	return s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		snap, err := tx.Get(ref)
		if isNotFound(err) {
			return errNoSuchUser
		}
		if err != nil {
			return err
		}
		var d userDoc
		if err := snap.DataTo(&d); err != nil {
			return err
		}
		others := 0
		if d.Role == roleAdmin && !d.Disabled {
			if others, err = s.activeAdminsOther(tx, targetID); err != nil {
				return err
			}
		}
		if err := checkRoleChange(actorID, targetID, d, role, others); err != nil {
			return err
		}
		return tx.Update(ref, []firestore.Update{{Path: "role", Value: role}})
	})
}

// setBlocked stores the block flag after the rule check. The Firebase account is
// updated afterwards: a disabled account cannot sign in, and its sessions are revoked.
// Until then the users document already decides, because currentUser checks it.
func (s *server) setBlocked(ctx context.Context, actorID, targetID string, disabled bool) error {
	ref := s.db.Collection("users").Doc(targetID)
	err := s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		snap, err := tx.Get(ref)
		if isNotFound(err) {
			return errNoSuchUser
		}
		if err != nil {
			return err
		}
		var d userDoc
		if err := snap.DataTo(&d); err != nil {
			return err
		}
		others := 0
		if d.Role == roleAdmin && !d.Disabled {
			if others, err = s.activeAdminsOther(tx, targetID); err != nil {
				return err
			}
		}
		if err := checkBlock(actorID, targetID, d, disabled, others); err != nil {
			return err
		}
		return tx.Update(ref, []firestore.Update{{Path: "disabled", Value: disabled}})
	})
	if err != nil {
		return err
	}

	if _, err := s.authc.UpdateUser(ctx, targetID, (&auth.UserToUpdate{}).Disabled(disabled)); err != nil {
		return err
	}
	if disabled {
		if err := s.authc.RevokeRefreshTokens(ctx, targetID); err != nil {
			return err
		}
	}
	return nil
}

// listUsers returns all accounts sorted by e-mail address.
func (s *server) listUsers(ctx context.Context) ([]userView, error) {
	it := s.db.Collection("users").Documents(ctx)
	defer it.Stop()
	var out []userView
	for {
		snap, err := it.Next()
		if errors.Is(err, iterator.Done) {
			break
		}
		if err != nil {
			return nil, err
		}
		var d userDoc
		if err := snap.DataTo(&d); err != nil {
			log.Printf("user %s: %v", snap.Ref.ID, err)
			continue
		}
		out = append(out, userView{UID: snap.Ref.ID, Email: d.Email, Role: d.Role, Disabled: d.Disabled})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Email < out[j].Email })
	return out, nil
}

// userExists reports whether a users document exists. Errors other than "not found" count as existing.
func (s *server) userExists(ctx context.Context, uid string) bool {
	_, err := s.db.Collection("users").Doc(uid).Get(ctx)
	return err == nil || !isNotFound(err)
}
