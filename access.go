package app

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"html/template"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"golang.org/x/text/language"
)

const (
	accessLifetime    = 30 * 24 * time.Hour
	accessLockout     = 15 * time.Minute
	accessMaxFailures = 5
	accessMaxClients  = 10000
)

type accessAttempt struct {
	failures int
	until    time.Time
}

type siteAccess struct {
	enabled      bool
	passwordHash [32]byte
	key          [32]byte
	now          func() time.Time
	mu           sync.Mutex
	attempts     map[string]accessAttempt
}

func newSiteAccess(password string, now func() time.Time) *siteAccess {
	if password == "" {
		log.Print("WARNING: SITE_PASSWORD is not configured; site access protection is disabled")
	}
	return &siteAccess{
		enabled: password != "", passwordHash: sha256.Sum256([]byte(password)),
		key: sha256.Sum256([]byte("glamhack2026/site-access/v1\x00" + password)),
		now: now, attempts: make(map[string]accessAttempt),
	}
}

// Read configuration once, before the first request, without initializing Firebase.
func accessGuard(next http.Handler) http.Handler {
	var once sync.Once
	var access *siteAccess
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		once.Do(func() { access = newSiteAccess(os.Getenv("SITE_PASSWORD"), time.Now) })
		access.guard(next).ServeHTTP(w, r)
	})
}

func (a *siteAccess) signToken(expiry time.Time) string {
	value := strconv.FormatInt(expiry.Unix(), 10)
	mac := hmac.New(sha256.New, a.key[:])
	_, _ = mac.Write([]byte(value))
	return value + "." + hex.EncodeToString(mac.Sum(nil))
}

func (a *siteAccess) verifyToken(value string) bool {
	timestamp, signature, ok := strings.Cut(value, ".")
	if !ok {
		return false
	}
	expiry, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil || expiry <= a.now().Unix() {
		return false
	}
	sig, err := hex.DecodeString(signature)
	if err != nil {
		return false
	}
	mac := hmac.New(sha256.New, a.key[:])
	_, _ = mac.Write([]byte(timestamp))
	return hmac.Equal(sig, mac.Sum(nil))
}

func (a *siteAccess) authorized(r *http.Request) bool {
	cookie, err := r.Cookie("access")
	return err == nil && a.verifyToken(cookie.Value)
}

func (a *siteAccess) guard(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/access" {
			a.serveAccess(w, r)
			return
		}
		if !a.enabled {
			next.ServeHTTP(w, r)
			return
		}
		// Even authorized responses must not enter a shared cache and bypass the guard.
		w = accessNoStoreWriter{w}
		w.Header().Set("Cache-Control", "no-store")
		if a.authorized(r) {
			next.ServeHTTP(w, r)
			return
		}
		path := r.URL.Path
		if (r.Method == http.MethodGet || r.Method == http.MethodHead) &&
			path != "/api" && !strings.HasPrefix(path, "/api/") &&
			path != "/app" && !strings.HasPrefix(path, "/app/") {
			http.Redirect(w, r, "/access?next="+url.QueryEscape(r.URL.RequestURI()), http.StatusSeeOther)
			return
		}
		w.WriteHeader(http.StatusUnauthorized)
	})
}

// The image and SPA handlers set their own cache headers. Override them at commit time.
type accessNoStoreWriter struct{ http.ResponseWriter }

func (w accessNoStoreWriter) WriteHeader(status int) {
	w.Header().Set("Cache-Control", "no-store")
	w.ResponseWriter.WriteHeader(status)
}

func (w accessNoStoreWriter) Write(body []byte) (int, error) {
	w.Header().Set("Cache-Control", "no-store")
	return w.ResponseWriter.Write(body)
}

func (w accessNoStoreWriter) Unwrap() http.ResponseWriter { return w.ResponseWriter }

func accessNext(value string) string {
	u, err := url.Parse(value)
	if err != nil || !strings.HasPrefix(value, "/") || strings.HasPrefix(value, "//") ||
		strings.ContainsAny(value, "\\\r\n") || u.IsAbs() || u.Host != "" ||
		strings.HasPrefix(u.Path, "//") || strings.ContainsAny(u.Path, "\\\r\n") ||
		u.Path == "/access" || strings.HasPrefix(u.Path, "/access/") {
		return "/"
	}
	return u.String()
}

func accessClientIP(r *http.Request) string {
	if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
		first, _, _ := strings.Cut(forwarded, ",")
		if ip := net.ParseIP(strings.TrimSpace(first)); ip != nil {
			return ip.String()
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		return host
	}
	return r.RemoteAddr
}

// Check and update under one lock so concurrent requests cannot bypass the limit.
// Failed attempts expire after 15 minutes; a full map refuses new clients until space expires.
func (a *siteAccess) checkPassword(ip, password string) (bool, time.Duration) {
	a.mu.Lock()
	defer a.mu.Unlock()
	now := a.now()
	for key, entry := range a.attempts {
		if !now.Before(entry.until) {
			delete(a.attempts, key)
		}
	}
	entry, exists := a.attempts[ip]
	if entry.failures >= accessMaxFailures {
		return false, entry.until.Sub(now)
	}
	if !exists && len(a.attempts) >= accessMaxClients {
		return false, accessLockout
	}
	hash := sha256.Sum256([]byte(password))
	if subtle.ConstantTimeCompare(hash[:], a.passwordHash[:]) == 1 {
		delete(a.attempts, ip)
		return true, 0
	}
	entry.failures++
	entry.until = now.Add(accessLockout)
	a.attempts[ip] = entry
	if entry.failures >= accessMaxFailures {
		return false, accessLockout
	}
	return false, 0
}

func (a *siteAccess) serveAccess(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("X-Robots-Tag", robotsTag)
	w.Header().Set("Vary", "Accept-Language")
	if r.Method != http.MethodGet && r.Method != http.MethodHead && r.Method != http.MethodPost {
		w.Header().Set("Allow", "GET, HEAD, POST")
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	next := accessNext(r.URL.Query().Get("next"))
	if r.Method == http.MethodPost {
		r.Body = http.MaxBytesReader(w, r.Body, 4096)
		if err := r.ParseForm(); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		next = accessNext(r.PostForm.Get("next"))
	}
	if !a.enabled || a.authorized(r) {
		http.Redirect(w, r, next, http.StatusSeeOther)
		return
	}
	data := accessPageData{Lang: "en", Title: "Site access", Intro: "Enter the shared site password to continue.", Label: "Password", Button: "Continue", Next: next}
	matcher := language.NewMatcher([]language.Tag{language.English, language.German})
	_, index := language.MatchStrings(matcher, r.Header.Get("Accept-Language"))
	if index == 1 {
		data.Lang, data.Title, data.Intro, data.Label, data.Button = "de", "Zugang zur Website", "Gib das gemeinsame Seitenpasswort ein, um fortzufahren.", "Passwort", "Weiter"
	}
	status := http.StatusOK
	if r.Method == http.MethodPost {
		correct, retry := a.checkPassword(accessClientIP(r), r.PostForm.Get("password"))
		if correct {
			expiry := a.now().Add(accessLifetime)
			http.SetCookie(w, &http.Cookie{Name: "access", Value: a.signToken(expiry), Path: "/", HttpOnly: true, Secure: true, SameSite: http.SameSiteLaxMode, MaxAge: int(accessLifetime.Seconds()), Expires: expiry})
			http.Redirect(w, r, next, http.StatusSeeOther)
			return
		}
		status, data.Error = http.StatusUnauthorized, "Incorrect password. Please try again."
		if data.Lang == "de" {
			data.Error = "Das Passwort ist falsch. Bitte versuche es erneut."
		}
		if retry > 0 {
			status = http.StatusTooManyRequests
			w.Header().Set("Retry-After", strconv.Itoa(int((retry+time.Second-1)/time.Second)))
			data.Error = "Too many attempts. Please try again later."
			if data.Lang == "de" {
				data.Error = "Zu viele Versuche. Bitte versuche es später erneut."
			}
		}
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(status)
	if r.Method != http.MethodHead {
		_ = accessPage.Execute(w, data)
	}
}

type accessPageData struct{ Lang, Title, Intro, Label, Button, Next, Error string }

var accessPage = template.Must(template.New("access").Parse(`<!doctype html>
<html lang="{{.Lang}}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>{{.Title}}</title>
<style>body{font:1rem/1.5 system-ui,sans-serif;background:#f5f5f4;color:#1c1917;margin:0;min-height:100vh;display:grid;place-items:center}main{box-sizing:border-box;width:min(28rem,calc(100% - 2rem));background:white;border:1px solid #d6d3d1;border-radius:1rem;padding:2rem}h1{font-size:1.6rem;margin-top:0}label{display:block;font-weight:600}input,button{box-sizing:border-box;width:100%;font:inherit;border-radius:.4rem;padding:.7rem;margin-top:.5rem}input{border:1px solid #78716c}button{background:#292524;color:white;border:0;cursor:pointer;margin-top:1rem}:focus-visible{outline:3px solid #2563eb;outline-offset:3px}[role=alert]{color:#991b1b}</style></head>
<body><main><h1>{{.Title}}</h1><p>{{.Intro}}</p>{{if .Error}}<p role="alert">{{.Error}}</p>{{end}}<form method="post" action="/access"><input type="hidden" name="next" value="{{.Next}}"><label for="password">{{.Label}}</label><input id="password" name="password" type="password" autocomplete="current-password" required autofocus><button type="submit">{{.Button}}</button></form></main></body></html>`))
