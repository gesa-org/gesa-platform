"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LANGUAGES } from "@/lib/languages";
import { useTranslation } from "@/components/TranslationProvider";

// The dropdown itself; actual page translation is handled by
// TranslationProvider (components/TranslationProvider.tsx), which this just
// calls into. Still persists the choice to profiles.preferred_language for
// signed-in users so it follows them across devices.
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

  return (
    <div className="relative" ref={ref} data-no-translate>
      {/* Shows the active language (flag + name) directly in the header,
          matching the reference site Roy pointed to, rather than hiding it
          behind a generic globe icon that gave no indication of the current
          selection at a glance. */}
      <button
        onClick={() => setOpen((v) => !v)}
        title={`Language: ${current.name}`}
        className="flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-2 text-[14px] font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
        disabled={translating}
      >
        {translating ? <Loader2 size={16} className="animate-spin" /> : <span aria-hidden="true">{current.flag}</span>}
        <span className="hidden sm:inline">{current.name}</span>
        <ChevronDown size={14} className="text-muted-fg" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => select(l.code)}
              className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[14px] transition-colors hover:bg-secondary ${
                l.code === language ? "font-semibold text-primary" : "text-foreground"
              }`}
            >
              <span aria-hidden="true">{l.flag}</span> {l.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
