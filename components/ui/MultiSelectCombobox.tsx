"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

// Phase 195 — reusable searchable multi-select combobox, built for the
// "JOIN THE MOVEMENT" volunteer application modal's two required fields
// (Additional Areas of Expertise, Possible Therapy Languages), per Roy's
// spec: a searchable dropdown (not a long visible checkbox grid), selected
// values shown as removable chips, an optional "Other" option that reveals
// a short text field, and full keyboard support (arrows to move, Enter to
// select the highlighted option, Escape to close, Backspace on an empty
// query to remove the last chip).
//
// Deliberately generic (no expertise/language-specific logic baked in) so
// both fields in VolunteerApplicationModal.tsx reuse the exact same
// component — the only per-field differences are the option list, labels,
// and (optionally) an "Other" reveal field, all passed in as props.
//
// Keyboard design note: this is a *search* input, so typing (including a
// literal space, e.g. "Life Coach") must never be hijacked. Arrow Up/Down
// move a keyboard-only highlight (`activeIndex`); typing a character always
// resets that highlight to "none" (-1). Enter/Space only toggle the
// highlighted option when `activeIndex` is not -1 — i.e. only right after
// an arrow key was pressed — so Space still types normally while searching.
export interface MultiSelectComboboxProps {
  id: string;
  label: string;
  required?: boolean;
  helperText?: string;
  placeholder?: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  /** e.g. "Other" / "Other language" — rendered as the last selectable row. */
  otherOptionLabel?: string;
  /** e.g. "Please specify other expertise." — label for the reveal field. */
  otherFieldLabel?: string;
  otherFieldPlaceholder?: string;
  otherValue?: string;
  onOtherValueChange?: (text: string) => void;
  error?: string | null;
}

export default function MultiSelectCombobox({
  id,
  label,
  required = false,
  helperText,
  placeholder = "Search…",
  options,
  value,
  onChange,
  otherOptionLabel,
  otherFieldLabel,
  otherFieldPlaceholder,
  otherValue = "",
  onOtherValueChange,
  error,
}: MultiSelectComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const listboxId = `${id}-listbox-${reactId}`;
  const errorId = `${id}-error-${reactId}`;

  const allOptions = useMemo(
    () => (otherOptionLabel ? [...options, otherOptionLabel] : options),
    [options, otherOptionLabel]
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allOptions;
    return allOptions.filter((o) => o.toLowerCase().includes(q));
  }, [allOptions, query]);

  const otherSelected = !!otherOptionLabel && value.includes(otherOptionLabel);

  // Close the dropdown on an outside click.
  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  function toggleValue(option: string) {
    const next = value.includes(option) ? value.filter((v) => v !== option) : [...value, option];
    onChange(next);
    // Clearing the "Other" checkbox also clears its now-hidden text field,
    // so a stale value can't be silently resubmitted later.
    if (option === otherOptionLabel && value.includes(option)) {
      onOtherValueChange?.("");
    }
  }

  function removeChip(option: string) {
    onChange(value.filter((v) => v !== option));
    if (option === otherOptionLabel) onOtherValueChange?.("");
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
        return;
      }
      setActiveIndex((i) => (i + 1 >= filteredOptions.length ? 0 : i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(filteredOptions.length - 1);
        return;
      }
      setActiveIndex((i) => (i - 1 < 0 ? filteredOptions.length - 1 : i - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && activeIndex >= 0 && filteredOptions[activeIndex]) {
        toggleValue(filteredOptions[activeIndex]);
      } else if (!open) {
        setOpen(true);
      }
      return;
    }
    if (e.key === " ") {
      // Only intercept Space as a "select" key when a keyboard highlight is
      // active (the user just pressed an arrow key) — otherwise Space types
      // normally, which multi-word options like "Life Coach" need.
      if (open && activeIndex >= 0 && filteredOptions[activeIndex]) {
        e.preventDefault();
        toggleValue(filteredOptions[activeIndex]);
      }
      return;
    }
    if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
      }
      return;
    }
    if (e.key === "Backspace" && query === "" && value.length > 0) {
      // Remove the last selected chip when the search box is empty.
      removeChip(value[value.length - 1]);
      return;
    }
    // Any other printable key resumes free typing — drop the keyboard
    // highlight so Space/Enter go back to normal text-entry behavior.
    if (e.key.length === 1) {
      setActiveIndex(-1);
    }
  }

  const otherRevealId = `${id}-other-${reactId}`;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {helperText && <p className="mb-2 text-[12.5px] text-muted-fg">{helperText}</p>}

      <div
        className={`flex w-full flex-wrap items-center gap-1.5 rounded-xl border bg-background px-2.5 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/40 ${
          error ? "border-destructive" : "border-border"
        }`}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-owns={listboxId}
        aria-controls={listboxId}
      >
        {value.map((option) => (
          <span
            key={option}
            className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[12.5px] font-medium text-primary"
          >
            {option}
            <button
              type="button"
              onClick={() => removeChip(option)}
              aria-label={`Remove ${option}`}
              className="rounded-full p-0.5 hover:bg-primary/15"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          type="text"
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          value={query}
          placeholder={value.length === 0 ? placeholder : ""}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onInputKeyDown}
          className="min-w-[120px] flex-1 bg-transparent py-1 text-[14px] outline-none"
        />
        <button
          type="button"
          onClick={() => {
            setOpen((o) => !o);
            inputRef.current?.focus();
          }}
          aria-label={open ? "Close options" : "Open options"}
          className="ml-auto flex-none rounded-full p-1 text-muted-fg hover:bg-secondary"
        >
          <ChevronDown size={16} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
        </button>
      </div>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-multiselectable="true"
          aria-label={label}
          className="absolute z-20 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-border bg-background py-1 shadow-lg"
        >
          {filteredOptions.length === 0 && (
            <li className="px-3.5 py-2.5 text-[13.5px] text-muted-fg">No matches — try a different search.</li>
          )}
          {filteredOptions.map((option, index) => {
            const selected = value.includes(option);
            return (
              <li
                key={option}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={selected}
                onMouseDown={(e) => e.preventDefault()} // keep input focus so `open` doesn't close before the click registers
                onClick={() => toggleValue(option)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex min-h-[40px] cursor-pointer items-center gap-2 px-3.5 py-2 text-[14px] ${
                  index === activeIndex ? "bg-accent-soft" : ""
                } ${selected ? "font-semibold text-primary" : ""}`}
              >
                <span
                  className={`flex h-4 w-4 flex-none items-center justify-center rounded border ${
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  }`}
                  aria-hidden="true"
                >
                  {selected && <Check size={11} />}
                </span>
                {option}
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-1.5 flex items-start gap-1 text-[12.5px] text-destructive">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}

      {otherSelected && (
        <div className="mt-2.5">
          <label htmlFor={otherRevealId} className="mb-1 block text-[13px] font-semibold">
            {otherFieldLabel ?? "Please specify."}
          </label>
          <input
            id={otherRevealId}
            type="text"
            value={otherValue}
            onChange={(e) => onOtherValueChange?.(e.target.value)}
            placeholder={otherFieldPlaceholder}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </div>
      )}
    </div>
  );
}
