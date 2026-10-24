/**
 * EXPERIMENT ONLY: adapter for locally running resolver APIs.
 * This is deliberately not registered in FMHY's production source list.
 * A resolver must be separately deployed/tested on localhost; no new Render service.
 */
export type Candidate = { source: "VidCore" | "VidFast" | "RiveStream"; url: string; server?: string; quality: "unknown"; format: "hls" | "dash" | "unknown"; referer?: string };
export type Source = Candidate["source"];

const SOURCES: Source[] = ["VidCore", "VidFast", "RiveStream"];
const isMedia = (u: string) => /^https:\/\//.test(u) && (/\.m3u8(?:\?|$)/i.test(u) || /\.mpd(?:\?|$)/i.test(u));
export function parseResolverEvents(source: Source, payload: string): Candidate[] {
  const streams: Candidate[] = [];
  for (const line of payload.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let data: any;
    try { data = JSON.parse(line); } catch { continue; }
    const obj = data?.server && typeof data.server === "object" ? data.server : data;
    const url = obj?.url;
    if (typeof url !== "string" || !isMedia(url)) continue;
    streams.push({
      source,
      url,
      server: typeof obj.name === "string" ? obj.name : (typeof obj.server === "string" ? obj.server : undefined),
      quality: "unknown", // never infer 4K from mirror/server name
      format: /\.m3u8(?:\?|$)/i.test(url) ? "hls" : "dash",
      referer: source === "VidCore" ? "https://vidcore.io/" : source === "VidFast" ? "https://vidfast.pro/" : undefined,
    });
  }
  return [...new Map(streams.map(s => [s.url, s])).values()];
}
export function resolverPath(source: Source, movieTmdbId: string): string | null {
  if (!/^\d{1,12}$/.test(movieTmdbId)) return null;
  if (source === "RiveStream") return null; // No verified RiveStream API contract yet
  if (source === "VidCore") return "/api/resolve?type=movie&id=" + movieTmdbId + "&server=Orbit";
  return "/api/resolve?type=movie&id=" + movieTmdbId;
}
export function supportedSources(): readonly Source[] { return SOURCES; }
