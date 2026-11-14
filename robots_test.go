package app

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func guarded(t *testing.T) http.Handler {
	t.Helper()
	return botGuard(newRouteServer(t).mux)
}

func get(h http.Handler, path, ua string) *httptest.ResponseRecorder {
	req := httptest.NewRequest("GET", path, nil)
	if ua != "" {
		req.Header.Set("User-Agent", ua)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

const chrome = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

func TestAC032_1_RobotsTxtDisallowsAll(t *testing.T) {
	rec := get(guarded(t), "/robots.txt", chrome)
	if rec.Code != http.StatusOK || !strings.HasPrefix(rec.Header().Get("Content-Type"), "text/plain") {
		t.Fatalf("status %d, type %q", rec.Code, rec.Header().Get("Content-Type"))
	}
	if !strings.Contains(rec.Body.String(), "User-agent: *\nDisallow: /\n") {
		t.Errorf("body: %s", rec.Body)
	}
}

func TestAC032_2_RobotsTxtListsEveryBot(t *testing.T) {
	body := get(guarded(t), "/robots.txt", "").Body.String()
	required := []string{"GPTBot", "ChatGPT-User", "ClaudeBot", "anthropic-ai", "CCBot", "Google-Extended", "PerplexityBot", "Bytespider", "Amazonbot", "Applebot-Extended", "meta-externalagent"}
	for _, bot := range append(required, blockedBots...) {
		if !strings.Contains(body, "User-agent: "+bot+"\nDisallow: /\n") {
			t.Errorf("robots.txt misses %s", bot)
		}
	}
}

func TestAC032_3_NoIndexHeaderOnEveryResponse(t *testing.T) {
	h := guarded(t)
	for _, path := range []string{"/", "/login", "/api/me", "/app/assets/none.js", "/gibt-es-nicht", "/robots.txt"} {
		if got := get(h, path, chrome).Header().Get("X-Robots-Tag"); got != "noindex, nofollow" {
			t.Errorf("%s: X-Robots-Tag = %q", path, got)
		}
	}
	rec := get(h, "/", "GPTBot")
	if rec.Code != http.StatusForbidden || rec.Header().Get("X-Robots-Tag") != "noindex, nofollow" {
		t.Errorf("403 response: %d %q", rec.Code, rec.Header().Get("X-Robots-Tag"))
	}
}

func TestAC032_4_MetaRobotsInPages(t *testing.T) {
	h := guarded(t)
	const meta = `<meta name="robots" content="noindex, nofollow"`
	for _, path := range []string{"/", "/login", "/register", "/ideas", "/feedback-prompts", "/imprint", "/terms"} {
		if !strings.Contains(get(h, path, chrome).Body.String(), meta) {
			t.Errorf("%s has no meta robots (run npm run build?)", path)
		}
	}
	rec := httptest.NewRecorder()
	(&server{}).adminPage(rec, httptest.NewRequest("GET", "/admin/users", nil), sessionUser{Role: roleAdmin})
	if !strings.Contains(rec.Body.String(), meta) {
		t.Error("admin page has no meta robots")
	}
}

func TestAC032_5_BlockedBotsGet403(t *testing.T) {
	h := guarded(t)
	agents := []string{"Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)", "claudebot", "CCBOT", "Mozilla/5.0 PerplexityBot/1.0"}
	for _, ua := range agents {
		for _, path := range []string{"/", "/login", "/api/ideas", "/ideas"} {
			rec := get(h, path, ua)
			if rec.Code != http.StatusForbidden {
				t.Errorf("%q %s: status %d", ua, path, rec.Code)
			}
			if strings.Contains(rec.Body.String(), `<div id="root">`) || strings.HasPrefix(strings.TrimSpace(rec.Body.String()), "[") {
				t.Errorf("%q %s: content delivered", ua, path)
			}
		}
	}
}

func TestAC032_6_BotsMayReadRobotsTxt(t *testing.T) {
	rec := get(guarded(t), "/robots.txt", "GPTBot/1.0")
	if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), "Disallow: /") {
		t.Errorf("status %d body %q", rec.Code, rec.Body)
	}
}

func TestAC032_7_NormalClientsUnchanged(t *testing.T) {
	h := guarded(t)
	agents := []string{chrome, "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1", "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0", ""}
	for _, ua := range agents {
		for _, path := range []string{"/", "/login", "/register"} {
			rec := get(h, path, ua)
			if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), `<div id="root">`) {
				t.Errorf("%q %s: status %d", ua, path, rec.Code)
			}
		}
		if rec := get(h, "/admin/users", ua); rec.Code != http.StatusSeeOther {
			t.Errorf("%q /admin/users: status %d, want 303", ua, rec.Code)
		}
	}
	if isBlockedBot("") {
		t.Error("empty user agent blocked")
	}
	for _, bot := range blockedBots {
		if strings.TrimSpace(bot) == "" {
			t.Error("empty entry in blockedBots")
		}
	}
}
