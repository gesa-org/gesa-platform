"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      setLanguageState(saved);
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
      if (profile?.preferred_language && profile.preferred_language !== "en") {
        localStorage.setItem(STORAGE_KEY, profile.preferred_language);
        setLanguageState(profile.preferred_language);
      }
    })();
  }, []);

  const translatePage = useCallback(async (lang: string) => {
    if (lang === "en") return;
    setTranslating(true);
    try {
      const nodes = collectTextNodes(document.body);
      const uniqueTexts = Array.from(new Set(nodes.map((n) => n.textContent || "")));
      if (uniqueTexts.length === 0) return;

      const translatedMap = new Map<string, string>();
      for (let i = 0; i < uniqueTexts.length; i += BATCH_SIZE) {
        const chunk = uniqueTexts.slice(i, i + BATCH_SIZE);
        try {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ texts: chunk, targetLang: lang }),
          });
          if (!res.ok) continue;
          const data = await res.json();
          chunk.forEach((original, idx) => translatedMap.set(original, data.translated?.[idx] ?? original));
        } catch {
          // Skip this chunk — the rest of the page can still translate.
        }
      }

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
