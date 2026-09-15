// Phase 206 — best-effort bot/crawler exclusion for profile-view tracking.
// This is the first bot-detection logic anywhere in the codebase (confirmed
// via audit — no prior art to match), so this is deliberately simple: a
// substring check against common, well-known crawler/bot/HTTP-library user
// agents, not a full device-fingerprinting or CAPTCHA-style system, which
// would be disproportionate for "don't let search engine crawlers inflate a
// view counter." A missing or empty User-Agent header is also treated as
// bot-like, since a real browser always sends one.
const BOT_UA_SUBSTRINGS = [
  "bot",
  "spider",
  "crawler",
  "crawl",
  "slurp",
  "facebookexternalhit",
  "headlesschrome",
  "phantomjs",
  "curl/",
  "wget/",
  "python-requests",
  "python-urllib",
  "node-fetch",
  "axios/",
  "go-http-client",
  "libwww-perl",
  "scrapy",
  "postmanruntime",
];

export function isLikelyBot(userAgent: string | null): boolean {
  if (!userAgent || userAgent.trim().length === 0) return true;
  const ua = userAgent.toLowerCase();
  return BOT_UA_SUBSTRINGS.some((needle) => ua.includes(needle));
}
