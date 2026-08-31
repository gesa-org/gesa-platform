"use client";

import { useAccessibility } from "@/components/accessibility/AccessibilityProvider";
import { CONTENT_TOGGLE_MODULES, type ThreeWayLevel } from "@/lib/accessibility/config";

const THREE_WAY_OPTIONS: { value: ThreeWayLevel; label: string }[] = [
  { value: "decrease", label: "Decrease" },
  { value: "default", label: "Default" },
  { value: "increase", label: "Increase" },
];

function ThreeWayControl({
  legend,
  value,
  onChange,
}: {
  legend: string;
  value: ThreeWayLevel;
  onChange: (v: ThreeWayLevel) => void;
}) {
  return (
    <fieldset className="a11y-fieldset">
      <legend className="a11y-fieldset-legend">{legend}</legend>
      <div className="a11y-segmented" role="group" aria-label={legend}>
        {THREE_WAY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className="a11y-segmented-btn"
            aria-pressed={value === opt.value}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

// Phase 90 — every module here is an independent, keyboard-operable
// control (native <button>s with aria-pressed, so Tab/Shift+Tab and
// Enter/Space work with zero extra key handling) whose state lives in
// AccessibilityProvider and is applied document-wide via a class/attribute
// on <html> — see app/globals.css's "Content Modules" section for the
// actual CSS each one drives.
export default function ContentModulesSection() {
  const { settings, setFontSize, setLineHeight, toggleContentFlag } = useAccessibility();

  return (
    <section aria-labelledby="a11y-content-heading" className="a11y-panel-section">
      <h3 id="a11y-content-heading" className="a11y-panel-section-heading">
        Content Modules
      </h3>

      <ThreeWayControl legend="Font Size" value={settings.content.fontSize} onChange={setFontSize} />
      <ThreeWayControl legend="Line Height" value={settings.content.lineHeight} onChange={setLineHeight} />

      <div className="a11y-toggle-grid">
        {CONTENT_TOGGLE_MODULES.map((mod) => {
          const active = settings.content[mod.key];
          return (
            <button
              key={mod.key}
              type="button"
              className="a11y-toggle-btn"
              aria-pressed={active}
              title={mod.description}
              onClick={() => toggleContentFlag(mod.key)}
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
