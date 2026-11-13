package app

import (
	"errors"
	"testing"
)

const (
	actorAdmin = "uid-admin"
	otherAdmin = "uid-other"
	plainUser  = "uid-user"
)

func adminDoc(disabled bool) userDoc {
	return userDoc{Email: "a@example.ch", Role: roleAdmin, Disabled: disabled}
}
func userDocPlain() userDoc { return userDoc{Email: "u@example.ch", Role: roleUser} }

// AC-001-6: only the admin role grants admin rights.
func TestAC001_6_OnlyAdminRoleGrantsAdminRights(t *testing.T) {
	if isAdmin(sessionUser{Role: roleUser}) {
		t.Error("role user must not be admin")
	}
	if isAdmin(sessionUser{Role: ""}) {
		t.Error("missing role must not be admin")
	}
	if !isAdmin(sessionUser{Role: roleAdmin}) {
		t.Error("role admin must be admin")
	}
}

// AC-001-5: an admin can assign roles; the change is checked against the rules.
func TestAC001_5_RoleChangeAllowedForAdminWhenOtherAdminExists(t *testing.T) {
	if err := checkRoleChange(actorAdmin, plainUser, userDocPlain(), roleAdmin, 1); err != nil {
		t.Fatalf("promoting a user must be allowed, got %v", err)
	}
	if err := checkRoleChange(actorAdmin, otherAdmin, adminDoc(false), roleUser, 1); err != nil {
		t.Fatalf("demoting an admin while another active admin exists must be allowed, got %v", err)
	}
}

func TestAC001_5_UnknownRoleIsRejected(t *testing.T) {
	err := checkRoleChange(actorAdmin, plainUser, userDocPlain(), "superuser", 1)
	if !errors.Is(err, errBadRole) {
		t.Fatalf("expected errBadRole, got %v", err)
	}
}

// AC-001-5 with the protection rule: the last active admin stays admin and unblocked.
func TestAC001_5_LastActiveAdminCannotBeDemotedOrBlocked(t *testing.T) {
	if err := checkRoleChange(otherAdmin, actorAdmin, adminDoc(false), roleUser, 0); !errors.Is(err, errLastAdminRole) {
		t.Errorf("demoting the last active admin: want errLastAdminRole, got %v", err)
	}
	if err := checkBlock(otherAdmin, actorAdmin, adminDoc(false), true, 0); !errors.Is(err, errLastAdminLock) {
		t.Errorf("blocking the last active admin: want errLastAdminLock, got %v", err)
	}
}

// A blocked admin does not count as an active admin, so demoting them is harmless.
func TestAC001_5_BlockedAdminCanBeDemoted(t *testing.T) {
	if err := checkRoleChange(actorAdmin, otherAdmin, adminDoc(true), roleUser, 0); err != nil {
		t.Fatalf("demoting an already blocked admin must be allowed, got %v", err)
	}
}

// AC-001-5 with the self-protection rule: an admin cannot change their own role or block themselves.
func TestAC001_5_AdminCannotChangeOwnRoleOrBlockSelf(t *testing.T) {
	if err := checkRoleChange(actorAdmin, actorAdmin, adminDoc(false), roleUser, 1); !errors.Is(err, errSelfRole) {
		t.Errorf("own role change: want errSelfRole, got %v", err)
	}
	if err := checkBlock(actorAdmin, actorAdmin, adminDoc(false), true, 1); !errors.Is(err, errSelfBlock) {
		t.Errorf("self block: want errSelfBlock, got %v", err)
	}
	// Unblocking oneself and re-sending the current role are not changes.
	if err := checkBlock(actorAdmin, actorAdmin, adminDoc(false), false, 1); err != nil {
		t.Errorf("self unblock must be allowed, got %v", err)
	}
	if err := checkRoleChange(actorAdmin, actorAdmin, adminDoc(false), roleAdmin, 1); err != nil {
		t.Errorf("keeping the own role must be allowed, got %v", err)
	}
}

// AC-001-4: a new account gets role user and is not blocked.
func TestAC001_4_NewAccountHasRoleUser(t *testing.T) {
	d := newUser("neu@example.ch")
	if d.Role != roleUser {
		t.Errorf("role = %q, want %q", d.Role, roleUser)
	}
	if d.Disabled {
		t.Error("new account must not be blocked")
	}
}
