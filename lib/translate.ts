import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";

const GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2";

function hash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

// Translates a batch of strings into targetLang, backed by a Postgres cache
// (translation_cache) so identical strings are only ever sent to the
// Google Translate API once per language — this keeps live, site-wide
// translation affordable at GESA's traffic level. Falls back to returning
// the original text untranslated (never throws) if the API key is missing
// or a call fails, so a translation hiccup never breaks the page.
export async function translateBatch(texts: string[], targetLang: string): Promise<string[]> {
  if (targetLang === "en" || texts.length === 0) return texts;

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    console.warn("[translate] GOOGLE_TRANSLATE_API_KEY not set — returning original text");
    return texts;
  }

  const supabase = await createClient();
  const hashes = texts.map(hash);

  const { data: cached } = await supabase
    .from("translation_cache")
    .select("source_hash, translated_text")
    .eq("target_lang", targetLang)
    .in("source_hash", hashes);

  const cacheMap = new Map((cached ?? []).map((c) => [c.source_hash, c.translated_text]));

  const missing: { text: string; hash: string; index: number }[] = [];
  const results = texts.map((text, i) => {
    const cachedValue = cacheMap.get(hashes[i]);
    if (cachedValue !== undefined) return cachedValue;
    missing.push({ text, hash: hashes[i], index: i });
    return text;
  });

  if (missing.length === 0) return results;

  try {
    const res = await fetch(`${GOOGLE_TRANSLATE_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: missing.map((m) => m.text),
        target: targetLang,
        source: "en",
        format: "text",
      }),
    });

    if (!res.ok) throw new Error(`Google Translate API returned ${res.status}`);
    const json = await res.json();
    const translations: { translatedText: string }[] = json?.data?.translations ?? [];

    const rowsToCache: { source_hash: string; target_lang: string; source_text: string; translated_text: string }[] = [];

    missing.forEach((m, i) => {
      const translated = translations[i]?.translatedText;
      if (translated) {
        results[m.index] = translated;
        rowsToCache.push({
          source_hash: m.hash,
          target_lang: targetLang,
          source_text: m.text,
          translated_text: translated,
        });
      }
    });

    if (rowsToCache.length > 0) {
      // Best-effort cache write — ignore failures (e.g. a race on the
      // unique constraint from a concurrent request translating the same
      // text at the same time).
      await supabase.from("translation_cache").upsert(rowsToCache, { onConflict: "source_hash,target_lang" });
    }

    return results;
  } catch (err) {
    console.error("[translate] Google Translate API call failed, returning original text", err);
    return results;
  }
}
