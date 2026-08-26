"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

// Phase 63 — generic "pick from common options, or add your own" control.
// Built for the volunteer therapist application's Specialties/Languages
// fields (curated quick-pick chips + unlimited free-text additions, since
// neither field should be capped to a fixed list — a therapist's real
// specialty or spoken language might not be one of the common suggestions),
// but kept generic enough to reuse anywhere else a similar "select some,
// plus anything else" field is needed.
export default function TagPicker({
  label,
  options,
  selected,
  onChange,
  required,
  help,
  customPlaceholder = "Add another…",
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  required?: boolean;
  help?: string;
  customPlaceholder?: string;
}) {
  const [customValue, setCustomValue] = useState("");

  function toggle(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  }

  function addCustom() {
    const value = customValue.trim();
    if (!value) return;
    if (selected.some((s) => s.toLowerCase() === value.toLowerCase())) {
      // Already selected (curated or custom) — nothing to add.
      setCustomValue("");
      return;
    }
    // If the typed value matches one of the curated options (e.g. someone
    // types "english" instead of clicking the "English" chip), select that
    // curated option itself rather than creating a redundant look-alike
    // custom chip alongside the unselected curated one.
    const curatedMatch = options.find((o) => o.toLowerCase() === value.toLowerCase());
    onChange([...selected, curatedMatch ?? value]);
    setCustomValue("");
  }

  // Anything in `selected` that isn't one of the curated `options` is a
  // custom addition — shown as its own removable chip below the quick-pick
  // grid so it's clear it was typed in, not one of the suggestions.
  const customSelected = selected.filter((s) => !options.includes(s));

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                isSelected
                  ? "border-primary bg-accent-soft text-primary"
                  : "border-border text-foreground hover:border-primary-600"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {customSelected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {customSelected.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1.5 rounded-full border border-primary bg-accent-soft px-3 py-1.5 text-[13px] font-medium text-primary"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(selected.filter((s) => s !== tag))}
                aria-label={`Remove ${tag}`}
                className="hover:opacity-70"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex gap-2">
        <input
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder={customPlaceholder}
          className="w-full rounded-xl border border-border px-3.5 py-2 text-[13.5px] focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          onClick={addCustom}
          className="flex flex-none items-center gap-1 rounded-xl border border-border px-3 py-2 text-[13px] font-semibold text-primary hover:bg-secondary"
        >
          <Plus size={14} /> Add
        </button>
      </div>
      {help && <p className="mt-1 text-[12px] text-muted-fg">{help}</p>}
    </div>
  );
}
