// Experimental CineJoy resolver bridge; isolated from the production FMHY addon.
// Requires Go 1.26 and the upstream PandaFlix provider package.
package main

import (
  "context"
  "encoding/json"
  "log"
  "net/http"
  "os"
  "time"

  "github.com/MADPANDA3D/pandaflix/core/providers"
)

type response struct {
  URL string `json:"url,omitempty"`
  Error string `json:"error,omitempty"`
}

func main() {
  client := &http.Client{Timeout: 20 * time.Second}
  cinejoy := providers.NewCinejoy(client)
  mux := http.NewServeMux()
  // Only listen on loopback: no public proxy for arbitrary stream requests.
  mux.HandleFunc("/resolve", func(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    if r.Method != http.MethodGet {
      w.WriteHeader(http.StatusMethodNotAllowed)
      _ = json.NewEncoder(w).Encode(response{Error:"GET required"})
      return
    }
    mediaURL := r.URL.Query().Get("media_url")
    if mediaURL == "" {
      w.WriteHeader(http.StatusBadRequest)
      _ = json.NewEncoder(w).Encode(response{Error:"media_url required"})
      return
    }
    mediaID, err := cinejoy.GetMediaID(mediaURL)
    if err == nil {
      ctx, cancel := context.WithTimeout(r.Context(), 60*time.Second)
      defer cancel()
      var link string
      link, err = cinejoy.GetLinkContext(ctx, mediaID)
      if err == nil {
        _ = json.NewEncoder(w).Encode(response{URL:link})
        return
      }
    }
    w.WriteHeader(http.StatusBadGateway)
    log.Printf("cinejoy resolution failed: %v", err)
    _ = json.NewEncoder(w).Encode(response{Error:"CineJoy extraction failed"})
  })
  port := os.Getenv("CINEJOY_BRIDGE_PORT")
  if port == "" { port = "8788" }
  log.Printf("CineJoy test bridge listening on 127.0.0.1:%s",port)
  log.Fatal(http.ListenAndServe("127.0.0.1:"+port,mux))
}
