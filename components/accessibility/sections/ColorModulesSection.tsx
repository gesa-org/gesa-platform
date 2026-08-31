"use client";

import { useAccessibility } from "@/components/accessibility/AccessibilityProvider";
import { COLOR_MODE_OPTIONS } from "@/lib/accessibility/config";

// Phase 90 — mutually exclusive by construction: AccessibilityProvider's
// setColorMode() always replaces whatever mode was active (or turns off if
// you click the already-active one), so only one of these three
// aria-pressed buttons is ever true at once — never handled by hiding/
// disabling the other two, which would be worse for screen reader users
// than a normal toggle group.
export default function ColorModulesSection() {
  const { settings, setColorMode } = useAccessibility();

  return (
    <section aria-labelledby="a11y-color-heading" className="a11y-panel-section">
      <h3 id="a11y-color-heading" className="a11y-panel-section-heading">
        Color Modules
      </h3>
      <div className="a11y-toggle-grid" role="radiogroup" aria-label="Color mode">
        {COLOR_MODE_OPTIONS.map((opt) => {
          const active = settings.colorMode === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              role="radio"
              aria-checked={active}
              className="a11y-toggle-btn"
              onClick={() => setColorMode(opt.key)}
            >
              <span>{opt.label}</span>
              <span className="a11y-toggle-state" aria-hidden="true">
                {active ? "On" : "Off"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
