package app

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"log"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
)

// F-012 D5: invitation links have no expiry. Only the single use is enforced.
const inviteTokenSize = 32 // bytes of randomness; the link carries 64 hex characters

var errInvalidInvite = userError("Der Einladungslink ist ungültig oder abgelaufen.")

// invitationDoc lives in the "invitations" collection. The document ID is the
// SHA-256 of the token; the token itself is never stored.
type invitationDoc struct {
	CreatedBy string     `firestore:"created_by"`
	CreatedAt time.Time  `firestore:"created_at"`
	ExpiresAt time.Time  `firestore:"expires_at,omitempty"` // F-001 field; no longer set (F-012 D5)
	UsedAt    *time.Time `firestore:"used_at"`
	UsedBy    *string    `firestore:"used_by"`
}

// newInvitationDoc returns an unused invitation.
func newInvitationDoc(uid string, now time.Time) invitationDoc {
	return invitationDoc{CreatedBy: uid, CreatedAt: now}
}

// usable reports whether the invitation has not been used yet (AC-012-7, AC-012-8, AC-012-9).
// There is no expiry, so now does not matter; it stays in the signature for the callers.
func (d invitationDoc) usable(now time.Time) bool {
	return d.UsedAt == nil
}

// hashToken is the document ID under which a token is stored.
func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func invitationRef(db *firestore.Client, token string) *firestore.DocumentRef {
	return db.Collection("invitations").Doc(hashToken(token))
}

// newInvitation stores a new invitation for uid and returns the token, shown only once.
func (s *server) newInvitation(ctx context.Context, uid string) (string, error) {
	token := randomHex(inviteTokenSize)
	doc := newInvitationDoc(uid, time.Now().UTC())
	if _, err := invitationRef(s.db, token).Create(ctx, doc); err != nil {
		return "", err
	}
	return token, nil
}

// checkInvitation reports whether a token can still be used.
func (s *server) checkInvitation(ctx context.Context, token string) (bool, error) {
	if token == "" {
		return false, nil
	}
	snap, err := invitationRef(s.db, token).Get(ctx)
	if isNotFound(err) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	var d invitationDoc
	if err := snap.DataTo(&d); err != nil {
		return false, err
	}
	return d.usable(time.Now().UTC()), nil
}

// redeemInvitation marks the invitation as used and creates the users document
// with role admin (Q-012-10). Both writes happen in one transaction, so a link works only once.
func (s *server) redeemInvitation(ctx context.Context, token, uid, email string) error {
	ref := invitationRef(s.db, token)
	return s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		snap, err := tx.Get(ref)
		if isNotFound(err) {
			return errInvalidInvite
		}
		if err != nil {
			return err
		}
		var d invitationDoc
		if err := snap.DataTo(&d); err != nil {
			return err
		}
		now := time.Now().UTC()
		if !d.usable(now) {
			return errInvalidInvite
		}
		if err := tx.Update(ref, []firestore.Update{
			{Path: "used_at", Value: now},
			{Path: "used_by", Value: uid},
		}); err != nil {
			return err
		}
		return tx.Create(s.db.Collection("users").Doc(uid), newAdminUser(email))
	})
}

// inviteLink builds the absolute registration URL for a token.
func inviteLink(r *http.Request, token string) string {
	scheme := "http"
	if r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}
	return scheme + "://" + r.Host + "/register?invite=" + token
}

// apiCreateInvitation is the JSON endpoint: {"link"}. Only admins reach it (F-012 D8).
func (s *server) apiCreateInvitation(w http.ResponseWriter, r *http.Request, u sessionUser) {
	token, err := s.newInvitation(r.Context(), u.ID)
	if err != nil {
		log.Printf("api create invitation: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "interner Fehler")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"link": inviteLink(r, token)})
}

// apiCheckInvitation tells the registration page whether a link is still usable,
// before an account is created.
func (s *server) apiCheckInvitation(w http.ResponseWriter, r *http.Request) {
	ok, err := s.checkInvitation(r.Context(), r.PathValue("token"))
	if err != nil {
		log.Printf("check invitation: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "interner Fehler")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"valid": ok})
}
