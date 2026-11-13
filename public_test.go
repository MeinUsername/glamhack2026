package app

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

// AC-012-3 and Q-012-09: the initial admin account is created at start only with a password,
// and an existing account is only promoted, never changed in its password.
func TestAC012_3_InitialAdminPlan(t *testing.T) {
	cases := []struct {
		name     string
		exists   bool
		password string
		want     initialAdminAction
	}{
		{"no account, password given: create", false, "geheim", initialAdminCreate},
		{"no account, no password: skip, app still starts", false, "", initialAdminSkip},
		{"account exists, password given: promote, keep password", true, "geheim", initialAdminPromote},
		{"account exists, no password: promote", true, "", initialAdminPromote},
	}
	for _, c := range cases {
		if got := planInitialAdmin(c.exists, c.password); got != c.want {
			t.Errorf("%s: got %v, want %v", c.name, got, c.want)
		}
	}
}

// AC-012-3: without INITIAL_ADMIN_EMAIL the default address from the spec is used.
func TestAC012_3_InitialAdminDefaultEmail(t *testing.T) {
	t.Setenv("INITIAL_ADMIN_EMAIL", "")
	if got := initialAdminEmail(); got != "glamhack@x99.ch" {
		t.Errorf("initialAdminEmail() = %q", got)
	}
	t.Setenv("INITIAL_ADMIN_EMAIL", "anders@example.ch")
	if got := initialAdminEmail(); got != "anders@example.ch" {
		t.Errorf("override ignored: %q", got)
	}
}

// AC-012-4: whoever redeems an invitation gets the role admin.
func TestAC012_4_RedeemedInvitationGivesAdmin(t *testing.T) {
	if d := newAdminUser("neu@example.ch"); d.Role != roleAdmin || d.Disabled {
		t.Errorf("new admin = %+v", d)
	}
}

// AC-012-7 and AC-012-9: an invitation works once; a used one is rejected.
func TestAC012_7_InvitationIsSingleUse(t *testing.T) {
	now := time.Date(2026, 11, 13, 9, 0, 0, 0, time.UTC)
	d := newInvitationDoc("uid-1", now)
	if !d.usable(now) {
		t.Fatal("fresh invitation must be usable")
	}
	used := now.Add(time.Minute)
	d.UsedAt = &used
	if d.usable(now.Add(time.Hour)) {
		t.Error("used invitation must not be usable again")
	}
}

// AC-012-8: an unused invitation has no expiry, even months later.
func TestAC012_8_OldInvitationStillWorks(t *testing.T) {
	created := time.Date(2026, 1, 1, 9, 0, 0, 0, time.UTC)
	d := newInvitationDoc("uid-1", created)
	if !d.usable(created.AddDate(0, 6, 0)) {
		t.Error("unused invitation must still be usable after months")
	}
	if !d.ExpiresAt.IsZero() {
		t.Error("new invitations must not store an expiry")
	}
}

// AC-012-10: only admins may create invitation links.
func TestAC012_10_InvitationCreationNeedsAdmin(t *testing.T) {
	called := false
	h := guardAdmin(
		func(*http.Request) (sessionUser, bool) { return sessionUser{ID: "u", Role: roleUser}, true },
		func(w http.ResponseWriter, r *http.Request, _ sessionUser) { called = true },
	)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest("POST", "/api/invitations", nil))
	if called || rec.Code != http.StatusForbidden {
		t.Errorf("non-admin: called=%v status=%d, want 403 without the handler", called, rec.Code)
	}
}

// AC-012-11: two admins create links; both stay valid until used.
func TestAC012_11_TwoAdminsLinksAreBothValid(t *testing.T) {
	now := time.Date(2026, 11, 13, 9, 0, 0, 0, time.UTC)
	a := newInvitationDoc("admin-a", now)
	b := newInvitationDoc("admin-b", now)
	if !a.usable(now) || !b.usable(now) {
		t.Error("both invitations must be usable")
	}
}

// AC-012-2 (T6): on edit, kept images keep their order, and the rest is returned for deletion.
func TestAC012_2_SelectKeptImages(t *testing.T) {
	old := []imageDoc{{Object: "a"}, {Object: "b"}, {Object: "c"}}
	kept, removed, err := selectKeptImages(old, []int{2, 0})
	if err != nil {
		t.Fatal(err)
	}
	if len(kept) != 2 || kept[0].Object != "c" || kept[1].Object != "a" {
		t.Errorf("kept = %+v", kept)
	}
	if len(removed) != 1 || removed[0].Object != "b" {
		t.Errorf("removed = %+v", removed)
	}
	for _, bad := range [][]int{{3}, {-1}, {0, 0}} {
		if _, _, err := selectKeptImages(old, bad); err == nil {
			t.Errorf("keep %v accepted, want rejection", bad)
		}
	}
}
