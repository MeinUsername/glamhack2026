package app

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

// AC-033-3: a removed idea is invisible for everybody, also for admins on the public paths; others by status.
func TestAC033_3_DeletedIdeaIsNeverVisible(t *testing.T) {
	now := time.Now()
	active := ideaDoc{Status: statusPublished}
	removed := ideaDoc{Status: statusPublished, DeletedAt: &now}
	pending := ideaDoc{Status: statusPending}
	if isDeleted(active) || !isDeleted(removed) {
		t.Fatal("isDeleted wrong")
	}
	for _, admin := range []bool{false, true} {
		if !visibleTo(active, admin) {
			t.Errorf("published idea invisible (admin=%v)", admin)
		}
		if visibleTo(removed, admin) {
			t.Errorf("removed idea visible (admin=%v)", admin)
		}
	}
	if visibleTo(pending, false) || !visibleTo(pending, true) {
		t.Error("pending: only admins may see it")
	}
	if !visibleTo(ideaDoc{}, false) {
		t.Error("an idea without status counts as published")
	}
}

// AC-033-1: removing, the trash and restoring are only for signed-in admins (401 without a session).
func TestAC033_1_TrashRoutesNeedAdmin(t *testing.T) {
	s := &server{mux: http.NewServeMux()}
	s.routes()
	for _, c := range []struct{ method, path string }{
		{"DELETE", "/api/ideas/x"},
		{"GET", "/api/admin/trash"},
		{"POST", "/api/admin/trash/x/restore"},
		{"GET", "/admin/trash"},
	} {
		rec := httptest.NewRecorder()
		s.mux.ServeHTTP(rec, httptest.NewRequest(c.method, c.path, nil))
		if rec.Code != http.StatusUnauthorized && rec.Code != http.StatusFound && rec.Code != http.StatusSeeOther {
			t.Errorf("%s %s: status %d, want 401 or a redirect", c.method, c.path, rec.Code)
		}
	}
}
