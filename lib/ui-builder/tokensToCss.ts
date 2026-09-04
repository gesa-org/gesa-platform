import type { DesignTokens } from "@/lib/ui-builder/types";

// Phase 132 — shared by app/layout.tsx (server-rendered <style> override,
// applied to every real visitor) and the postMessage listener script in
// that same file (applied client-side inside the admin builder's preview
// iframe). One function, one mapping from token -> CSS custom property, so
// the two can never drift out of sync with each other.
//
// Only overrides the tokens this phase actually exposes controls for
// (colors + typography) — every other custom property in globals.css
// (--card, --border, --destructive, --espresso, --radius, etc.) is
// untouched, so nothing outside what an admin can see and edit in the
// builder ever changes.
export function designTokensToCssText(tokens: DesignTokens): string {
  const t = tokens.typography;
  return [
    `--primary: ${tokens.colors.primary};`,
    `--secondary: ${tokens.colors.secondary};`,
    `--accent: ${tokens.colors.accent};`,
    `--background: ${tokens.colors.background};`,
    `--foreground: ${tokens.colors.foreground};`,
    `--font-serif: ${t.headingFont};`,
    `--font-sans: ${t.bodyFont};`,
    `--ui-base-font-size: ${t.baseFontSize}px;`,
    `--ui-heading-weight: ${t.headingWeight};`,
    `--ui-body-weight: ${t.bodyWeight};`,
    `--ui-line-height: ${t.lineHeight};`,
    `--ui-label-tracking: ${t.labelLetterSpacing}em;`,
  ].join(" ");
}
