import Paths, { HOME_CONTENT_FALLBACK } from "@/components/home/Paths";
import Stats from "@/components/home/Stats";
import HorizontalScroll from "@/components/motion/HorizontalScroll";
import { getPageContent } from "@/lib/content";

export const revalidate = 300;

// Footer reveal effect (design.md §7.1.1): this page's content is the
// "cover" — opaque, on top (z-index 2), with a reserved bottom margin sized
// to match the donate CTA + footer that sit underneath it in a fixed layer
// (rendered globally in app/layout.tsx via SiteFooterSlot — see
// REVEAL_ROUTES there for which pages opt in). As the visitor scrolls past
// the end of this page's content, the reserved margin runs out and the CTA
// + footer are uncovered. The donate band used to live at the bottom of this
// page in normal flow — it's now rendered as part of that reveal layer
// instead, so it appears right before the footer rather than as a normal
// section here.
//
// The "Stories of Healing" testimonials section (components/home/
// Testimonials.tsx) was removed from this page per Roy's request. The
// component file itself wasn't deleted (it's sitting unused) since it
// can't be removed from the synced project folder without confirming with
// Roy first — say the word and I'll ask him to delete it, or repurpose it
// elsewhere. getTestimonials()/testimonials data fetch removed along with
// it since nothing on this page reads it anymore; the "testimonials" table
// and lib/queries.ts's getTestimonials() are untouched in case they're
// wanted again later.
// Phase 45 — added the reusable horizontal scroll-linked statement here
// (spec section 6), between the path cards and the stats band. Its words
// are pulled directly from this page's own existing, already-published
// copy (the three trust badges + the three path titles from `homeContent`
// — see components/home/Paths.tsx) rather than any new or invented text,
// per the spec's "must come from GESA's existing content or approved GESA
// copy" rule. Disables its own scroll-linked movement on mobile
// automatically (see components/motion/HorizontalScroll.tsx).
export default async function Home() {
  const homeContent = await getPageContent("page_home", HOME_CONTENT_FALLBACK);

  const horizontalStatement = [
    homeContent.badge1Label,
    homeContent.badge2Label,
    homeContent.badge3Label,
    homeContent.card1Title,
    homeContent.card2Title,
    homeContent.card3Title,
  ];

  return (
    <div className="reveal-page__main flex flex-col">
      <Paths content={homeContent} />
      <HorizontalScroll items={horizontalStatement} className="border-y border-border bg-muted py-10 md:py-14" />
      <Stats />
    </div>
  );
}
