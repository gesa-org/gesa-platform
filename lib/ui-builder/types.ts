// Phase 132 — the "UI Builder" admin feature's design-token schema. This is
// the shape stored in `crm_ui_drafts.schema` (while an admin is editing) and
// in `site_content` under key "theme_tokens" (once published, per the read
// contract in lib/content.ts's getPageContent). Scoped to Typography + Color
// today — the two modules that are safe to apply globally via CSS custom
// properties without touching per-page markup. Image/Lighting and
// Layout/Reorder are real, larger modules planned for later phases (see
// EXECUTION_PLAN.md Phase 132's "left untouched" note) and are deliberately
// not represented here yet, rather than half-modeled with fields nothing
// reads.
export type DesignTokens = {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    baseFontSize: number; // px
    headingWeight: number;
    bodyWeight: number;
    lineHeight: number; // unitless multiplier
    /** Tracking for small uppercase labels (eyebrows, badges) — the one
     * letter-spacing knob the spec calls out by name. In em. */
    labelLetterSpacing: number;
  };
};

// Curated, not free-text — every option here is already loaded by the site
// (see the Google Fonts @import in app/globals.css) or is a safe system
// stack, so picking one never risks a font that silently fails to load.
export const HEADING_FONT_OPTIONS = [
  { value: "\"Cormorant Garamond\", \"Iowan Old Style\", \"Palatino Linotype\", Palatino, Georgia, ui-serif, serif", label: "Cormorant Garamond (current)" },
  { value: "Georgia, \"Times New Roman\", ui-serif, serif", label: "Georgia (system serif)" },
  { value: "\"Nunito Sans\", ui-sans-serif, system-ui, sans-serif", label: "Nunito Sans (sans, matches body)" },
] as const;

export const BODY_FONT_OPTIONS = [
  { value: "\"Nunito Sans\", ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif", label: "Nunito Sans (current)" },
  { value: "\"Heebo\", ui-sans-serif, system-ui, sans-serif", label: "Heebo (already loaded, used for Hebrew content)" },
  { value: "Georgia, \"Times New Roman\", ui-serif, serif", label: "Georgia (system serif)" },
] as const;

// Mirrors app/globals.css's current :root values exactly, so publishing
// once with no changes is a true no-op — the override <style> block in
// app/layout.tsx would render the same values already in globals.css.
export const DEFAULT_DESIGN_TOKENS: DesignTokens = {
  colors: {
    primary: "#2b3140",
    secondary: "#b7c3d6",
    accent: "#9ba283",
    background: "#eef1f6",
    foreground: "#2b3140",
  },
  typography: {
    headingFont: HEADING_FONT_OPTIONS[0].value,
    bodyFont: BODY_FONT_OPTIONS[0].value,
    baseFontSize: 16,
    headingWeight: 600,
    bodyWeight: 400,
    lineHeight: 1.6,
    labelLetterSpacing: 0.14,
  },
};

export function mergeDesignTokens(partial: Partial<DesignTokens> | null | undefined): DesignTokens {
  if (!partial) return DEFAULT_DESIGN_TOKENS;
  return {
    colors: { ...DEFAULT_DESIGN_TOKENS.colors, ...partial.colors },
    typography: { ...DEFAULT_DESIGN_TOKENS.typography, ...partial.typography },
  };
}

// WCAG 2.x relative-luminance contrast ratio — the "contrast ratio
// verification safeguard" the spec calls for under the Color & Theme
// System. Pure function, no DOM, so it can run both in the admin builder
// (live, as an admin drags a color picker) and could be unit-tested later.
function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG AA for normal-size text. Callers decide what to do with a fail —
 * the builder shows a warning, it never blocks Publish outright, since an
 * admin may have a deliberate reason (a decorative band, not body copy). */
export const WCAG_AA_NORMAL_TEXT = 4.5;
