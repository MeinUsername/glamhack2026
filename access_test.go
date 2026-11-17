package app

import (
	"bytes"
	"log"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"
)

func accessFixture(t *testing.T) (*siteAccess, http.Handler, string, *time.Time) {
	t.Helper()
	password := randomHex(32)
	now := time.Unix(1800000000, 0)
	a := newSiteAccess(password, func() time.Time { return now })
	h := botGuard(a.guard(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "private, max-age=3600")
		_, _ = w.Write([]byte("protected"))
	})))
	return a, h, password, &now
}

func accessPost(h http.Handler, password, next, ip string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(http.MethodPost, "/access", strings.NewReader(url.Values{"password": {password}, "next": {next}}.Encode()))
	r.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	r.Header.Set("X-Forwarded-For", ip)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	return w
}

func TestAccessProtectsRoutes(t *testing.T) {
	_, h, _, _ := accessFixture(t)
	for _, path := range []string{"/", "/ideas?x=1&y=2", "/login", "/register", "/admin/users", "/imprint", "/terms"} {
		for _, method := range []string{http.MethodGet, http.MethodHead} {
			w := httptest.NewRecorder()
			h.ServeHTTP(w, httptest.NewRequest(method, path, nil))
			want := "/access?next=" + url.QueryEscape(path)
			if w.Code != 303 || w.Header().Get("Location") != want || strings.Contains(w.Body.String(), "protected") {
				t.Errorf("%s %s: %d %q", method, path, w.Code, w.Header().Get("Location"))
			}
			if w.Header().Get("Cache-Control") != "no-store" {
				t.Error("redirect may be cached")
			}
		}
	}
	for _, path := range []string{"/api", "/api/ideas", "/api/ideas/id/images/0", "/app", "/app/assets/x.js"} {
		w := get(h, path, "")
		if w.Code != 401 || w.Body.Len() != 0 || w.Header().Get("Cache-Control") != "no-store" {
			t.Errorf("%s: %d %q", path, w.Code, w.Body.String())
		}
	}
	for _, path := range []string{"/session", "/register", "/logout", "/api/ideas"} {
		w := httptest.NewRecorder()
		h.ServeHTTP(w, httptest.NewRequest(http.MethodPost, path, nil))
		if w.Code != 401 || w.Body.Len() != 0 {
			t.Errorf("POST %s: %d", path, w.Code)
		}
	}
}

func TestAccessCookieAndPasswordRotation(t *testing.T) {
	a, h, password, now := accessFixture(t)
	w := accessPost(h, password, "/ideas?x=1", "192.0.2.1")
	if w.Code != 303 || w.Header().Get("Location") != "/ideas?x=1" {
		t.Fatalf("login: %d %s", w.Code, w.Body.String())
	}
	cookies := w.Result().Cookies()
	if len(cookies) != 1 {
		t.Fatalf("cookies: %v", cookies)
	}
	cookie := cookies[0]
	if cookie.Name != "access" || !cookie.HttpOnly || !cookie.Secure || cookie.Path != "/" || cookie.SameSite != http.SameSiteLaxMode || cookie.MaxAge != 2592000 || !cookie.Expires.Equal(now.Add(accessLifetime)) {
		t.Fatalf("cookie: %+v", cookie)
	}
	if strings.Contains(cookie.Value, password) {
		t.Fatal("password leaked")
	}
	for _, path := range []string{"/ideas", "/api/ideas", "/app/assets/x.js", "/login"} {
		r := httptest.NewRequest("GET", path, nil)
		r.AddCookie(cookie)
		out := httptest.NewRecorder()
		h.ServeHTTP(out, r)
		if out.Body.String() != "protected" || out.Header().Get("Cache-Control") != "no-store" {
			t.Errorf("authorized %s: %d %s", path, out.Code, out.Body.String())
		}
	}
	r := httptest.NewRequest("GET", "/access?next=/ideas", nil)
	r.AddCookie(cookie)
	out := httptest.NewRecorder()
	h.ServeHTTP(out, r)
	if out.Code != 303 || out.Header().Get("Location") != "/ideas" {
		t.Error("authorized access page did not redirect")
	}
	for _, token := range []string{"", "invalid", "999999999999999999999.bad", cookie.Value + "00", a.signToken(now.Add(-time.Second)), a.signToken(*now)} {
		if a.verifyToken(token) {
			t.Errorf("accepted invalid token %q", token)
		}
	}
	rotated := newSiteAccess(randomHex(32), a.now)
	if rotated.verifyToken(cookie.Value) {
		t.Error("password rotation retained access")
	}
	*now = now.Add(accessLifetime)
	if a.verifyToken(cookie.Value) {
		t.Error("expired token accepted")
	}
}

func TestAccessFailuresAndLockout(t *testing.T) {
	_, h, password, now := accessFixture(t)
	wrong := randomHex(32)
	for i := 1; i <= accessMaxFailures; i++ {
		w := accessPost(h, wrong, "/", "192.0.2.1")
		want := 401
		if i == accessMaxFailures {
			want = 429
		}
		if w.Code != want || len(w.Result().Cookies()) != 0 || !strings.Contains(w.Body.String(), `role="alert"`) {
			t.Fatalf("attempt %d: %d %s", i, w.Code, w.Body.String())
		}
	}
	w := accessPost(h, password, "/", "192.0.2.1")
	if w.Code != 429 || w.Header().Get("Retry-After") != "900" {
		t.Fatalf("lockout: %d %s", w.Code, w.Header().Get("Retry-After"))
	}
	if w := accessPost(h, password, "/", "192.0.2.2"); w.Code != 303 {
		t.Error("other IP blocked")
	}
	*now = now.Add(accessLockout)
	if w := accessPost(h, password, "/", "192.0.2.1"); w.Code != 303 {
		t.Error("lockout did not expire")
	}
	// A successful attempt clears earlier failures.
	for i := 0; i < accessMaxFailures-1; i++ {
		accessPost(h, wrong, "/", "192.0.2.1")
	}
	accessPost(h, password, "/", "192.0.2.1")
	if w := accessPost(h, wrong, "/", "192.0.2.1"); w.Code != 401 {
		t.Error("success did not clear failures")
	}
}

func TestAccessNextValidation(t *testing.T) {
	for _, value := range []string{"", "//evil.example", "https://evil.example", "/\\evil", "/%5cevil", "/%2fevil", "/access", "/access?next=/access", "/access/", "/%61ccess", "/\r\nevil"} {
		if got := accessNext(value); got != "/" {
			t.Errorf("%q -> %q", value, got)
		}
	}
	_, h, password, _ := accessFixture(t)
	for _, value := range []string{"//evil.example", "/access", "/ideas?x=1&y=2"} {
		w := accessPost(h, password, value, "192.0.2.1")
		if w.Header().Get("Location") != accessNext(value) {
			t.Errorf("unsafe redirect: %q", w.Header().Get("Location"))
		}
	}
}

func TestAccessPageAndRobots(t *testing.T) {
	_, h, _, _ := accessFixture(t)
	for _, lang := range []string{"de-CH,de;q=0.9,en;q=0.8", "en-US,en;q=0.9,de;q=0.5"} {
		r := httptest.NewRequest("GET", "/access?next=%2Fideas%3Fx%3D%22%3E%3Cscript%3E", nil)
		r.Header.Set("Accept-Language", lang)
		w := httptest.NewRecorder()
		h.ServeHTTP(w, r)
		label := "Password"
		if strings.HasPrefix(lang, "de") {
			label = "Passwort"
		}
		if w.Code != 200 || !strings.Contains(w.Body.String(), label) || strings.Contains(w.Body.String(), "<script>") || !strings.Contains(w.Body.String(), `<meta name="robots"`) || w.Header().Get("X-Robots-Tag") != robotsTag {
			t.Errorf("page: %d %s", w.Code, w.Body.String())
		}
	}
	w := get(h, "/robots.txt", "GPTBot")
	if w.Code != 200 || !strings.Contains(w.Body.String(), "Disallow: /") {
		t.Error("robots protected")
	}
	if w := get(h, "/access", "GPTBot"); w.Code != 403 {
		t.Error("bot guard bypassed")
	}
	r := httptest.NewRequest("HEAD", "/access", nil)
	w = httptest.NewRecorder()
	h.ServeHTTP(w, r)
	if w.Code != 200 || w.Body.Len() != 0 {
		t.Error("HEAD body")
	}
	r = httptest.NewRequest("DELETE", "/access", nil)
	w = httptest.NewRecorder()
	h.ServeHTTP(w, r)
	if w.Code != 405 {
		t.Error("unsupported method")
	}
	w = accessPost(h, strings.Repeat("x", 5000), "/", "192.0.2.1")
	if w.Code != 400 || len(w.Result().Cookies()) != 0 {
		t.Error("oversized body accepted")
	}
}

func TestAccessDisabledAndConfiguration(t *testing.T) {
	var output bytes.Buffer
	previous := log.Writer()
	log.SetOutput(&output)
	defer log.SetOutput(previous)
	t.Setenv("SITE_PASSWORD", "")
	h := accessGuard(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(204) }))
	for _, path := range []string{"/ideas", "/login", "/api/ideas", "/app/assets/x.js"} {
		if w := get(h, path, ""); w.Code != 204 {
			t.Errorf("disabled: %s %d", path, w.Code)
		}
	}
	if strings.Count(output.String(), "WARNING: SITE_PASSWORD") != 1 {
		t.Fatalf("warning: %s", output.String())
	}
	if w := get(h, "/access?next=/ideas", ""); w.Code != 303 || w.Header().Get("Location") != "/ideas" {
		t.Error("disabled access redirect")
	}
	t.Setenv("SITE_PASSWORD", randomHex(32))
	protected := accessGuard(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { t.Error("reached downstream") }))
	if get(protected, "/access", "").Code != 200 || get(protected, "/api/ideas", "").Code != 401 {
		t.Error("environment configuration ignored")
	}
}

func TestAccessLimitBoundedAndConcurrent(t *testing.T) {
	a, h, _, now := accessFixture(t)
	wrong := randomHex(32)
	var wg sync.WaitGroup
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() { defer wg.Done(); accessPost(h, wrong, "/", "192.0.2.1") }()
	}
	wg.Wait()
	if a.attempts["192.0.2.1"].failures != accessMaxFailures {
		t.Fatal("concurrent limit bypassed")
	}
	for i := 0; i < accessMaxClients-1; i++ {
		a.attempts[strconv.Itoa(i)] = accessAttempt{1, now.Add(accessLockout)}
	}
	size := len(a.attempts)
	if _, retry := a.checkPassword("new", wrong); retry == 0 || len(a.attempts) != size {
		t.Error("map bound exceeded")
	}
	*now = now.Add(accessLockout)
	a.checkPassword("new", wrong)
	if len(a.attempts) != 1 {
		t.Error("expired entries not cleaned")
	}
}

func TestAccessClientIP(t *testing.T) {
	r := httptest.NewRequest("GET", "/access", nil)
	r.RemoteAddr = "192.0.2.1:1234"
	if accessClientIP(r) != "192.0.2.1" {
		t.Error("RemoteAddr fallback")
	}
	r.Header.Set("X-Forwarded-For", "2001:db8::1, 192.0.2.2")
	if accessClientIP(r) != "2001:db8::1" {
		t.Error("forwarded client IP")
	}
}

// Exercise redirects and secure cookie handling with a real HTTPS client/server.
func TestAccessHTTPSFlow(t *testing.T) {
	a, h, password, _ := accessFixture(t)
	a.now = time.Now
	srv := httptest.NewTLSServer(h)
	defer srv.Close()
	client := srv.Client()
	client.Jar, _ = cookiejar.New(nil)
	response, err := client.Get(srv.URL + "/login?from=ideas")
	if err != nil {
		t.Fatal(err)
	}
	response.Body.Close()
	if response.Request.URL.Path != "/access" || response.StatusCode != 200 {
		t.Fatal("missing access redirect")
	}
	response, err = client.PostForm(srv.URL+"/access", url.Values{"password": {password}, "next": {"/login?from=ideas"}})
	if err != nil {
		t.Fatal(err)
	}
	response.Body.Close()
	if response.Request.URL.Path != "/login" || response.StatusCode != 200 {
		t.Fatal("cookie did not grant access")
	}
	for _, path := range []string{"/ideas", "/api/ideas", "/api/ideas/id/images/0", "/app/assets/x.js"} {
		response, err = client.Get(srv.URL + path)
		if err != nil {
			t.Fatal(err)
		}
		response.Body.Close()
		if response.StatusCode != 200 {
			t.Errorf("authorized %s: %d", path, response.StatusCode)
		}
	}
}
