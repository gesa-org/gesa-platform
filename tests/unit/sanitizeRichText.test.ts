import { sanitizeRichTextHtml, stripAllHtml, validateLinkUrl } from "@/lib/ui-builder/sanitizeRichText";

// Phase 134 — the security-critical piece of the Visual Page Editor's
// rich-text feature: every richText field's saved/rendered value passes
// through sanitizeRichTextHtml, and every non-richText field's value
// (plainText/heading/ctaLabel) passes through stripAllHtml, before it can
// ever reach the public site. These tests are the "a few practical tests
// for ... unsafe links being rejected/sanitized" and "plain-text fields
// continuing to use the original input UI" items from the spec's own test
// list — focused on the sanitizer/validator, not a full editor
// integration test (no dev server/browser in this sandbox — see
// EXECUTION_PLAN.md Phase 134's QA note).
describe("sanitizeRichTextHtml", () => {
  it("keeps every tag the toolbar can actually produce", () => {
    const html =
      "<h2>Heading</h2><p>Some <strong>bold</strong> and <em>italic</em> and <u>underlined</u> and <s>struck</s> text.</p>" +
      '<ul><li>one</li><li>two</li></ul><ol><li>first</li></ol><blockquote>a quote</blockquote><hr/>' +
      '<a href="https://example.com" target="_blank">a link</a>';
    const clean = sanitizeRichTextHtml(html);
    expect(clean).toContain("<h2>Heading</h2>");
    expect(clean).toContain("<strong>bold</strong>");
    expect(clean).toContain("<em>italic</em>");
    expect(clean).toContain("<u>underlined</u>");
    expect(clean).toContain("<s>struck</s>");
    expect(clean).toContain("<ul>");
    expect(clean).toContain("<ol>");
    expect(clean).toContain("<blockquote>");
    expect(clean).toContain("<hr");
    expect(clean).toContain('href="https://example.com"');
  });

  it("strips script tags and their content entirely", () => {
    const clean = sanitizeRichTextHtml('<p>Hello</p><script>alert("xss")</script>');
    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("alert");
    expect(clean).toContain("<p>Hello</p>");
  });

  it("strips inline event handler attributes", () => {
    const clean = sanitizeRichTextHtml('<p onclick="alert(1)">Click me</p>');
    expect(clean).not.toContain("onclick");
    expect(clean).toContain("Click me");
  });

  it("rejects javascript: URLs on links", () => {
    const clean = sanitizeRichTextHtml('<a href="javascript:alert(1)">bad link</a>');
    expect(clean).not.toContain("javascript:");
    expect(clean).not.toContain("href=");
  });

  it("allows the four safe link protocols", () => {
    for (const href of ["https://example.com", "http://example.com", "mailto:hello@example.com", "tel:+15551234567"]) {
      const clean = sanitizeRichTextHtml(`<a href="${href}">link</a>`);
      expect(clean).toContain(`href="${href}"`);
    }
  });

  it("strips unapproved tags (iframe, style, div) while keeping their safe text", () => {
    const clean = sanitizeRichTextHtml('<div class="x"><iframe src="https://evil.example"></iframe>Some text</div>');
    expect(clean).not.toContain("<iframe");
    expect(clean).not.toContain("<div");
    expect(clean).toContain("Some text");
  });

  it("only allows text-align on the style attribute, not arbitrary CSS", () => {
    const clean = sanitizeRichTextHtml('<p style="text-align: center; background: url(evil.png)">Centered</p>');
    expect(clean).toContain("text-align:center") ;
    expect(clean).not.toContain("background");
    expect(clean).not.toContain("evil.png");
  });

  it("is idempotent — sanitizing already-clean HTML changes nothing meaningful", () => {
    const once = sanitizeRichTextHtml("<p>Plain paragraph.</p>");
    const twice = sanitizeRichTextHtml(once);
    expect(twice).toBe(once);
  });

  it("passes through legacy plain-text content with no data loss (migration-safe fallback)", () => {
    const legacy = "For anyone shaken by war, terror, or disaster.";
    expect(sanitizeRichTextHtml(legacy)).toBe(legacy);
  });
});

describe("stripAllHtml", () => {
  it("removes all markup from a plainText/heading/ctaLabel field, keeping only text", () => {
    expect(stripAllHtml('<b>Bold</b> label <script>alert(1)</script>')).toBe("Bold label ");
  });

  it("leaves an ordinary plain string completely untouched", () => {
    expect(stripAllHtml("Reach out now")).toBe("Reach out now");
  });
});

describe("validateLinkUrl", () => {
  it("accepts https/http/mailto/tel URLs", () => {
    expect(validateLinkUrl("https://example.com").ok).toBe(true);
    expect(validateLinkUrl("http://example.com").ok).toBe(true);
    expect(validateLinkUrl("mailto:hello@example.com").ok).toBe(true);
    expect(validateLinkUrl("tel:+15551234567").ok).toBe(true);
  });

  it("rejects javascript: URLs", () => {
    const result = validateLinkUrl("javascript:alert(1)");
    expect(result.ok).toBe(false);
  });

  it("rejects data: and other unsafe protocols", () => {
    expect(validateLinkUrl("data:text/html,<script>alert(1)</script>").ok).toBe(false);
    expect(validateLinkUrl("ftp://example.com").ok).toBe(false);
  });

  it("rejects empty or unparseable input", () => {
    expect(validateLinkUrl("").ok).toBe(false);
    expect(validateLinkUrl("not a url").ok).toBe(false);
  });
});
