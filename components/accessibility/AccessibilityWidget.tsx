"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import AccessibilityIcon from "@/components/accessibility/AccessibilityIcon";
import ReadingOverlays from "@/components/accessibility/ReadingOverlays";
import LanguageSection from "@/components/accessibility/sections/LanguageSection";
import ContentModulesSection from "@/components/accessibility/sections/ContentModulesSection";
import ColorModulesSection from "@/components/accessibility/sections/ColorModulesSection";
import OrientationModulesSection from "@/components/accessibility/sections/OrientationModulesSection";
import SkipToContentSection from "@/components/accessibility/sections/SkipToContentSection";
import ResetSection from "@/components/accessibility/sections/ResetSection";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Phase 90 — the floating launcher + "Accessibility Adjustments" panel.
// Rendered once, globally, from app/layout.tsx, so it's part of the shared
// application shell rather than any individual page — no page-level code
// can remove, hide, or replace it (there's nothing page-level rendering
// it in the first place). Excluded only from /admin routes (the internal
// CRM, not the public-facing site this was asked for — same convention
// TranslationProvider already uses for the same reason).
export default function AccessibilityWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const isAdminRoute = pathname?.startsWith("/admin") ?? false;

  // Focus the panel's first focusable control when it opens; return focus
  // to the launcher when it closes — standard dialog focus management.
  useEffect(() => {
    if (open) {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus();
    } else {
      launcherRef.current?.focus();
    }
  }, [open]);

  // Escape closes the panel from anywhere inside it; Tab/Shift+Tab are
  // trapped within the panel while it's open, so keyboard focus can't
  // silently leave into the page behind it (spec section: "Focus trap
  // while the panel is open").
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  // Click outside the panel (and outside the launcher) closes it, matching
  // every other dropdown/menu pattern already used across this site (e.g.
  // LanguageSelector's own click-outside handling).
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || launcherRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  if (isAdminRoute) return null;

  return (
    <>
      <ReadingOverlays />
      <button
        ref={launcherRef}
        type="button"
        className="a11y-launcher"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="a11y-panel"
        aria-label="Accessibility options"
        title="Accessibility options"
        onClick={() => setOpen((v) => !v)}
      >
        <AccessibilityIcon className="a11y-launcher-icon" />
      </button>

      {open && (
        <div
          ref={panelRef}
          id="a11y-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-panel-title"
          className="a11y-panel"
        >
          <div className="a11y-panel-header">
            <h2 id="a11y-panel-title" className="a11y-panel-title">
              Accessibility Adjustments
            </h2>
            <button
              type="button"
              className="a11y-panel-close"
              aria-label="Close accessibility toolbar"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="a11y-panel-body">
            <LanguageSection />
            <ContentModulesSection />
            <ColorModulesSection />
            <OrientationModulesSection />
            <SkipToContentSection />
            <ResetSection />
          </div>
        </div>
      )}
    </>
  );
}
