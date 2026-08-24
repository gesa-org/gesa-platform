"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LANGUAGES } from "@/lib/languages";
import { FLAG_ICONS } from "@/components/FlagIcon";
import { useTranslation } from "@/components/TranslationProvider";

// The dropdown itself; actual page translation is handled by
// TranslationProvider (components/TranslationProvider.tsx), which this just
// calls into. Still persists the choice to profiles.preferred_language for
// signed-in users so it follows them across devices.
//
// Phase 53 — restyled into a flag-icon-first trigger per Roy's request: the
// closed button now leads with the real SVG flag (see components/FlagIcon.tsx
// — swapped in for the previous flag *emoji*, which on Windows commonly
// render as plain "US"/"IL" text instead of an actual flag glyph, since
// that's an OS font limitation, not something CSS/JS here can fix) and drops
// the language name at everything below `sm`, so on mobile especially this
// reads as a clean icon dropdown. The open menu still shows flag + language
// name side by side for clarity, since "just a flag" alone is less scannable
// in a list than it is as a single always-visible trigger.
export default function LanguageSelector() {
  const { language, translating, setLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function select(code: string) {
    setOpen(false);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ preferred_language: code }).eq("id", user.id);
    }
    setLanguage(code);
  }

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];
  const CurrentFlag = FLAG_ICONS[current.code];

  return (
    <div className="relative" ref={ref} data-no-translate>
      {/* Icon-first trigger: a real SVG flag (see the Phase 53 note above),
          always shown, with the language name only from `sm` up — the flag
          alone is the icon this reads as a "flag dropdown" on mobile. */}
      <button
        onClick={() => setOpen((v) => !v)}
        title={`Language: ${current.name}`}
        className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-[14px] font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
        disabled={translating}
      >
        {translating ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          CurrentFlag && <CurrentFlag className="h-4 w-[22px] rounded-[3px] shadow-sm" />
        )}
        <span className="hidden sm:inline">{current.name}</span>
        <ChevronDown size={14} className="text-muted-fg" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          {LANGUAGES.map((l) => {
            const Flag = FLAG_ICONS[l.code];
            return (
              <button
                key={l.code}
                onClick={() => select(l.code)}
                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[14px] transition-colors hover:bg-secondary ${
                  l.code === language ? "font-semibold text-primary" : "text-foreground"
                }`}
              >
                {Flag && <Flag className="h-4 w-[22px] rounded-[3px] shadow-sm" />} {l.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
