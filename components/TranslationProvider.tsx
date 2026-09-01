"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LANGUAGES, RTL_LANGUAGES } from "@/lib/languages";
import { lookupHeDictionary } from "@/lib/translations/he";

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

// Phase 115 — the DOM-rewrite translator above only ever walked Text nodes,
// so a purely-attribute string (an <input placeholder>, an icon-only
// button's aria-label, a native title tooltip) never translated no matter
// how complete the dictionary was — a real gap flagged in the i18n audit
// (e.g. VolunteerApplicationModal's phone-number placeholder, Modal's
// "Close" aria-label). This mirrors the existing text-node approach one
// level down: collect the current value of each attribute in
// TRANSLATABLE_ATTRS, translate it exactly like a text node's content
// (same dictionary-first-then-API path, same dedup Set), and cache the
// original so switching back to English restores it — via originalAttrRef,
// the attribute equivalent of originalTextRef.
const TRANSLATABLE_ATTRS = ["placeholder", "aria-label", "title"] as const;
type TranslatableAttr = (typeof TRANSLATABLE_ATTRS)[number];

function collectTranslatableAttributes(root: ParentNode): { el: Element; attr: TranslatableAttr; value: string }[] {
  const found: { el: Element; attr: TranslatableAttr; value: string }[] = [];
  const elements = root.querySelectorAll(`[${TRANSLATABLE_ATTRS.join("],[")}]`);
  elements.forEach((el) => {
    if (el.closest("[data-no-translate]")) return;
    TRANSLATABLE_ATTRS.forEach((attr) => {
      const value = el.getAttribute(attr);
      if (value && value.trim()) found.push({ el, attr, value });
    });
  });
  return found;
}

// Site-wide, DOM-level translation: walks all visible text on the page and
// swaps it for machine-translated text via /api/translate (Google Cloud
// Translation, cached in Postgres — see lib/translate.ts). This is
// deliberately a DOM-rewrite approach rather than a full i18n rewrite of
// every page/component — it's the only way to hit "translate everything,
// including dynamic DB content like bios and blog posts" without months of
// work, at the cost of one known limitation:
//   Content that appears *after* an in-page fetch (e.g. the AI match
//   results in the Find Your Therapist wizard) won't be caught until the
//   next navigation, since there's no MutationObserver here.
//
// Phase 52 — switching languages used to always force a full page reload
// (`window.location.reload()`), specifically to avoid having to "undo"
// in-place text mutations across arbitrary React re-renders. Roy sent a
// reference video of another org's site where the switch is instant and
// reload-free in both directions, so this now does that: `originalTextRef`
// (a Map<Text, string>) records each text node's real English content the
// first time it's translated, and switching back to English just restores
// those cached originals in place — no reload, no re-fetch. Switching to
// Hebrew still calls /api/translate exactly as before. The one edge this
// doesn't cover: if a node that was translated gets unmounted/replaced by
// an unrelated React re-render before you switch back, its cache entry is
// simply skipped (`node.isConnected` check) rather than erroring.
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
  // Phase 52 — records each text node's real English content the first
  // time it gets translated, so switching back to English can restore it
  // in place instead of reloading. Cleared out (not just left stale) once
  // a revert actually happens — see translatePage's "en" branch below.
  const originalTextRef = useRef<Map<Text, string>>(new Map());
  // Phase 115 — attribute equivalent of originalTextRef above. Keyed by
  // element (not by a single string) since one element can have more than
  // one translatable attribute (e.g. an icon button with both a
  // placeholder and an aria-label).
  const originalAttrRef = useRef<Map<Element, Partial<Record<TranslatableAttr, string>>>>(new Map());

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
  // direction and updates the lang attribute. Flexbox rows built with plain
  // `flex` (no explicit direction override) do auto-mirror under `dir="rtl"`
  // per the CSS spec — e.g. a "label, then icon" row visually becomes
  // "icon, then label" reading right-to-left, no extra work needed — and
  // Phase 52 added a global rule (app/globals.css, targeting lucide's
  // auto-applied `.lucide-arrow-*`/`.lucide-chevron-*` classes) that mirrors
  // directional arrow/chevron icons themselves so they point the correct
  // way. What's still a real, known limitation: components using directional
  // Tailwind utilities (ml-/mr-, pl-/pr-, text-left, absolute left-*/right-*
  // positioning) rather than logical properties don't auto-mirror, so some
  // multi-column or absolutely-positioned sections may still read visually
  // LTR-ish even once the text itself is Hebrew and RTL-aligned. Converting
  // every such utility site-wide to logical properties (ms-/me-, etc.) is a
  // real, larger follow-up, not something this phase silently attempted.
  useEffect(() => {
    document.documentElement.dir = RTL_LANGUAGES.has(language) ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const translatePage = useCallback(async (lang: string) => {
    if (lang === "en") {
      // Phase 52 — revert in place: restore whatever original English text
      // was cached for each node still actually in the DOM (a node from a
      // page/section that's since unmounted is just skipped, not an
      // error), then clear the cache so the next forward translation
      // starts clean.
      originalTextRef.current.forEach((original, node) => {
        if (node.isConnected) node.textContent = original;
      });
      originalTextRef.current.clear();
      // Phase 115 — revert translated attributes the same way, in place.
      originalAttrRef.current.forEach((attrs, el) => {
        if (!el.isConnected) return;
        (Object.entries(attrs) as [TranslatableAttr, string][]).forEach(([attr, original]) => {
          el.setAttribute(attr, original);
        });
      });
      originalAttrRef.current.clear();
      return;
    }
    setTranslating(true);
    try {
      const nodes = collectTextNodes(document.body);
      // Cache each node's real English text before anything gets mutated —
      // only the first time we see a given node, so re-translating (e.g.
      // switching he -> en -> he again) doesn't overwrite the cached
      // original with already-translated text.
      nodes.forEach((node) => {
        if (!originalTextRef.current.has(node)) {
          originalTextRef.current.set(node, node.textContent || "");
        }
      });
      // Phase 115 — same caching pass for attributes.
      const attrEntries = collectTranslatableAttributes(document.body);
      attrEntries.forEach(({ el, attr, value }) => {
        const existing = originalAttrRef.current.get(el);
        if (existing && existing[attr] !== undefined) return;
        originalAttrRef.current.set(el, { ...existing, [attr]: value });
      });
      const uniqueTexts = Array.from(
        new Set([...nodes.map((n) => n.textContent || ""), ...attrEntries.map((a) => a.value)])
      );
      if (uniqueTexts.length === 0) return;

      // Phase 53 — check the bundled dictionary (lib/translations/he.ts)
      // first, entirely client-side, before touching the network. This is
      // what makes Hebrew actually work with no Google Translate API key
      // configured: the dictionary covers the static marketing copy that
      // makes up most of the site, so those strings translate instantly
      // and for free, and only whatever's left over (dynamic/DB content,
      // or copy the dictionary doesn't happen to cover yet) goes to
      // /api/translate — which itself still no-ops to the original text
      // if there's genuinely no API key set, exactly as before.
      const translatedMap = new Map<string, string>();
      const remaining: string[] = [];
      if (lang === "he") {
        uniqueTexts.forEach((text) => {
          const dictHit = lookupHeDictionary(text);
          if (dictHit !== undefined) translatedMap.set(text, dictHit);
          else remaining.push(text);
        });
      } else {
        remaining.push(...uniqueTexts);
      }

      if (remaining.length > 0) {
        const chunks: string[][] = [];
        for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
          chunks.push(remaining.slice(i, i + BATCH_SIZE));
        }

        // Fire all batches in parallel rather than awaiting them one at a
        // time — each batch is an independent request, so there's no
        // reason to serialize them. On a large page (many unique strings)
        // this cuts total wait time from N sequential round trips down to
        // roughly one.
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
      }

      nodes.forEach((node) => {
        const translated = translatedMap.get(node.textContent || "");
        if (translated) node.textContent = translated;
      });
      // Phase 115 — apply translated attribute values the same way.
      attrEntries.forEach(({ el, attr, value }) => {
        const translated = translatedMap.get(value);
        if (translated) el.setAttribute(attr, translated);
      });
    } finally {
      setTranslating(false);
    }
  }, []);

  useEffect(() => {
    // The admin panel is internal-only and not part of the public-facing
    // translation feature. Walking its (often large) tables and firing
    // /api/translate batches on every navigation was making admin pages
    // feel like they'd hung — this is the fix for that. Public pages are
    // unaffected.
    if (pathname?.startsWith("/admin")) return;
    const key = `${pathname}:${language}`;
    if (appliedKey.current === key) return;
    appliedKey.current = key;
    // Runs for "en" too now (Phase 52), so switching back to English
    // actually triggers translatePage's revert branch above instead of
    // being skipped entirely. Still let the route's content finish
    // painting before touching the DOM either way.
    const id = setTimeout(() => translatePage(language), 150);
    return () => clearTimeout(id);
  }, [pathname, language, translatePage]);

  const setLanguage = useCallback((code: string) => {
    localStorage.setItem(STORAGE_KEY, code);
    // Phase 52 — no more reload. The effect above picks up the state
    // change and calls translatePage, which now handles both directions
    // (translate to Hebrew, or restore cached original English) in place.
    setLanguageState(code);
  }, []);

  return (
    <TranslationContext.Provider value={{ language, translating, setLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
}
