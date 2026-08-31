"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/components/TranslationProvider";
import {
  ACCESSIBILITY_STORAGE_KEY,
  DEFAULT_ACCESSIBILITY_SETTINGS,
  type AccessibilitySettings,
  type ColorMode,
  type ContentModuleSettings,
  type OrientationModuleSettings,
  type ThreeWayLevel,
} from "@/lib/accessibility/config";

// Phase 90 — the accessibility widget's state layer. Deliberately separate
// from TranslationProvider (which already owns the *real* language/RTL
// state) — this provider's `language` field just mirrors
// useTranslation().language for display purposes and calls the existing
// setLanguage() to actually change it, rather than duplicating that logic.
// Every other setting here (content/color/orientation modules) is new and
// owned entirely by this provider.

type AccessibilityContextValue = {
  settings: AccessibilitySettings;
  setFontSize: (level: ThreeWayLevel) => void;
  setLineHeight: (level: ThreeWayLevel) => void;
  toggleContentFlag: (key: keyof Omit<ContentModuleSettings, "fontSize" | "lineHeight">) => void;
  setColorMode: (mode: ColorMode) => void;
  toggleOrientationFlag: (key: keyof OrientationModuleSettings) => void;
  reset: () => void;
  announcement: string;
  announce: (text: string) => void;
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return ctx;
}

function loadStoredSettings(): AccessibilitySettings {
  // SSR-safe: this only ever runs client-side (called from useState's
  // initializer, which only executes during the client render/hydration
  // pass in a "use client" component — never during the server render that
  // produces the initial HTML), but guarding on `typeof window` anyway
  // means this function stays safe to call from anywhere in the future.
  if (typeof window === "undefined") return DEFAULT_ACCESSIBILITY_SETTINGS;
  try {
    const raw = window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    if (!raw) return DEFAULT_ACCESSIBILITY_SETTINGS;
    const parsed = JSON.parse(raw);
    // Shallow-merge over the defaults (same "old data missing a newer
    // field" safety net used by lib/content.ts's getPageContent) so a
    // settings shape saved before some future field was added still
    // restores sensibly instead of leaving that field undefined.
    return {
      ...DEFAULT_ACCESSIBILITY_SETTINGS,
      ...parsed,
      content: { ...DEFAULT_ACCESSIBILITY_SETTINGS.content, ...parsed?.content },
      orientation: { ...DEFAULT_ACCESSIBILITY_SETTINGS.orientation, ...parsed?.orientation },
    };
  } catch {
    return DEFAULT_ACCESSIBILITY_SETTINGS;
  }
}

function applyContentModules(content: ContentModuleSettings) {
  const root = document.documentElement;
  root.setAttribute("data-a11y-font-size", content.fontSize);
  root.setAttribute("data-a11y-line-height", content.lineHeight);
  root.classList.toggle("a11y-readable-font", content.readableFont);
  root.classList.toggle("a11y-big-cursor", content.bigCursor);
  root.classList.toggle("a11y-letter-spacing", content.letterSpacing);
  root.classList.toggle("a11y-align-text", content.alignText);
  root.classList.toggle("a11y-font-weight", content.fontWeight);
}

function applyColorMode(mode: ColorMode) {
  const root = document.documentElement;
  if (mode === "default") root.removeAttribute("data-a11y-color-mode");
  else root.setAttribute("data-a11y-color-mode", mode);
}

function applyOrientationModules(orientation: OrientationModuleSettings) {
  const root = document.documentElement;
  root.classList.toggle("a11y-hide-images", orientation.hideImages);
  root.classList.toggle("a11y-highlight-content", orientation.highlightContent);
  root.classList.toggle("a11y-stop-animations", orientation.stopAnimations);
  root.classList.toggle("a11y-highlight-links", orientation.highlightLinks);
  // readingLine/readingMask are rendered as actual overlay elements (see
  // ReadingOverlays.tsx) rather than pure CSS, since they need to track the
  // pointer — but a class is still set too, purely so CSS/tests can query
  // "is this mode active" the same uniform way as every other module.
  root.classList.toggle("a11y-reading-line-active", orientation.readingLine);
  root.classList.toggle("a11y-reading-mask-active", orientation.readingMask);
}

export default function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const { language: realLanguage, setLanguage: setRealLanguage } = useTranslation();
  // Lazy initializer (runs once, synchronously, on first client render —
  // never during Next.js's server render, guarded by loadStoredSettings's
  // own `typeof window` check) rather than loading persisted settings in a
  // separate effect after mount. This is safe from a hydration-mismatch
  // standpoint because nothing in this provider's own JSX output depends on
  // `settings` (only the launcher/panel deep inside AccessibilityWidget do,
  // and the panel isn't rendered at all until a user opens it) — the only
  // thing `settings` drives on mount is an imperative DOM mutation
  // (applyContentModules/applyColorMode/applyOrientationModules below),
  // which isn't part of what React reconciles during hydration. Simpler
  // than a load-then-apply effect pair, and avoids an extra render.
  const [settings, setSettings] = useState<AccessibilitySettings>(() =>
    typeof window === "undefined" ? DEFAULT_ACCESSIBILITY_SETTINGS : loadStoredSettings()
  );
  const [announcement, setAnnouncement] = useState("");
  // Set right before reset() changes state, so the persistence effect below
  // skips writing the just-reset (default) values straight back to
  // localStorage — reset() removes the key entirely (per spec: "clears
  // localStorage values for this widget"), and without this flag the
  // effect's normal "persist every settings change" behavior would
  // immediately recreate it holding default values.
  const suppressNextPersist = useRef(false);

  // Keep this provider's `language` mirror in sync with the real
  // TranslationProvider state (e.g. if the header's own picker is used
  // instead of this widget's).
  useEffect(() => {
    setSettings((s) => (s.language === realLanguage ? s : { ...s, language: realLanguage }));
  }, [realLanguage]);

  // Persist + apply on every change, including the very first render (the
  // lazy initializer above already has the right value by then, so this
  // "redundant" first write is just re-saving exactly what was already in
  // storage — harmless, and far simpler than trying to skip it).
  useEffect(() => {
    if (suppressNextPersist.current) {
      suppressNextPersist.current = false;
    } else {
      try {
        window.localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(settings));
      } catch {
        // Storage can throw in private-browsing/quota-exceeded situations —
        // the widget still works for the current page load, it just won't
        // persist across reloads. Never let this break rendering.
      }
    }
    applyContentModules(settings.content);
    applyColorMode(settings.colorMode);
    applyOrientationModules(settings.orientation);
  }, [settings]);

  const setFontSize = useCallback((level: ThreeWayLevel) => {
    setSettings((s) => ({ ...s, content: { ...s.content, fontSize: level } }));
  }, []);

  const setLineHeight = useCallback((level: ThreeWayLevel) => {
    setSettings((s) => ({ ...s, content: { ...s.content, lineHeight: level } }));
  }, []);

  const toggleContentFlag = useCallback(
    (key: keyof Omit<ContentModuleSettings, "fontSize" | "lineHeight">) => {
      setSettings((s) => ({ ...s, content: { ...s.content, [key]: !s.content[key] } }));
    },
    []
  );

  const setColorMode = useCallback((mode: ColorMode) => {
    // Mutually exclusive by construction — setting a mode always replaces
    // whatever was active, and clicking the already-active mode toggles it
    // back to "default" (matches the CTA behavior of most single-select
    // toolbars: click again to turn off).
    setSettings((s) => ({ ...s, colorMode: s.colorMode === mode ? "default" : mode }));
  }, []);

  const toggleOrientationFlag = useCallback((key: keyof OrientationModuleSettings) => {
    setSettings((s) => ({ ...s, orientation: { ...s.orientation, [key]: !s.orientation[key] } }));
  }, []);

  const reset = useCallback(() => {
    suppressNextPersist.current = true;
    setSettings({ ...DEFAULT_ACCESSIBILITY_SETTINGS, language: "en" });
    if (realLanguage !== "en") setRealLanguage("en");
    try {
      window.localStorage.removeItem(ACCESSIBILITY_STORAGE_KEY);
    } catch {
      // Ignore — see the persistence effect above for why this is safe.
    }
    setAnnouncement("Accessibility settings have been reset");
  }, [realLanguage, setRealLanguage]);

  // Shared announce() for anything the panel needs to say through the same
  // live region (e.g. Skip To Content's "Moved to main content"), so there's
  // one aria-live region for the whole widget rather than one per feature.
  const announce = useCallback((text: string) => setAnnouncement(text), []);

  const value = useMemo<AccessibilityContextValue>(
    () => ({
      settings,
      setFontSize,
      setLineHeight,
      toggleContentFlag,
      setColorMode,
      toggleOrientationFlag,
      reset,
      announcement,
      announce,
    }),
    [
      settings,
      setFontSize,
      setLineHeight,
      toggleContentFlag,
      setColorMode,
      toggleOrientationFlag,
      reset,
      announcement,
      announce,
    ]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      {/* A single shared aria-live region for every widget announcement
          (reset confirmation, skip-to-content confirmation) — a screen
          reader announces text placed here without moving visual focus,
          which is exactly what's wanted for "confirm an action just
          happened" rather than "move me somewhere." */}
      <div aria-live="polite" role="status" className="a11y-sr-only">
        {announcement}
      </div>
    </AccessibilityContext.Provider>
  );
}

export { applyContentModules, applyColorMode, applyOrientationModules };
