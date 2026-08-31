// Phase 90 — an original, hand-drawn "accessible human figure" glyph (head
// circle + arms-out torso + legs), built from scratch as plain SVG
// primitives rather than traced from or copied out of any third-party
// accessibility-widget icon set. Deliberately simple/geometric so it reads
// clearly at 20-32px inside the launcher button.
export default function AccessibilityIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
      <circle cx="18" cy="7.5" r="4.5" fill="currentColor" />
      <path
        d="M18 13.5c-6.2 0-11.6 1.35-11.9 1.43a2 2 0 0 0 1 3.87c.06-.02 3.9-1.02 8.4-1.28l-2.1 8.02a2 2 0 0 0 3.87 1.01l1.85-7.06h1.76l1.85 7.06a2 2 0 0 0 3.87-1.01l-2.1-8.02c4.5.26 8.34 1.26 8.4 1.28a2 2 0 0 0 1-3.87c-.3-.08-5.7-1.43-11.9-1.43Z"
        fill="currentColor"
      />
    </svg>
  );
}
