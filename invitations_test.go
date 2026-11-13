package app

import (
	"strings"
	"testing"
)

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
