import { HEADING_FONT_OPTIONS, BODY_FONT_OPTIONS, DEFAULT_DESIGN_TOKENS } from "@/lib/ui-builder/types";

// Phase 136 — curated options for the rich-text editor's new "Font" group
// (font family, size, color, highlight), modeled on Roy's reference video
// of Word/WPS's Font ribbon group and Font dialog.
//
// Deliberately NOT a free-text/arbitrary-color picker or a full system font
// list, the way Word's own dialog is: this is body copy on a nonprofit
// support site, not a poster. An admin picking any of hundreds of installed
// fonts or an arbitrary neon color per paragraph would fight the site's own
// carefully tuned brand system (Phase 132's Global Theme tokens) rather than
// complement it. Every font-family option here is one already loaded by the
// site (see the same list Phase 132's Typography panel offers) and every
// color option is a real token from that same design system — so a piece of
// custom-styled rich text still always looks like it belongs on the site.
export const RICH_TEXT_FONT_FAMILY_OPTIONS = [
  { value: "", label: "Default (theme body font)" },
  ...HEADING_FONT_OPTIONS.map((f) => ({ value: f.value, label: f.label.replace(" (current)", "") })),
  ...BODY_FONT_OPTIONS.map((f) => ({ value: f.value, label: f.label.replace(" (current)", "") })),
] as const;

// A small curated size ramp (px) — covers "slightly bigger pull-quote" to
// "small fine-print note" without turning into a free-number input that
// could produce an illegibly large/tiny heading.
export const RICH_TEXT_FONT_SIZE_OPTIONS = [
  { value: "", label: "Default" },
  { value: "12px", label: "12" },
  { value: "13px", label: "13" },
  { value: "14px", label: "14" },
  { value: "16px", label: "16" },
  { value: "18px", label: "18" },
  { value: "20px", label: "20" },
  { value: "24px", label: "24" },
  { value: "28px", label: "28" },
  { value: "32px", label: "32" },
  { value: "36px", label: "36" },
] as const;

// Text/highlight color swatches: the site's own design tokens (so a color
// chosen here always already passes the Global Theme tab's own contrast
// checks against the page background) plus a short, standard neutral/
// semantic set. Every value is a plain 6-digit hex, matching the strict
// `#rrggbb`-only pattern lib/ui-builder/sanitizeRichText.ts's allowlist
// enforces.
export const RICH_TEXT_COLOR_SWATCHES = [
  { value: DEFAULT_DESIGN_TOKENS.colors.primary, label: "Primary (theme)" },
  { value: DEFAULT_DESIGN_TOKENS.colors.accent, label: "Accent (theme)" },
  { value: DEFAULT_DESIGN_TOKENS.colors.foreground, label: "Foreground (theme)" },
  { value: "#b42318", label: "Red" },
  { value: "#b5560d", label: "Orange" },
  { value: "#946800", label: "Gold" },
  { value: "#1a7f37", label: "Green" },
  { value: "#0e5a8a", label: "Blue" },
  { value: "#5a3e99", label: "Purple" },
  { value: "#374151", label: "Slate" },
] as const;

export const RICH_TEXT_HIGHLIGHT_SWATCHES = [
  { value: "#fff3b0", label: "Yellow" },
  { value: "#d7f5d0", label: "Green" },
  { value: "#d6ecff", label: "Blue" },
  { value: "#ffe0ec", label: "Pink" },
  { value: "#eadcff", label: "Purple" },
  { value: "#f1f1f1", label: "Grey" },
] as const;
