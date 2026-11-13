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

const (
	inviteTTL       = 7 * 24 * time.Hour
	inviteTokenSize = 32 // bytes of randomness; the link carries 64 hex characters
)

var errInvalidInvite = userError("Der Einladungslink ist ungültig oder abgelaufen.")

// invitationDoc lives in the "invitations" collection. The document ID is the
// SHA-256 of the token; the token itself is never stored.
type invitationDoc struct {
	CreatedBy string     `firestore:"created_by"`
	CreatedAt time.Time  `firestore:"created_at"`
	ExpiresAt time.Time  `firestore:"expires_at"`
	UsedAt    *time.Time `firestore:"used_at"`
	UsedBy    *string    `firestore:"used_by"`
}

// newInvitationDoc returns an unused invitation that is valid for inviteTTL from now.
func newInvitationDoc(uid string, now time.Time) invitationDoc {
	return invitationDoc{CreatedBy: uid, CreatedAt: now, ExpiresAt: now.Add(inviteTTL)}
}

// usable reports whether the invitation is neither used nor expired at now.
func (d invitationDoc) usable(now time.Time) bool {
	return d.UsedAt == nil && now.Before(d.ExpiresAt)
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
func (s *server) newInvitation(ctx context.Context, uid string) (string, time.Time, error) {
	token := randomHex(inviteTokenSize)
	doc := newInvitationDoc(uid, time.Now().UTC())
	if _, err := invitationRef(s.db, token).Create(ctx, doc); err != nil {
		return "", time.Time{}, err
	}
	return token, doc.ExpiresAt, nil
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
// with role user. Both writes happen in one transaction, so a link works only once.
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
		return tx.Create(s.db.Collection("users").Doc(uid), newUser(email))
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

// inviteView is what the dashboard shows after an invitation was created.
type inviteView struct {
	Link      string
	ExpiresAt string
}

func newInviteView(link string, expires time.Time) *inviteView {
	return &inviteView{Link: link, ExpiresAt: expires.Local().Format("02.01.2006 15:04")}
}

// invitationForm is the htmx endpoint on the dashboard: it returns the link fragment.
func (s *server) invitationForm(w http.ResponseWriter, r *http.Request) {
	u, ok := s.currentUser(r)
	if !ok {
		redirect(w, r, "/login")
		return
	}
	data := pageData{User: u.Email}
	token, expires, err := s.newInvitation(r.Context(), u.ID)
	if err != nil {
		log.Printf("create invitation: %v", err)
		data.Error = "Der Einladungslink konnte nicht erzeugt werden."
	} else {
		data.Invite = newInviteView(inviteLink(r, token), expires)
	}
	s.renderPartial(w, "inviteSection", data)
}

// apiCreateInvitation is the JSON endpoint: {"link", "expiresAt"} (RFC 3339).
func (s *server) apiCreateInvitation(w http.ResponseWriter, r *http.Request) {
	u, ok := s.currentUser(r)
	if !ok {
		writeJSONError(w, http.StatusUnauthorized, "nicht angemeldet")
		return
	}
	token, expires, err := s.newInvitation(r.Context(), u.ID)
	if err != nil {
		log.Printf("api create invitation: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "interner Fehler")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{
		"link":      inviteLink(r, token),
		"expiresAt": expires.Format(time.RFC3339),
	})
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
