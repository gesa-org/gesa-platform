"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import DonateBand from "@/components/home/DonateBand";
import { useRevealHeight } from "@/components/layout/useRevealHeight";
import type { FooterContent } from "@/lib/content";

// The footer is rendered once, globally, in app/layout.tsx — most routes
// get it in normal document flow. A specific set of top-level pages instead
// gets the "footer reveal" treatment (design.md §7.1.1): the donate CTA and
// the footer sit together in a layer that's fixed to the bottom of the
// viewport, visually covered by that page's own content (see the
// .reveal-page__main / __footer-layer rules in globals.css) until the
// visitor scrolls past the page's reserved bottom space. This is a modifier
// on top of the existing global Footer, not a second copy of it — routes
// not in REVEAL_ROUTES are completely unaffected and keep the plain, static
// footer they always had.
//
// Phase 29 shipped this for Home only. Phase 34 extended it to About, Our
// Therapists, and Support Groups, per Roy's request. Blog is deliberately
// excluded — it's disabled and redirects to Home (Phase 32), so there's no
// actual page for the effect to apply to; it can be added here in one line
// once Blog has real content and is turned back on. Admin routes are never
// included — the CRM has its own, unrelated needs.
const REVEAL_ROUTES = new Set(["/", "/about", "/therapists", "/support-groups"]);

// footerContent is fetched once in app/layout.tsx (a Server Component) and
// passed down here — this component stays "use client" for usePathname(),
// and a Client Component can't itself import the server-only Supabase
// query used to fetch it.
export default function SiteFooterSlot({ footerContent }: { footerContent?: FooterContent }) {
  const pathname = usePathname();
  const isRevealPage = pathname !== null && REVEAL_ROUTES.has(pathname);
  const layerRef = useRevealHeight(isRevealPage);

  if (!isRevealPage) return <Footer content={footerContent} />;

  return (
    <div ref={layerRef} className="reveal-page__footer-layer">
      <div className="reveal-page__gift">
        <DonateBand />
      </div>
      <div className="reveal-page__footer">
        <Footer content={footerContent} />
      </div>
    </div>
  );
}
