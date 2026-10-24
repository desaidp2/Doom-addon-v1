# CineJoy experimental FMHY integration

Status: **prototype code only, not deployed or validated**.

The bridge wraps PandaFlix's actual Go CineJoy implementation (pinned WASM decoder, Lisbon/Nebula/Solara racing and HLS segment validation), without copying secret or signed-request internals into JavaScript. Its HTTP endpoint binds to localhost only.

## Isolated test (Go >= 1.26)

```bash
cd experiments/cinejoy-bridge
go mod init cinejoy-bridge
go get github.com/MADPANDA3D/pandaflix@latest
go run .
curl -G 'http://127.0.0.1:8788/resolve' --data-urlencode 'media_url=https://cinejoy.to/movie/TMDB_ID'
```

The exact supported CineJoy media URL structure must be verified against PandaFlix's `tmdbMediaFromURL` parser before testing; the URL above is illustrative, not a verified title path.

## Remaining before live FMHY

1. Verify the correct TMDB media ID input and resolver operation from Render Singapore.
2. Add an IMDb-to-TMDB mapping path using FMHY metadata.
3. Return HLS-specific stream hints/quality measured from the master playlist.
4. Add timeouts and a circuit breaker so a CineJoy outage never delays the seven working FMHY providers.
5. Test with a playable test title, then enable conditionally on the integrated server.
6. Do not deploy from this branch to any existing services until all checks pass.

Existing Render services are intentionally unchanged.
