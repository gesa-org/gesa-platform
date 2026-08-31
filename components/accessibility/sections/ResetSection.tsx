"use client";

import { useAccessibility } from "@/components/accessibility/AccessibilityProvider";

export default function ResetSection() {
  const { reset } = useAccessibility();

  return (
    <section aria-labelledby="a11y-reset-heading" className="a11y-panel-section a11y-reset-section">
      <h3 id="a11y-reset-heading" className="a11y-visually-hidden">
        Reset Settings
      </h3>
      <button type="button" className="a11y-reset-btn" onClick={reset}>
        Reset Settings
      </button>
    </section>
  );
}
