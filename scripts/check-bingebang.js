"use strict";

// Read-only connectivity diagnostic. Does not scrape, bypass challenges, or expose stream URLs.
// Usage: node scripts/check-bingebang.js
const targets = [
  "https://bingebang.st/",
  "https://bingebang.st/explore"
];

async function check(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "Accept": "text/html,application/json;q=0.9,*/*;q=0.8" }
    });
    console.log(JSON.stringify({
      target: url,
      status: response.status,
      finalHost: new URL(response.url).hostname,
      contentType: response.headers.get("content-type"),
      cloudflareRayPresent: response.headers.has("cf-ray")
    }));
    await response.body?.cancel();
  } catch (error) {
    console.log(JSON.stringify({ target: url, error: error.name, detail: error.message }));
  } finally {
    clearTimeout(timer);
  }
}
(async () => { for (const target of targets) await check(target); })();
