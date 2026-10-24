# Three-provider experiment — NOT LIVE

Target: investigate adding VidCore, VidFast, and RiveStream to existing FMHY Matrix Integrated WITHOUT creating another Render service or breaking the seven working providers.

## What is implemented
- VidCore and VidFast NDJSON resolver event adapters, a candidate parser and TMDB movie-ID route builders.
- Reject non-HTTPS or non-HLS/DASH URLs, deduplicate, and never claim 4K from mirror name.
- RiveStream is intentionally disabled: Kunai documents an adapter, but a stable standalone HTTP resolver/API contract has not yet been verified.
- No production FMHY runtime modifications. No Render deployment.

## Verified documentation, not verified playback
- VidCore: https://github.com/sharoon7171/vidcore-io-stream-resolver
- VidFast: https://github.com/sharoon7171/vidfast-pro-stream-resolver
- RiveStream/Kunai: https://github.com/KitsuneKode/kunai

VidCore and VidFast resolver repositories are web-visible, but the connected GitHub source-fetch operation returned 404, so their current implementations were not downloaded or tested here. This adapter expects a separate LOCAL resolver process and cannot extract media on its own.

## Remaining gates before any live integration
1. Read actual resolver source and check licensing/dependencies/security.
2. Build and run the resolvers in an isolated test environment (ideally target hosting region).
3. Check actual HLS/DASH URLs, playback with correct headers, timeout and cache behavior.
4. Resolve IMDb-to-TMDB IDs reliably; handle episodes; validate 720/1080/2160p from manifests.
5. Implement safeguards around HLS relay: rate limits, allowlists, SSRF protection, and bandwidth limits.
6. Only then consider optional disabled-by-default registration into FMHY, with rollback.

Live FMHY Integrated must stay on `bingebang-test` until all gates pass.
