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
