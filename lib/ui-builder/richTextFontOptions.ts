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
// Phase 137 — three more options Roy asked for by name (Arial, Arial
// Narrow, Aptos), none of which the Global Theme's own Typography panel
// offers today. Each is a plain system/web-safe stack, not a font file this
// site loads itself:
// - Arial/Arial Narrow ship with effectively every desktop OS — safe as a
//   primary choice everywhere.
// - Aptos is Microsoft 365's current default (Windows 11 + current Office),
//   but isn't preinstalled on macOS, Linux, or older Windows, and this site
//   doesn't load it as a web font. Per Roy's own spec, the fallback stack
//   below is used verbatim (Aptos, then Aptos Display, then Calibri, then
//   generic sans-serif) so a device without Aptos still renders sensible,
//   already-available text — it degrades, it never breaks.
// Phase 138 — Roy sent a screen recording that just scrolls Word/WPS's own
// Font dropdown top to bottom (Arial through Wingdings — the full ~300-font
// list bundled with Windows/Office) and asked to "copy the list of theme
// fonts" into this one. Copying that list verbatim would break the exact
// thing this dropdown exists to prevent: most of those ~300 (Yu Gothic, MS
// Mincho, Sitka, Segoe UI Variable, Wingdings, SimSun, Bahnschrift, Nirmala
// UI, and dozens more) are Windows/Office-bundled fonts this site doesn't
// load and most visitors' devices (Mac, Linux, mobile, older Windows) don't
// have installed — choosing one as a "theme body font" would silently fall
// back to whatever generic font the visitor's browser picks, different on
// every device, which is precisely what the "only show a font if it's
// loaded, a reliable system fallback, or properly imported" rule from the
// last phase was written to stop. Confirmed with Roy directly: add only the
// fonts from that video that are genuinely safe everywhere, not the entire
// list. Every entry below did appear in the recording and is either a true
// cross-platform web-safe font or backed by a well-established CSS fallback
// stack that degrades gracefully if the named font itself isn't present:
// - Times New Roman, Verdana, Tahoma, Trebuchet MS, Courier New — the
//   classic "web safe fonts" set, pre-installed on effectively every desktop
//   OS for decades.
// - Calibri, Cambria, Candara, Constantia, Corbel — Microsoft's own former
//   "Office theme" font family (Calibri/Cambria were literally Office's
//   default body/heading pair for years); each stack falls back through the
//   others plus a generic family so a device missing all of them still
//   renders sensibly.
// - Segoe UI — Windows' system UI font; the stack below is the same
//   "-apple-system, BlinkMacSystemFont" pattern most modern sites use so it
//   resolves to each OS's own native system font (San Francisco on macOS,
//   Segoe UI on Windows, Roboto on Android) rather than breaking anywhere.
// - Impact — a genuinely web-safe display font, but included with a note
//   that it's a heavy, all-caps-style face meant for short headings/badges,
//   not paragraph body copy.
const EXTRA_FONT_OPTIONS = [
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: '"Arial Narrow", Arial, sans-serif', label: "Arial Narrow" },
  { value: "Aptos, \"Aptos Display\", Calibri, sans-serif", label: "Aptos" },
  { value: '"Times New Roman", Times, serif', label: "Times New Roman" },
  { value: "Verdana, Geneva, sans-serif", label: "Verdana" },
  { value: "Tahoma, Geneva, sans-serif", label: "Tahoma" },
  { value: '"Trebuchet MS", Helvetica, sans-serif', label: "Trebuchet MS" },
  { value: '"Courier New", Courier, monospace', label: "Courier New" },
  { value: "Calibri, Candara, Segoe, \"Segoe UI\", Optima, Arial, sans-serif", label: "Calibri" },
  { value: "Cambria, Georgia, serif", label: "Cambria" },
  { value: "Candara, Calibri, Segoe, \"Segoe UI\", Optima, Arial, sans-serif", label: "Candara" },
  { value: "Constantia, Georgia, serif", label: "Constantia" },
  { value: "Corbel, \"Lucida Grande\", Tahoma, sans-serif", label: "Corbel" },
  { value: "\"Segoe UI\", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif", label: "Segoe UI" },
  { value: "Impact, Haettenschweiler, \"Arial Narrow\", sans-serif", label: "Impact (headings only)" },
] as const;

function dedupeByValue<T extends { value: string; label: string }>(options: readonly T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const option of options) {
    if (seen.has(option.value)) continue;
    seen.add(option.value);
    result.push(option);
  }
  return result;
}

export const RICH_TEXT_FONT_FAMILY_OPTIONS = [
  { value: "", label: "Default (theme body font)" },
  ...dedupeByValue([
    ...HEADING_FONT_OPTIONS.map((f) => ({ value: f.value, label: f.label.replace(" (current)", "") })),
    ...BODY_FONT_OPTIONS.map((f) => ({ value: f.value, label: f.label.replace(" (current)", "") })),
    ...EXTRA_FONT_OPTIONS,
  ]),
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
