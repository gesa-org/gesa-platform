"use client";

import { useState } from "react";
import { useAccessibility } from "@/components/accessibility/AccessibilityProvider";
import { MAIN_CONTENT_ID, SITE_FOOTER_ID, SKIP_TARGET_OPTIONS, type SkipTarget } from "@/lib/accessibility/config";

// Phase 90 — moves real keyboard focus (not just a visual scroll) to the
// chosen landmark, so this genuinely helps keyboard/screen-reader users
// rather than only sighted mouse users. Both #main-content and
// #site-footer are `tabindex="-1"` landmarks added in app/layout.tsx /
// components/Footer.tsx specifically so they're focusable via script even
// though neither is naturally in the tab order.
export default function SkipToContentSection() {
  const { announce } = useAccessibility();
  const [value, setValue] = useState<SkipTarget>("");

  function handleChange(target: SkipTarget) {
    setValue(target);
    if (!target) return;

    const id = target === "main" ? MAIN_CONTENT_ID : SITE_FOOTER_ID;
    const el = document.getElementById(id);
    if (el) {
      // Focus first (the part that actually matters for keyboard/screen
      // reader users) — scrollIntoView is a nice-to-have for sighted users
      // and, in some test/JSDOM environments, isn't implemented at all;
      // guarding it so a missing/throwing scrollIntoView can never prevent
      // the real focus move or the announcement below.
      el.focus({ preventScroll: true });
      try {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch {
        // Ignore — see comment above.
      }
      announce(target === "main" ? "Moved to main content" : "Moved to footer");
    }
    // Reset back to "Choose..." once the move happens, so re-selecting the
    // same option later still fires (a <select> only fires onChange when
    // the value actually changes).
    setValue("");
  }

  return (
    <section aria-labelledby="a11y-skip-heading" className="a11y-panel-section">
      <h3 id="a11y-skip-heading" className="a11y-panel-section-heading">
        Skip To Content
      </h3>
      <label htmlFor="a11y-skip-select" className="a11y-visually-hidden">
        Skip to content
      </label>
      <select
        id="a11y-skip-select"
        className="a11y-select"
        value={value}
        onChange={(e) => handleChange(e.target.value as SkipTarget)}
      >
        {SKIP_TARGET_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </section>
  );
}
