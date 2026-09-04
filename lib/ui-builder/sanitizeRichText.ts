import sanitizeHtml from "sanitize-html";

// Phase 134 — the one allowlist every piece of rich text passes through,
// both when an admin saves it (draft PUT + publish POST) and again at
// render time on the public site (defense in depth — see EditableText's
// html-mode branch). Deliberately narrow: exactly the tags/attributes the
// spec's toolbar can produce, nothing else. Anything not listed here is
// stripped, not escaped-and-shown — scripts, iframes, event handlers,
// inline styles, and any other tag disappear from the saved/rendered
// output entirely rather than rendering as inert text.
const ALLOWED_TAGS = [
  "p",
  "h1",
  "h2",
  "h3",
  "strong",
  "em",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
  "hr",
  "br",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "target", "rel"],
  p: ["style"],
  h1: ["style"],
  h2: ["style"],
  h3: ["style"],
};

// Only these three are ever written by the toolbar's alignment buttons
// (text-align: left/center/right) — `style` isn't a free-for-all attribute,
// sanitize-html's `allowedStyles` below still constrains its value.
const ALLOWED_STYLES: sanitizeHtml.IOptions["allowedStyles"] = {
  "*": {
    "text-align": [/^left$/, /^center$/, /^right$/],
  },
};

// Spec: "Allow safe protocols only: https:, http:, mailto:, and tel:.
// Reject javascript: URLs and unsafe protocols." sanitize-html's own
// `allowedSchemes` enforces this at the tag-attribute level (a link whose
// href fails this list gets its href stripped entirely, not rendered as a
// dead/unsafe link).
const ALLOWED_SCHEMES = ["https", "http", "mailto", "tel"];

/** Sanitizes a rich-text field's HTML before it is ever persisted
 * (draft or published) or rendered on the public site. Safe to call
 * repeatedly/idempotently — sanitizing already-sanitized HTML is a no-op. */
export function sanitizeRichTextHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedStyles: ALLOWED_STYLES,
    allowedSchemes: ALLOWED_SCHEMES,
    // rel="noopener noreferrer" is enforced server-side too (not just left
    // to the editor UI) so a hand-crafted draft payload can't skip it.
    transformTags: {
      a: (tagName, attribs) => {
        const rel = attribs.target === "_blank" ? "noopener noreferrer" : attribs.rel;
        return { tagName, attribs: { ...attribs, ...(rel ? { rel } : {}) } };
      },
    },
    // No text content is ever dropped for a disallowed tag — e.g. a
    // stripped <script> still shouldn't leak its text into the page, so
    // disallowed tags are fully removed (default sanitize-html behavior:
    // `nonTextTags` controls which tags' *content* is discarded — scripts/
    // styles never keep their inner text even if the tag itself is cut).
    nonTextTags: ["script", "style", "textarea", "noscript"],
  });
}

/** For plainText/heading/ctaLabel fields — these must never contain HTML at
 * all (per the original field type, and to keep a badge/CTA-label/heading
 * from being used to smuggle markup). Strips every tag, keeping only text. */
export function stripAllHtml(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
}

const SAFE_URL_SCHEMES = new Set(["https:", "http:", "mailto:", "tel:"]);

/** Validates a URL a link-editing UI is about to save. Returns null (safe)
 * or a human-readable reason it was rejected — used by both the admin
 * LinkEditorPopover (client-side, fast feedback) and, ideally, any future
 * server-side re-check of link hrefs beyond sanitizeRichTextHtml's own
 * scheme allowlist. */
export function validateLinkUrl(raw: string): { ok: true; url: string } | { ok: false; reason: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "Enter a URL." };

  // mailto:/tel: aren't parsed as having a "host" the way URL() expects for
  // http(s), but URL() still parses their scheme correctly, which is all
  // this check needs.
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, reason: "Enter a valid URL (e.g. https://example.com)." };
  }

  if (!SAFE_URL_SCHEMES.has(parsed.protocol)) {
    return { ok: false, reason: "Only https, http, mailto, and tel links are allowed." };
  }

  return { ok: true, url: parsed.toString() };
}
