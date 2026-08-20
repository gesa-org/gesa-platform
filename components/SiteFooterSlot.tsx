"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import DonateBand from "@/components/home/DonateBand";
import { useHomeRevealHeight } from "@/components/home/useHomeRevealHeight";

// The footer is rendered once, globally, in app/layout.tsx — every route
// gets it in normal document flow except the home page, which instead gets
// the "footer reveal" treatment (design.md §7.1.1): the donate CTA and the
// footer sit together in a layer that's fixed to the bottom of the viewport,
// visually covered by the home page's own content (see the
// .home-reveal-page__main / __footer-layer rules in globals.css) until the
// visitor scrolls past the reserved space at the end of the Testimonials
// section. This is a home-only modifier on top of the existing global
// Footer, not a second copy of it — every other route is completely
// unaffected and keeps the plain, static footer it always had.
export default function SiteFooterSlot() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const layerRef = useHomeRevealHeight(isHome);

  if (!isHome) return <Footer />;

  return (
    <div ref={layerRef} className="home-reveal-page__footer-layer">
      <div className="home-reveal-page__gift">
        <DonateBand />
      </div>
      <div className="home-reveal-page__footer">
        <Footer />
      </div>
    </div>
  );
}
