import Paths, { HOME_CONTENT_FALLBACK } from "@/components/home/Paths";
import Stats from "@/components/home/Stats";
import DonateBand from "@/components/home/DonateBand";
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
// Phase 45 added a scroll-linked statement row here (spec section 6),
// between the path cards and the stats band, built from this page's own
// trust-badge and path-card labels.
//
// Phase 51 — Roy flagged that row as redundant: it just repeated text
// already visible a few pixels away (the badges in the hero, the card
// titles below), which read as filler rather than a real design element.
// Replaced it with NewsTicker, a genuinely continuous "news line" marquee
// carrying its own, distinct copy about GESA's purpose/mission
// (`homeContent.purposeTicker` — see the fallback in
// components/home/Paths.tsx, distilled from the About page's existing
// mission/how-it-works copy, not invented). The old HorizontalScroll
// primitive (components/motion/HorizontalScroll.tsx) is left in place,
// unused, since it's a valid general-purpose scroll-linked effect that
// might fit somewhere else later — not deleted per the standing rule on
// removing files from the synced project folder without confirming first.
//
// Phase 74 — Roy asked to remove the NewsTicker row entirely. The
// component file (components/motion/NewsTicker.tsx) and `homeContent.
// purposeTicker`/its Content Manager field are left in place, unused, per
// the same standing rule as HorizontalScroll above — not deleted without
// confirming first.
//
// Phase 75 — DonateBand moved here from the fixed footer-reveal layer (see
// SiteFooterSlot.tsx) so it's a normal, always-visible section instead of
// part of the hidden-until-scroll effect — only the Footer stays inside
// that reveal layer now.
export default async function Home() {
  const homeContent = await getPageContent("page_home", HOME_CONTENT_FALLBACK);

  return (
    <div className="reveal-page__main flex flex-col">
      <Paths content={homeContent} />
      <Stats />
      <DonateBand />
    </div>
  );
}
