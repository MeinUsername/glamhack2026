// Package app is the Cloud Run functions entry point. A single Go HTTP
// handler serves the React pages, the static React app and the JSON API.
package app

import (
	"net/http"
	"sync"

	"github.com/GoogleCloudPlatform/functions-framework-go/functions"
)

func init() {
	functions.HTTP("Handler", handler)
}

var (
	initOnce sync.Once
	srv      *server
	initErr  error
)

// handler is the Cloud Run functions entry point. Clients are created lazily
// on the first request, so that a warm instance reuses them.
func handler(w http.ResponseWriter, r *http.Request) {
	initOnce.Do(func() {
		srv, initErr = newServer(r.Context())
	})
	if initErr != nil {
		http.Error(w, "service unavailable", http.StatusInternalServerError)
		return
	}
	srv.mux.ServeHTTP(w, r)
}
