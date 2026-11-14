package app

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
	"unicode/utf8"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

// F-030: two step publishing. A new idea is "pending" until an admin publishes it. Ideas without a
// status (saved before F-030) count as published, so there is no data migration (AC-030-10).

const (
	statusPending   = "pending"
	statusPublished = "published"
	statusRejected  = "rejected"
)

var (
	errNotPending = userError("Diese Idee wartet nicht mehr auf Freigabe.")
)

// effectiveStatus reads a missing status as published.
func effectiveStatus(d ideaDoc) string {
	if d.Status == "" {
		return statusPublished
	}
	return d.Status
}

// isDeleted: an admin removed the idea (F-033). Missing field = active, so no migration is needed.
func isDeleted(d ideaDoc) bool { return d.DeletedAt != nil }

// visibleTo is the one filter for every reading path: removed ideas are never visible, others by status.
func visibleTo(d ideaDoc, isAdmin bool) bool {
	return !isDeleted(d) && canViewStatus(effectiveStatus(d), isAdmin)
}

// canViewStatus: everybody sees published ideas, only admins see the others (D3).
func canViewStatus(status string, isAdmin bool) bool {
	return status == statusPublished || isAdmin
}

// nextStatusOnEdit is the status after an edit and whether the admins are told (D5, AC-030-8, AC-030-9).
// A pending idea stays pending and does not send a second mail.
func nextStatusOnEdit(old string) (status string, notify bool) {
	if old == statusPending {
		return statusPending, false
	}
	return statusPending, true
}

// viewerIsAdmin reports whether the request comes from a signed-in, active admin.
func (s *server) viewerIsAdmin(r *http.Request) bool {
	u, ok := s.currentUser(r)
	return ok && u.Role == roleAdmin
}

// --- mail ---

// Message is one e-mail.
type Message struct {
	To      []string
	Subject string
	Body    string
}

// Mailer sends e-mails. The provider is not chosen yet (F-030 D8); until then logMailer is used.
type Mailer interface {
	Send(ctx context.Context, m Message) error
}

// logMailer only logs; in production no mail leaves the system until a real Mailer is configured.
type logMailer struct{}

func (logMailer) Send(_ context.Context, m Message) error {
	log.Printf("mail (not sent, no mail provider configured): to=%v subject=%q", m.To, m.Subject)
	return nil
}

// approvalsURL is the link to the approvals page, empty if APP_BASE_URL is not set.
func approvalsURL() string {
	base := strings.TrimRight(os.Getenv("APP_BASE_URL"), "/")
	if base == "" {
		return ""
	}
	return base + "/admin/approvals"
}

// recipientsOf drops blocked and empty entries; the input has the form of the users collection.
func recipientsOf(users []userDoc) []string {
	var out []string
	for _, u := range users {
		if u.Role == roleAdmin && !u.Disabled && strings.TrimSpace(u.Email) != "" {
			out = append(out, strings.TrimSpace(u.Email))
		}
	}
	return out
}

// pendingMessage is the mail to the admins about an idea that waits for approval.
func pendingMessage(to []string, title, link string) Message {
	if strings.TrimSpace(title) == "" {
		title = "(ohne Titel)"
	}
	body := "Eine Idee wartet auf Freigabe: " + title + "\n"
	if link != "" {
		body += "\nPrüfen und freigeben: " + link + "\n"
	}
	return Message{To: to, Subject: "Idee zur Freigabe: " + title, Body: body}
}

// rejectionMessage is the mail to the author named in the credit line (O2).
func rejectionMessage(to, title, reason string) Message {
	body := "Deine Idee \"" + title + "\" wurde nicht veröffentlicht."
	if r := strings.TrimSpace(reason); r != "" {
		body += "\n\nBegründung: " + r
	}
	return Message{To: []string{to}, Subject: "Deine Idee wurde nicht veröffentlicht", Body: body + "\n"}
}

// sendPendingMail mails the active admins among users. A failure is logged only (D11, AC-030-5).
func sendPendingMail(ctx context.Context, m Mailer, users []userDoc, title string) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	to := recipientsOf(users)
	if len(to) == 0 {
		log.Printf("notify admins: no active admin with an e-mail address")
		return
	}
	if err := m.Send(ctx, pendingMessage(to, title, approvalsURL())); err != nil {
		log.Printf("notify admins: %v", err)
	}
}

// notifyAdminsPending loads the admins and mails them; it never fails the request (D11).
func (s *server) notifyAdminsPending(ctx context.Context, title string) {
	users, err := s.adminUsers(ctx)
	if err != nil {
		log.Printf("notify admins: %v", err)
		return
	}
	sendPendingMail(ctx, s.mailer, users, title)
}

// adminUsers reads the users with role admin; blocked ones are filtered by recipientsOf.
func (s *server) adminUsers(ctx context.Context) ([]userDoc, error) {
	it := s.db.Collection("users").Where("role", "==", roleAdmin).Documents(ctx)
	defer it.Stop()
	var users []userDoc
	for {
		snap, err := it.Next()
		if errors.Is(err, iterator.Done) {
			return users, nil
		}
		if err != nil {
			return nil, err
		}
		var u userDoc
		if err := snap.DataTo(&u); err == nil {
			users = append(users, u)
		}
	}
}

// --- approvals ---

// apiApprovals handles GET /api/admin/approvals: the ideas that wait, oldest first.
func (s *server) apiApprovals(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	it := s.db.Collection("ideas").OrderBy("created_at", firestore.Asc).Documents(r.Context())
	defer it.Stop()
	out := []ideaView{}
	for {
		snap, err := it.Next()
		if errors.Is(err, iterator.Done) {
			break
		}
		if err != nil {
			log.Printf("list approvals: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "internal error")
			return
		}
		var d ideaDoc
		if err := snap.DataTo(&d); err != nil {
			log.Printf("decode idea %s: %v", snap.Ref.ID, err)
			continue
		}
		if !isDeleted(d) && effectiveStatus(d) == statusPending {
			out = append(out, toIdeaView(snap.Ref.ID, d))
		}
	}
	writeJSON(w, http.StatusOK, out)
}

// decide moves a pending idea to a new status in one transaction; a second admin gets 409 (AC-030-6, AC-030-7).
func (s *server) decide(ctx context.Context, id, status, reason string) (ideaDoc, error) {
	ref := s.db.Collection("ideas").Doc(id)
	var d ideaDoc
	err := s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		snap, err := tx.Get(ref)
		if err != nil {
			return err
		}
		if err := snap.DataTo(&d); err != nil {
			return err
		}
		if isDeleted(d) || effectiveStatus(d) != statusPending {
			return errNotPending
		}
		d.Status = status
		d.RejectionReason = reason
		return tx.Update(ref, []firestore.Update{
			{Path: "status", Value: status},
			{Path: "rejection_reason", Value: reason},
		})
	})
	return d, err
}

func (s *server) answerDecision(w http.ResponseWriter, err error) bool {
	switch {
	case err == nil:
		return true
	case isNotFound(err):
		writeJSONError(w, http.StatusNotFound, "idea not found")
	case errors.Is(err, errNotPending):
		writeJSONError(w, http.StatusConflict, errNotPending.Error())
	default:
		log.Printf("approval: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "internal error")
	}
	return false
}

// apiPublishIdea handles POST /api/admin/approvals/{id}/publish. The submitter gets no mail (D7).
func (s *server) apiPublishIdea(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	if _, err := s.decide(r.Context(), r.PathValue("id"), statusPublished, ""); !s.answerDecision(w, err) {
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": statusPublished})
}

// apiRejectIdea handles POST /api/admin/approvals/{id}/reject with an optional reason.
func (s *server) apiRejectIdea(w http.ResponseWriter, r *http.Request, _ sessionUser) {
	var body struct {
		Reason string `json:"reason"`
	}
	r.Body = http.MaxBytesReader(w, r.Body, 16<<10)
	_ = json.NewDecoder(r.Body).Decode(&body)
	reason := strings.TrimSpace(body.Reason)
	if utf8.RuneCountInString(reason) > maxIdeaTextRunes {
		writeJSONError(w, http.StatusBadRequest, "The reason is too long.")
		return
	}
	d, err := s.decide(r.Context(), r.PathValue("id"), statusRejected, reason)
	if !s.answerDecision(w, err) {
		return
	}
	// O2: only an author named in the credit line can be told; the others get no mail. A failure is logged only.
	if to := strings.TrimSpace(d.CreditEmail); to != "" {
		if err := s.mailer.Send(r.Context(), rejectionMessage(to, d.Title, reason)); err != nil {
			log.Printf("rejection mail: %v", err)
		}
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": statusRejected})
}
