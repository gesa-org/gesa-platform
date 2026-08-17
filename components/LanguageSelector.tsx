"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, Loader2 } from "lucide-react";
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

  const currentLabel = LANGUAGES.find((l) => l.code === language)?.label ?? "English";

  return (
    <div className="relative" ref={ref} data-no-translate>
      <button
        onClick={() => setOpen((v) => !v)}
        title={`Language: ${currentLabel}`}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white transition-colors hover:bg-secondary disabled:opacity-60"
        disabled={translating}
      >
        {translating ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 max-h-[360px] w-48 overflow-y-auto rounded-2xl border border-border bg-white shadow-lg">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => select(l.code)}
              className={`block w-full px-4 py-2.5 text-left text-[14px] transition-colors hover:bg-secondary ${
                l.code === language ? "font-semibold text-primary" : "text-foreground"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
