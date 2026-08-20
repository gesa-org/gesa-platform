"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LANGUAGES, RTL_LANGUAGES } from "@/lib/languages";

const SUPPORTED_LANGS = new Set(LANGUAGES.map((l) => l.code));

type TranslationContextValue = {
  language: string;
  translating: boolean;
  setLanguage: (code: string) => void;
};

const TranslationContext = createContext<TranslationContextValue>({
  language: "en",
  translating: false,
  setLanguage: () => {},
});

export const useTranslation = () => useContext(TranslationContext);

const STORAGE_KEY = "gesa-lang";
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "TITLE"]);
const BATCH_SIZE = 100;

// Site-wide, DOM-level translation: walks all visible text on the page and
// swaps it for machine-translated text via /api/translate (Google Cloud
// Translation, cached in Postgres — see lib/translate.ts). This is
// deliberately a DOM-rewrite approach rather than a full i18n rewrite of
// every page/component — it's the only way to hit "translate everything,
// including dynamic DB content like bios and blog posts" without months of
// work, at the cost of two known limitations:
//   1. Content that appears *after* an in-page fetch (e.g. the AI match
//      results in the Find Your Therapist wizard) won't be caught until the
//      next navigation, since there's no MutationObserver here.
//   2. Switching languages always does a full page reload rather than a
//      seamless SPA transition, so we always start from clean, original
//      English DOM before translating — trying to "undo" in-place text
//      mutations across arbitrary React re-renders is far more fragile.
function collectTextNodes(root: Node): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = node.textContent?.trim();
      if (!text) return NodeFilter.FILTER_REJECT;
      let el = node.parentElement;
      while (el) {
        if (SKIP_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
        if (el.hasAttribute("data-no-translate")) return NodeFilter.FILTER_REJECT;
        if (el.isContentEditable) return NodeFilter.FILTER_REJECT;
        el = el.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes: Text[] = [];
  let n: Node | null;
  // eslint-disable-next-line no-cond-assign
  while ((n = walker.nextNode())) nodes.push(n as Text);
  return nodes;
}

export default function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState("en");
  const [translating, setTranslating] = useState(false);
  const pathname = usePathname();
  const appliedKey = useRef<string | null>(null);

  useEffect(() => {
    // Phase 33 — the picker only offers English and Hebrew now, but
    // localStorage or a profile row can still hold one of the languages
    // that used to be selectable before that change. Falling back to
    // English for anything outside the current list keeps the site
    // genuinely limited to the two supported languages rather than quietly
    // still speaking, say, French to whoever picked it months ago.
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      setLanguageState(SUPPORTED_LANGS.has(saved) ? saved : "en");
      return;
    }
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("id", user.id)
        .maybeSingle();
      const preferred = profile?.preferred_language;
      if (preferred && preferred !== "en" && SUPPORTED_LANGS.has(preferred)) {
        localStorage.setItem(STORAGE_KEY, preferred);
        setLanguageState(preferred);
      }
    })();
  }, []);

  // Hebrew reads right-to-left — without this, translated Hebrew text still
  // renders in a left-to-right document, which breaks alignment, punctuation
  // placement, and the browser's own bidi handling of mixed Hebrew/Latin
  // text (names, emails, numbers). This flips the whole document's base
  // direction and updates the lang attribute; components built with
  // directional Tailwind utilities (ml-/mr-, text-left, etc.) don't
  // automatically mirror their layout, so complex multi-column sections may
  // still read visually LTR even once the text itself is Hebrew and
  // RTL-aligned — a real, known limitation of retrofitting RTL onto an
  // LTR-only layout rather than something this fixes silently.
  useEffect(() => {
    document.documentElement.dir = RTL_LANGUAGES.has(language) ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const translatePage = useCallback(async (lang: string) => {
    if (lang === "en") return;
    setTranslating(true);
    try {
      const nodes = collectTextNodes(document.body);
      const uniqueTexts = Array.from(new Set(nodes.map((n) => n.textContent || "")));
      if (uniqueTexts.length === 0) return;

      const chunks: string[][] = [];
      for (let i = 0; i < uniqueTexts.length; i += BATCH_SIZE) {
        chunks.push(uniqueTexts.slice(i, i + BATCH_SIZE));
      }

      // Fire all batches in parallel rather than awaiting them one at a
      // time — each batch is an independent request, so there's no reason
      // to serialize them. On a large page (many unique strings) this cuts
      // total wait time from N sequential round trips down to roughly one.
      const translatedMap = new Map<string, string>();
      await Promise.all(
        chunks.map(async (chunk) => {
          try {
            const res = await fetch("/api/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ texts: chunk, targetLang: lang }),
            });
            if (!res.ok) return;
            const data = await res.json();
            chunk.forEach((original, idx) => translatedMap.set(original, data.translated?.[idx] ?? original));
          } catch {
            // Skip this chunk — the rest of the page can still translate.
          }
        })
      );

      nodes.forEach((node) => {
        const translated = translatedMap.get(node.textContent || "");
        if (translated) node.textContent = translated;
      });
    } finally {
      setTranslating(false);
    }
  }, []);

  useEffect(() => {
    if (language === "en") return;
    // The admin panel is internal-only and not part of the public-facing
    // translation feature. Walking its (often large) tables and firing
    // /api/translate batches on every navigation was making admin pages
    // feel like they'd hung — this is the fix for that. Public pages are
    // unaffected.
    if (pathname?.startsWith("/admin")) return;
    const key = `${pathname}:${language}`;
    if (appliedKey.current === key) return;
    appliedKey.current = key;
    // Let the new route's content finish painting before scanning the DOM.
    const id = setTimeout(() => translatePage(language), 150);
    return () => clearTimeout(id);
  }, [pathname, language, translatePage]);

  const setLanguage = useCallback((code: string) => {
    localStorage.setItem(STORAGE_KEY, code);
    // Always reload — see the note above on why we don't try to translate
    // or restore in place.
    window.location.reload();
  }, []);

  return (
    <TranslationContext.Provider value={{ language, translating, setLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
}
