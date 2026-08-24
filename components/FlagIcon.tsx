import type { ComponentType } from "react";

// Phase 53 — real, inline SVG flags instead of Unicode flag emoji (🇺🇸/🇮🇱).
// Roy flagged that the language picker's flags weren't reading clearly —
// on Windows (which is where he's testing this), flag emoji are a known
// case where the OS itself doesn't ship the actual flag glyph and instead
// renders the two-letter region code as plain text ("US"/"IL") rather than
// a flag image, regardless of what the browser or this app does. Drawing
// the flags as SVG sidesteps that entirely: they render identically
// everywhere, at any size, with no font/OS dependency.
export function FlagUS({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
      <rect width="24" height="16" rx="2" fill="#fff" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x="0" y={i * (16 / 13) * 2} width="24" height={16 / 13} fill="#B22234" />
      ))}
      <rect x="0" y="0" width="10.4" height="8.6" fill="#3C3B6E" />
      {Array.from({ length: 12 }).map((_, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        return <circle key={i} cx={1.8 + col * 2.4} cy={1.7 + row * 2.7} r="0.42" fill="#fff" />;
      })}
      <rect width="24" height="16" rx="2" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
    </svg>
  );
}

export function FlagIL({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
      <rect width="24" height="16" rx="2" fill="#fff" />
      <rect x="0" y="2.1" width="24" height="1.7" fill="#0038b8" />
      <rect x="0" y="12.2" width="24" height="1.7" fill="#0038b8" />
      <polygon points="12,5.3 14.5,9.6 9.5,9.6" fill="none" stroke="#0038b8" strokeWidth="0.7" />
      <polygon points="12,11.5 9.5,7.2 14.5,7.2" fill="none" stroke="#0038b8" strokeWidth="0.7" />
      <rect width="24" height="16" rx="2" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
    </svg>
  );
}

export const FLAG_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  en: FlagUS,
  he: FlagIL,
};
