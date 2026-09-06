// Renders a heading with one substring styled differently — the "Highlighted
// Title Text" field from the Content Manager spec. Splits on the first
// case-sensitive match of `highlight` within `text`; if it's empty or isn't
// actually found in the text (e.g. an admin edited the title but left a
// stale highlight value), the whole heading just renders as plain text
// instead of silently dropping words or throwing.
export default function HighlightedText({
  text,
  highlight,
  className = "text-accent",
}: {
  text: string;
  highlight?: string;
  className?: string;
}) {
  if (!highlight) return <>{text}</>;
  const index = text.indexOf(highlight);
  if (index === -1) return <>{text}</>;
  const before = text.slice(0, index);
  const after = text.slice(index + highlight.length);
  return (
    <>
      {before}
      <span className={className}>{highlight}</span>
      {after}
    </>
  );
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Root-cause fix for "the About Hero heading isn't consistently
// clickable/selectable" — this component's default export above needs a
// plain `text: string` (it does `text.indexOf`/`text.slice` on it), so it
// was never something an `<EditableText>` could wrap: `EditableText` needs
// an HTML *string* value, not a `<HighlightedText>` React element. That gap
// meant `about.hero.heading` rendered with no `data-gesa-content-id`
// attribute and no click/hover handlers at all — a real, separate root
// cause from the click-suppression bug fixed in EditorPreviewBridge.tsx,
// not the same issue.
//
// This builds the *same* highlighted markup as the component above, but as
// a plain HTML string, so a caller can feed it straight into
// `<EditableText html value={...} as="h1">` and get a real, clickable,
// selectable, canvas-highlightable DOM element while still visually
// highlighting the configured substring exactly as before. Only splits
// when `text` is genuinely plain (no HTML tags) — if the field has already
// been given real rich-text formatting through the editor (this field's
// type is "heading", which does get the inline rich-text toolbar), `text`
// may itself already contain sanitized markup, and blindly running
// `indexOf`/`slice` on it could split mid-tag and corrupt that formatting.
// In that case this just returns `text` unchanged, un-highlighted — a
// worse-case no-op, never a corruption, and the admin can just select the
// word themselves and apply the accent color via the toolbar's own color
// picker instead.
export function buildHighlightedHtml(text: string, highlight: string | undefined, className = "text-accent"): string {
  // Already-tagged input means real sanitized rich-text markup (this
  // field's inline toolbar) — pass it through as-is rather than escaping
  // it into visible `&lt;strong&gt;` text, and skip the highlight split
  // entirely (see the function comment above for why).
  const hasMarkup = /<[a-z][\s\S]*>/i.test(text);
  if (hasMarkup) return text;
  if (!highlight) return escapeHtml(text);
  const index = text.indexOf(highlight);
  if (index === -1) return escapeHtml(text);
  const before = text.slice(0, index);
  const after = text.slice(index + highlight.length);
  return `${escapeHtml(before)}<span class="${className}">${escapeHtml(highlight)}</span>${escapeHtml(after)}`;
}
