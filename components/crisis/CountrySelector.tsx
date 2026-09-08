"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { COUNTRY_OPTIONS, type CountryOption } from "@/lib/countries";

// Phase 169 — the "Select your country or region" combobox inside
// CrisisButton's modal. Built as a real ARIA combobox (role="combobox" +
// role="listbox"/"option", not a native <select>) so it's genuinely
// searchable — typing filters the list — while still being fully
// keyboard-operable (Up/Down/Home/End/Enter/Escape) and screen-reader
// friendly. No new dependency added: COUNTRY_OPTIONS (lib/countries.ts)
// already gives us ISO code, name, dial code, and a flag-emoji, the same
// data PhoneNumberInput.tsx uses for its own country field.
//
// Deliberately does NOT auto-select a country from IP/geolocation — there
// is no location API call anywhere in this component. If a caller ever
// wants a privacy-respecting "guess" (e.g. from an already-known profile
// country, never a geolocation prompt), it can pass `initialCode` and nudge
// the user to confirm; this component itself never reaches out for location
// data on its own.
export default function CountrySelector({
  value,
  onChange,
  id = "crisis-country-selector",
  label = "Select your country or region",
  placeholder = "Choose a country",
}: {
  value: string | null;
  onChange: (code: string) => void;
  id?: string;
  label?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = useMemo(() => COUNTRY_OPTIONS.find((c) => c.code === value) ?? null, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q || c.dial.includes(q)
    );
  }, [query]);

  // Close on outside click — standard combobox behavior, doesn't interfere
  // with the modal's own backdrop-click-to-close (Modal.tsx stops
  // propagation on its panel, so this only ever fires for clicks genuinely
  // outside this component).
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (open) setActiveIndex(0);
  }, [open, query]);

  useEffect(() => {
    if (!open) return;
    const activeEl = listRef.current?.querySelector<HTMLLIElement>(`[data-index="${activeIndex}"]`);
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function selectOption(option: CountryOption) {
    onChange(option.code);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Home" && open) {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End" && open) {
      e.preventDefault();
      setActiveIndex(filtered.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && filtered[activeIndex]) selectOption(filtered[activeIndex]);
      else setOpen(true);
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  }

  const listboxId = `${id}-listbox`;
  const activeOptionId = filtered[activeIndex] ? `${id}-option-${filtered[activeIndex].code}` : undefined;

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(e) => {
        // Keyboard users tabbing away (as opposed to a mouse click handled
        // by the document listener above) don't fire that listener — close
        // the list whenever focus leaves this whole component, but not when
        // it's just moving from the input to an option inside the same
        // listbox (relatedTarget is still inside rootRef in that case).
        if (!rootRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        {/* The input always shows the flag of the current selection as a
            leading glyph once one is made, echoed inside the text value
            itself (screen readers get the flag's name for free via the
            emoji's Unicode name, plus the country name right after it) —
            no separate icon element needed to convey "this dropdown has a
            flag in it". */}
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open ? activeOptionId : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          type="text"
          value={open ? query : selected ? `${selected.flag} ${selected.name} (${selected.dial})` : ""}
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 pr-10 text-[15px] focus:border-primary focus:outline-none"
        />
        <ChevronDown
          size={17}
          aria-hidden="true"
          className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-fg transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Countries and regions"
          className="absolute z-10 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-border bg-card p-1.5 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2.5 text-[14px] text-muted-fg">No matching country or region.</li>
          ) : (
            filtered.map((c, i) => (
              <li
                key={c.code}
                id={`${id}-option-${c.code}`}
                data-index={i}
                role="option"
                aria-selected={c.code === value}
                onMouseDown={(e) => {
                  // mousedown (not click) so this fires before the input's
                  // onBlur/outside-click handler would otherwise close the
                  // list first.
                  e.preventDefault();
                  selectOption(c);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14.5px] ${
                  i === activeIndex ? "bg-accent-soft text-primary" : "text-foreground"
                }`}
              >
                <span aria-hidden="true">{c.flag}</span>
                <span className="flex-1">{c.name}</span>
                <span className="text-[13px] text-muted-fg">{c.dial}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
