package app

import (
	"net/http"
	"strings"
)

// F-032: keep the app out of search engines and away from known crawlers and AI bots.
// The list is the single source for robots.txt and for the 403 check; add new bots here only.
// The User-Agent can be faked, so this stops honest crawlers only and is no security feature.
var blockedBots = []string{
	"GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-Web", "anthropic-ai", "CCBot",
	"Google-Extended", "PerplexityBot", "Bytespider", "Amazonbot", "Applebot-Extended",
	"meta-externalagent", "FacebookBot", "cohere-ai", "Diffbot", "ImagesiftBot", "Omgilibot",
}

const robotsTag = "noindex, nofollow"

// robotsTxt disallows everything for all agents, and once more for each known bot.
func robotsTxt() string {
	var b strings.Builder
	b.WriteString("User-agent: *\nDisallow: /\n")
	for _, bot := range blockedBots {
		b.WriteString("\nUser-agent: " + bot + "\nDisallow: /\n")
	}
	return b.String()
}

var robotsBody = robotsTxt()

// isBlockedBot matches the User-Agent against the list, ignoring case. An empty agent never matches.
func isBlockedBot(userAgent string) bool {
	ua := strings.ToLower(userAgent)
	if ua == "" {
		return false
	}
	for _, bot := range blockedBots {
		if strings.Contains(ua, strings.ToLower(bot)) {
			return true
		}
	}
	return false
}

// botGuard sets X-Robots-Tag on every response, serves /robots.txt to everybody (crawlers must be able
// to read the ban) and answers blocked bots with 403 on every other route.
func botGuard(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Robots-Tag", robotsTag)
		if r.URL.Path == "/robots.txt" && (r.Method == http.MethodGet || r.Method == http.MethodHead) {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			if r.Method == http.MethodGet {
				_, _ = w.Write([]byte(robotsBody))
			}
			return
		}
		if isBlockedBot(r.UserAgent()) {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}
