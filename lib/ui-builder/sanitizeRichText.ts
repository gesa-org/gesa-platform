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
  // Phase 136 — the Font ribbon group's superscript/subscript toggles
  // (real <sup>/<sub> elements, matching Word's own output — see
  // components/admin/ui-builder/richTextFontExtensions.ts) and the plain
  // inline wrapper the rest of the Font group's character formatting
  // (family/size/color/highlight/caps) renders onto.
  "sup",
  "sub",
  "span",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "target", "rel"],
  p: ["style"],
  h1: ["style"],
  h2: ["style"],
  h3: ["style"],
  // Phase 136 — `span` only ever carries the Font group's own inline
  // character-formatting styles (see ALLOWED_STYLES below); it has no
  // other allowed attribute, so it can't be used to smuggle a class name,
  // id, or event handler.
  span: ["style"],
};

// Phase 136 — curated, not free-form. Every value here is restricted to
// either a fixed enum (text-align, text-transform, font-variant) or a
// narrow, safe-by-construction pattern (a plain 6-digit hex color; a plain
// pixel size in the Font group's own 12-36px range) — never an open-ended
// value that could carry a CSS injection (e.g. `url(...)`, `expression(...)`).
const ALLOWED_STYLES: sanitizeHtml.IOptions["allowedStyles"] = {
  "*": {
    "text-align": [/^left$/, /^center$/, /^right$/],
    // A plain 6-digit hex only — matches exactly what
    // lib/ui-builder/richTextFontOptions.ts's swatches and the Font
    // dialog's color inputs ever produce.
    color: [/^#[0-9a-fA-F]{6}$/],
    "background-color": [/^#[0-9a-fA-F]{6}$/],
    // Matches lib/ui-builder/richTextFontOptions.ts's RICH_TEXT_FONT_SIZE_OPTIONS
    // range (12-36px) with a little headroom either side.
    "font-size": [/^(1[0-9]|[2-3][0-9]|40)px$/],
    // Matches the exact curated font-family stacks in
    // lib/ui-builder/richTextFontOptions.ts (themselves the same stacks
    // Phase 132's Global Theme Typography panel already offers) — letters,
    // spaces, hyphens, commas, and quotes only, so a stack like
    // `"Nunito Sans", ui-sans-serif, system-ui, sans-serif` passes while
    // anything containing `(`, `;`, or `url` is rejected outright.
    "font-family": [/^[a-zA-Z0-9\s,"'-]+$/],
    "text-transform": [/^(uppercase|none)$/],
    "font-variant": [/^(small-caps|normal)$/],
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

// Phase 137 — for "inline" rich-text fields (see
// lib/ui-builder/pageRegistry.ts's getRichTextMode: headings, CTA/form
// labels, and short plainText badges/eyebrows). Same character-level marks
// as sanitizeRichTextHtml above — bold/italic/underline/strike/
// superscript/subscript, the shared span's font/color/highlight/caps
// styles, and links — but never a block wrapper. These fields render
// inside a tag the page template already supplies (an <h1>, a button's own
// label, a badge <span>), so keeping a <p>/<h1-3>/<ul>/<ol>/<li>/
// <blockquote>/<hr> here would produce invalid nested markup. Those tags
// simply aren't in ALLOWED_TAGS below, and sanitize-html's default
// disallowed-tag behavior is to drop the tag but keep its text/children
// (only `nonTextTags` — script/style/etc. — lose their content too) — so a
// pasted "<h2>Foo</h2><p>Bar</p>" becomes the inline text "FooBar", not
// missing content and not invalid markup either way.
const INLINE_ALLOWED_TAGS = ["strong", "em", "u", "s", "sup", "sub", "span", "a", "br"];

export function sanitizeInlineRichTextHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: INLINE_ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedStyles: ALLOWED_STYLES,
    allowedSchemes: ALLOWED_SCHEMES,
    transformTags: {
      a: (tagName, attribs) => {
        const rel = attribs.target === "_blank" ? "noopener noreferrer" : attribs.rel;
        return { tagName, attribs: { ...attribs, ...(rel ? { rel } : {}) } };
      },
    },
    nonTextTags: ["script", "style", "textarea", "noscript"],
  });
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
