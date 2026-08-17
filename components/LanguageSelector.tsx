"use client";

import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Preference control only — no site-wide translation. Selecting a language
// updates profiles.preferred_language for signed-in users (persists across
// devices/sessions); signed-out visitors just get a local UI preference for
// the current tab, which resets on reload since there's nowhere to save it.
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "he", label: "עברית" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

export default function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("en");
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.preferred_language) setCurrent(profile.preferred_language);
    })();
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function select(code: string) {
    setCurrent(code);
    setOpen(false);
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ preferred_language: code }).eq("id", user.id);
    }
    setSaving(false);
  }

  const currentLabel = LANGUAGES.find((l) => l.code === current)?.label ?? "English";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={`Preferred language: ${currentLabel}`}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white transition-colors hover:bg-secondary disabled:opacity-60"
        disabled={saving}
      >
        <Globe size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => select(l.code)}
              className={`block w-full px-4 py-2.5 text-left text-[14px] transition-colors hover:bg-secondary ${
                l.code === current ? "font-semibold text-primary" : "text-foreground"
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
