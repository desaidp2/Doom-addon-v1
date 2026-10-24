// Isolated CineJoy bridge experiment; not connected to production FMHY.
package main

import (
 "context"
 "encoding/json"
 "log"
 "net/http"
 "os"
 "regexp"
 "time"
 "github.com/MADPANDA3D/pandaflix/core/providers"
)

type response struct {
 URL string `json:"url,omitempty"`
 Error string `json:"error,omitempty"`
}

func main() {
 client := &http.Client{Timeout: 20*time.Second}
 cinejoy := providers.NewCinejoy(client)
 tmdbPattern := regexp.MustCompile("^[0-9]{1,12}" + "$" )
 mux := http.NewServeMux()
 mux.HandleFunc("/resolve", func(w http.ResponseWriter, r *http.Request) {
  w.Header().Set("Content-Type", "application/json")
  if r.Method != http.MethodGet {
   w.WriteHeader(http.StatusMethodNotAllowed)
   _ = json.NewEncoder(w).Encode(response{Error:"GET required"})
   return
  }
  tmdb := r.URL.Query().Get("tmdb")
  if !tmdbPattern.MatchString(tmdb) {
   w.WriteHeader(http.StatusBadRequest)
   _ = json.NewEncoder(w).Encode(response{Error:"valid numeric TMDB ID required"})
   return
  }
  ctx, cancel := context.WithTimeout(r.Context(), 60*time.Second)
  defer cancel()
  link, err := cinejoy.GetLinkContext(ctx, "movie|"+tmdb+"||")
  if err != nil {
   log.Printf("CineJoy resolution failed: %v", err)
   w.WriteHeader(http.StatusBadGateway)
   _ = json.NewEncoder(w).Encode(response{Error:"CineJoy extraction failed"})
   return
  }
  _ = json.NewEncoder(w).Encode(response{URL:link})
 })
 port := os.Getenv("CINEJOY_BRIDGE_PORT")
 if port == "" {port = "8788"}
 log.Fatal(http.ListenAndServe("127.0.0.1:"+port,mux))
}
