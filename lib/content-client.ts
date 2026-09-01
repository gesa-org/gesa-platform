"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Client-side counterpart to getPageContent() (lib/content.ts). That
// function assumes a Server Component ancestor can fetch content and pass
// it down as a prop — true for every page-scoped content type so far. Some
// components don't fit that shape: VolunteerApplicationModal is opened from
// VolunteerApplyButton, which itself renders in 4+ unrelated places across
// the site (Footer, About page, Our Therapists sidebar, DonateBand), so
// there's no single ancestor to thread a prop through without invasively
// touching every call site. This hook fetches directly from site_content
// in the browser instead — safe because that table's RLS is public-read
// regardless (Phase 35 comment in lib/queries.ts) — and applies the exact
// same fallback/published contract as getPageContent() so both mechanisms
// behave identically from the admin's point of view.
export function useSiteContent<T extends Record<string, unknown>>(key: string, fallback: T): T {
  const [content, setContent] = useState<T>(fallback);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      try {
        const { data } = await supabase.from("site_content").select("value").eq("key", key).maybeSingle();
        if (cancelled) return;
        const row = data?.value as (Partial<T> & { published?: boolean }) | undefined;
        if (row && row.published !== false) {
          setContent({ ...fallback, ...row });
        }
      } catch {
        // Network/RLS error — stick with the fallback, same as
        // getPageContent()'s try/catch.
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return content;
}
