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

// Roy sent a reference screenshot of a font picker scrolled to its "Ca"–"Co"
// section (Calibri through Corbel) and asked for every font shown in it to
// be added to the Theme Body Font dropdown. Every one of these ~30 names is
// a Microsoft/Windows-bundled font (the Office "ClearType" family — Calibri,
// Candara, Constantia, Corbel, Cambria — plus classic Windows fonts like
// Comic Sans MS, Consolas, Century Gothic, and the open-source-but-not-on-
// Google-Fonts Cascadia Code/Mono) — none are loadable from Google Fonts,
// and this site doesn't self-host any of them. Same approach as Phase 138's
// Calibri/Cambria/Candara/Constantia/Corbel entries and Phase 137's Aptos:
// each is listed as itself first, so a visitor who *does* have it installed
// (most Windows users, for the Office fonts) sees the real thing, with a
// CSS fallback chain to a close visually-similar already-available font and
// finally a generic family — it degrades gracefully everywhere else rather
// than silently picking a different generic font on every device, which is
// exactly the failure mode a past phase's "only show a font if it's loaded,
// a reliable system fallback, or properly imported" rule exists to prevent.
// The 5 that already existed below (Calibri, Cambria, Candara, Constantia,
// Corbel — added in Phase 138 to the Page Content field font list, but
// never to this Global Theme dropdown) reuse their EXACT existing value
// strings verbatim, so any already-published theme or per-field selection
// using one of those 5 keeps resolving to the identical CSS stack — no
// legacy value silently changes meaning.
export const BODY_FONT_OPTIONS = [
  { value: "\"Nunito Sans\", ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif", label: "Nunito Sans (current)" },
  { value: "\"Heebo\", ui-sans-serif, system-ui, sans-serif", label: "Heebo (already loaded, used for Hebrew content)" },
  { value: "Georgia, \"Times New Roman\", ui-serif, serif", label: "Georgia (system serif)" },
  { value: "Calibri, Candara, Segoe, \"Segoe UI\", Optima, Arial, sans-serif", label: "Calibri" },
  { value: "\"Calibri Light\", Calibri, Candara, Segoe, \"Segoe UI\", Arial, sans-serif", label: "Calibri Light" },
  { value: "\"Californian FB\", \"Book Antiqua\", Palatino, Georgia, serif", label: "Californian FB" },
  { value: "\"Calisto MT\", Georgia, \"Times New Roman\", serif", label: "Calisto MT" },
  { value: "Cambria, Georgia, serif", label: "Cambria" },
  { value: "\"Cambria Math\", Cambria, Georgia, serif", label: "Cambria Math" },
  { value: "Candara, Calibri, Segoe, \"Segoe UI\", Optima, Arial, sans-serif", label: "Candara" },
  { value: "\"Candara Light\", Candara, Calibri, Segoe, \"Segoe UI\", Arial, sans-serif", label: "Candara Light" },
  { value: "\"Cascadia Code\", Consolas, \"Courier New\", monospace", label: "Cascadia Code" },
  { value: "\"Cascadia Code ExtraLight\", \"Cascadia Code\", Consolas, monospace", label: "Cascadia Code ExtraLight" },
  { value: "\"Cascadia Code Light\", \"Cascadia Code\", Consolas, monospace", label: "Cascadia Code Light" },
  { value: "\"Cascadia Code SemiBold\", \"Cascadia Code\", Consolas, monospace", label: "Cascadia Code SemiBold" },
  { value: "\"Cascadia Code SemiLight\", \"Cascadia Code\", Consolas, monospace", label: "Cascadia Code SemiLight" },
  { value: "\"Cascadia Mono\", Consolas, \"Courier New\", monospace", label: "Cascadia Mono" },
  { value: "\"Cascadia Mono ExtraLight\", \"Cascadia Mono\", Consolas, monospace", label: "Cascadia Mono ExtraLight" },
  { value: "\"Cascadia Mono Light\", \"Cascadia Mono\", Consolas, monospace", label: "Cascadia Mono Light" },
  { value: "\"Cascadia Mono SemiBold\", \"Cascadia Mono\", Consolas, monospace", label: "Cascadia Mono SemiBold" },
  { value: "\"Cascadia Mono SemiLight\", \"Cascadia Mono\", Consolas, monospace", label: "Cascadia Mono SemiLight" },
  { value: "Castellar, Georgia, serif", label: "Castellar" },
  { value: "Centaur, Georgia, \"Times New Roman\", serif", label: "Centaur" },
  { value: "Century, Georgia, \"Times New Roman\", serif", label: "Century" },
  { value: "\"Century Gothic\", Futura, Arial, sans-serif", label: "Century Gothic" },
  { value: "\"Century Schoolbook\", Georgia, serif", label: "Century Schoolbook" },
  { value: "Chiller, cursive", label: "Chiller (display only)" },
  { value: "\"Colonna MT\", Georgia, serif", label: "Colonna MT" },
  { value: "\"Comic Sans MS\", \"Comic Sans\", cursive", label: "Comic Sans MS" },
  { value: "Consolas, \"Courier New\", monospace", label: "Consolas" },
  { value: "Constantia, Georgia, serif", label: "Constantia" },
  { value: "\"Cooper Black\", Georgia, serif", label: "Cooper Black (display only)" },
  { value: "\"Copperplate Gothic Bold\", Copperplate, Georgia, serif", label: "Copperplate Gothic Bold (display only)" },
  { value: "\"Copperplate Gothic Light\", Copperplate, Georgia, serif", label: "Copperplate Gothic Light (display only)" },
  { value: "Corbel, \"Lucida Grande\", Tahoma, sans-serif", label: "Corbel" },
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
