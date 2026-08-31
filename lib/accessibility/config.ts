// Phase 90 — Roy asked for a production-ready accessibility widget (a
// floating launcher + "Accessibility Adjustments" panel) built from
// scratch, with no third-party accessibility-widget code, assets, or
// branding copied — this file is the single source of truth for what the
// widget can do and its defaults, so the widget component itself stays
// pure UI/wiring and every module's config lives in one typed, documented
// place. See components/accessibility/AccessibilityProvider.tsx for how
// these settings get applied to the document, and CONTENT_GUIDE.md's
// sibling doc, ACCESSIBILITY_WIDGET.md, for the full integration guide.

export type ThreeWayLevel = "decrease" | "default" | "increase";
export type ColorMode = "default" | "light-contrast" | "high-contrast" | "monochrome";
export type SkipTarget = "" | "main" | "footer";

export type ContentModuleSettings = {
  fontSize: ThreeWayLevel;
  readableFont: boolean;
  lineHeight: ThreeWayLevel;
  bigCursor: boolean;
  letterSpacing: boolean;
  alignText: boolean;
  fontWeight: boolean;
};

export type OrientationModuleSettings = {
  readingLine: boolean;
  readingMask: boolean;
  hideImages: boolean;
  highlightContent: boolean;
  stopAnimations: boolean;
  highlightLinks: boolean;
};

export type AccessibilitySettings = {
  language: string;
  content: ContentModuleSettings;
  colorMode: ColorMode;
  orientation: OrientationModuleSettings;
};

// Bumping this bumps the localStorage key, which is the safest way to
// evolve the settings shape later without a runtime migration: an old
// stored value under the old key is simply never read again, and every
// visitor picks up DEFAULT_SETTINGS again once for the new key rather than
// crashing on an old, incompatible JSON shape.
export const ACCESSIBILITY_STORAGE_KEY = "site-accessibility-settings-v1";

export const DEFAULT_CONTENT_MODULE_SETTINGS: ContentModuleSettings = {
  fontSize: "default",
  readableFont: false,
  lineHeight: "default",
  bigCursor: false,
  letterSpacing: false,
  alignText: false,
  fontWeight: false,
};

export const DEFAULT_ORIENTATION_MODULE_SETTINGS: OrientationModuleSettings = {
  readingLine: false,
  readingMask: false,
  hideImages: false,
  highlightContent: false,
  stopAnimations: false,
  highlightLinks: false,
};

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  language: "en",
  content: DEFAULT_CONTENT_MODULE_SETTINGS,
  colorMode: "default",
  orientation: DEFAULT_ORIENTATION_MODULE_SETTINGS,
};

// Config-driven control lists — the panel components map over these
// instead of hardcoding each button, so adding/removing a module is a
// one-place edit here plus whatever the applying effect needs in
// AccessibilityProvider.
export const CONTENT_TOGGLE_MODULES: {
  key: keyof Pick<
    ContentModuleSettings,
    "readableFont" | "bigCursor" | "letterSpacing" | "alignText" | "fontWeight"
  >;
  label: string;
  description: string;
}[] = [
  { key: "readableFont", label: "Readable Font", description: "Switch body text to a highly legible font." },
  { key: "bigCursor", label: "Big Cursor", description: "Use a larger, high-visibility cursor." },
  { key: "letterSpacing", label: "Letter Spacing", description: "Increase spacing between letters." },
  { key: "alignText", label: "Align Text", description: "Align text for easier reading." },
  { key: "fontWeight", label: "Font Weight", description: "Use a stronger font weight for text and headings." },
];

export const COLOR_MODE_OPTIONS: { key: ColorMode; label: string }[] = [
  { key: "light-contrast", label: "Light Contrast" },
  { key: "high-contrast", label: "High Contrast" },
  { key: "monochrome", label: "Monochrome" },
];

export const ORIENTATION_TOGGLE_MODULES: {
  key: keyof OrientationModuleSettings;
  label: string;
  description: string;
}[] = [
  { key: "readingLine", label: "Reading Line", description: "Show a horizontal guide line that follows your pointer." },
  { key: "readingMask", label: "Reading Mask", description: "Dim the page except for a horizontal reading band." },
  { key: "hideImages", label: "Hide Images", description: "Visually hide non-essential images." },
  { key: "highlightContent", label: "Highlight Content", description: "Emphasize the page's main content areas." },
  { key: "stopAnimations", label: "Stop Animations", description: "Pause motion, transitions, and autoplay." },
  { key: "highlightLinks", label: "Highlight Links", description: "Make links visually distinct with underlines." },
];

export const SKIP_TARGET_OPTIONS: { value: SkipTarget; label: string }[] = [
  { value: "", label: "Choose..." },
  { value: "main", label: "Main Content" },
  { value: "footer", label: "Footer" },
];

export const MAIN_CONTENT_ID = "main-content";
export const SITE_FOOTER_ID = "site-footer";
