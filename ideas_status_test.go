package app

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type fakeMailer struct {
	sent []Message
	err  error
}

func (f *fakeMailer) Send(_ context.Context, m Message) error {
	f.sent = append(f.sent, m)
	return f.err
}

// AC-030-10: a missing status counts as published.
func TestAC030_10_MissingStatusIsPublished(t *testing.T) {
	if effectiveStatus(ideaDoc{}) != statusPublished {
		t.Error("old idea is not published")
	}
	if effectiveStatus(ideaDoc{Status: statusPending}) != statusPending {
		t.Error("pending lost")
	}
	if v := toIdeaView("x", ideaDoc{}); v.Status != statusPublished {
		t.Errorf("view status = %q", v.Status)
	}
}

// AC-030-2, AC-030-3: only admins see ideas that are not published.
func TestAC030_2_Visibility(t *testing.T) {
	for _, st := range []string{statusPending, statusRejected} {
		if canViewStatus(st, false) {
			t.Errorf("%s visible to non-admin", st)
		}
		if !canViewStatus(st, true) {
			t.Errorf("%s hidden from admin", st)
		}
	}
	if !canViewStatus(statusPublished, false) {
		t.Error("published hidden")
	}
}

// AC-030-8, AC-030-9: edits send the idea back to review, a pending idea sends no second mail.
func TestAC030_NextStatusOnEdit(t *testing.T) {
	for _, tc := range []struct {
		old    string
		notify bool
	}{{statusPublished, true}, {statusRejected, true}, {statusPending, false}} {
		st, notify := nextStatusOnEdit(tc.old)
		if st != statusPending || notify != tc.notify {
			t.Errorf("%s -> %s, notify %v", tc.old, st, notify)
		}
	}
}

// AC-030-4: all active admins are mailed, blocked ones and empty addresses are not.
func TestAC030_4_RecipientsAndText(t *testing.T) {
	users := []userDoc{
		{Email: "a@x.ch", Role: roleAdmin},
		{Email: "b@x.ch", Role: roleAdmin, Disabled: true},
		{Email: "c@x.ch", Role: roleUser},
		{Email: " ", Role: roleAdmin},
		{Email: "d@x.ch", Role: roleAdmin},
	}
	t.Setenv("APP_BASE_URL", "https://app.example/")
	f := &fakeMailer{}
	sendPendingMail(context.Background(), f, users, "Lichtkabine")
	if len(f.sent) != 1 {
		t.Fatalf("sent %d mails", len(f.sent))
	}
	m := f.sent[0]
	if strings.Join(m.To, ",") != "a@x.ch,d@x.ch" {
		t.Errorf("to = %v", m.To)
	}
	if !strings.Contains(m.Subject, "Lichtkabine") || !strings.Contains(m.Body, "https://app.example/admin/approvals") {
		t.Errorf("message = %+v", m)
	}
}

// AC-030-5: a failing mail provider does not break anything; without recipients nothing is sent.
func TestAC030_5_MailFailureIsSwallowed(t *testing.T) {
	f := &fakeMailer{err: errors.New("smtp down")}
	sendPendingMail(context.Background(), f, []userDoc{{Email: "a@x.ch", Role: roleAdmin}}, "T") // must not panic or return an error
	if len(f.sent) != 1 {
		t.Errorf("sent %d", len(f.sent))
	}
	f = &fakeMailer{}
	sendPendingMail(context.Background(), f, nil, "T")
	if len(f.sent) != 0 {
		t.Error("mail without recipient")
	}
}

// AC-030-7: the rejection mail names the reason; the reason is optional.
func TestAC030_7_RejectionMessage(t *testing.T) {
	m := rejectionMessage("a@x.ch", "Idee", " zu vage ")
	if m.To[0] != "a@x.ch" || !strings.Contains(m.Body, "Begründung: zu vage") {
		t.Errorf("message = %+v", m)
	}
	if m := rejectionMessage("a@x.ch", "Idee", ""); strings.Contains(m.Body, "Begründung") {
		t.Errorf("empty reason shown: %+v", m)
	}
}

// AC-030-12: the approval routes need an admin session.
func TestAC030_12_ApprovalRoutesGuards(t *testing.T) {
	s := newRouteServer(t)
	for _, tc := range []struct{ method, path string }{
		{"GET", "/api/admin/approvals"},
		{"POST", "/api/admin/approvals/x/publish"},
		{"POST", "/api/admin/approvals/x/reject"},
	} {
		rec := httptest.NewRecorder()
		s.mux.ServeHTTP(rec, httptest.NewRequest(tc.method, tc.path, nil))
		if rec.Code != http.StatusUnauthorized && rec.Code != http.StatusForbidden {
			t.Errorf("%s %s: status %d", tc.method, tc.path, rec.Code)
		}
	}
	rec := httptest.NewRecorder()
	s.mux.ServeHTTP(rec, httptest.NewRequest("GET", "/admin/approvals", nil))
	if rec.Code != http.StatusSeeOther {
		t.Errorf("GET /admin/approvals without session: %d", rec.Code)
	}
	rec = httptest.NewRecorder()
	s.mux.ServeHTTP(rec, httptest.NewRequest("GET", "/ideas/submitted", nil))
	if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), `<div id="root">`) {
		t.Errorf("GET /ideas/submitted: %d", rec.Code)
	}
}

// AC-030-11: the CSV import publishes at once.
func TestAC030_11_ImportRowsAreNotPending(t *testing.T) {
	for _, r := range startRows(t) {
		if r.Status == importNew && r.doc.Status != statusPublished {
			t.Fatalf("line %d has status %q", r.Line, r.doc.Status)
		}
	}
}
