package app

import (
	"strings"
	"testing"
	"time"
)

// AC-001-2: an invitation is usable once and for 7 days.
func TestAC001_2_InvitationIsSingleUseAndExpiresAfter7Days(t *testing.T) {
	now := time.Date(2026, 11, 13, 9, 0, 0, 0, time.UTC)
	d := newInvitationDoc("uid-1", now)

	if want := now.Add(7 * 24 * time.Hour); !d.ExpiresAt.Equal(want) {
		t.Fatalf("ExpiresAt = %v, want %v", d.ExpiresAt, want)
	}
	if !d.usable(now) {
		t.Error("fresh invitation must be usable")
	}
	if !d.usable(now.Add(7*24*time.Hour - time.Second)) {
		t.Error("invitation must still be usable one second before expiry")
	}

	used := now.Add(time.Hour)
	d.UsedAt = &used
	if d.usable(now.Add(time.Hour)) {
		t.Error("used invitation must not be usable again")
	}
}

// AC-001-3: an expired invitation is rejected.
func TestAC001_3_ExpiredInvitationIsRejected(t *testing.T) {
	now := time.Date(2026, 11, 13, 9, 0, 0, 0, time.UTC)
	d := newInvitationDoc("uid-1", now)
	if d.usable(now.Add(7 * 24 * time.Hour)) {
		t.Error("invitation must be rejected at and after expiry")
	}
	if d.usable(now.Add(8 * 24 * time.Hour)) {
		t.Error("invitation must be rejected after expiry")
	}
}

// The token is never stored: only its hash is the document ID.
func TestHashTokenIsDeterministicAndHidesToken(t *testing.T) {
	token := randomHex(inviteTokenSize)
	if len(token) != 2*inviteTokenSize {
		t.Fatalf("token length = %d, want %d", len(token), 2*inviteTokenSize)
	}
	h := hashToken(token)
	if h != hashToken(token) {
		t.Error("hash must be deterministic")
	}
	if len(h) != 64 {
		t.Errorf("hash length = %d, want 64", len(h))
	}
	if strings.Contains(h, token) {
		t.Error("hash must not contain the token")
	}
	if hashToken(token) == hashToken(randomHex(inviteTokenSize)) {
		t.Error("different tokens must have different hashes")
	}
}
