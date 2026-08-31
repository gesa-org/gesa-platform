"use client";

import { useAccessibility } from "@/components/accessibility/AccessibilityProvider";
import { ORIENTATION_TOGGLE_MODULES } from "@/lib/accessibility/config";

export default function OrientationModulesSection() {
  const { settings, toggleOrientationFlag } = useAccessibility();

  return (
    <section aria-labelledby="a11y-orientation-heading" className="a11y-panel-section">
      <h3 id="a11y-orientation-heading" className="a11y-panel-section-heading">
        Orientation Modules
      </h3>
      <div className="a11y-toggle-grid">
        {ORIENTATION_TOGGLE_MODULES.map((mod) => {
          const active = settings.orientation[mod.key];
          return (
            <button
              key={mod.key}
              type="button"
              className="a11y-toggle-btn"
              aria-pressed={active}
              title={mod.description}
              onClick={() => toggleOrientationFlag(mod.key)}
            >
              <span>{mod.label}</span>
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
