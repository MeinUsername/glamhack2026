// Package app is the Cloud Run functions entry point. A single Go HTTP
// handler serves the React pages, the static React app and the JSON API.
package app

import (
	"crypto/rand"
	"encoding/hex"
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

// userError is an error whose message is shown to the user.
type userError string

func (e userError) Error() string { return string(e) }

// randomHex returns nbytes of random data as hex text.
func randomHex(nbytes int) string {
	b := make([]byte, nbytes)
	if _, err := rand.Read(b); err != nil {
		panic(err) // crypto/rand failing means the platform is broken
	}
	return hex.EncodeToString(b)
}
