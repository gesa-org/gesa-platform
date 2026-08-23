import Paths, { HOME_CONTENT_FALLBACK } from "@/components/home/Paths";
import Stats from "@/components/home/Stats";
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
export default async function Home() {
  const homeContent = await getPageContent("page_home", HOME_CONTENT_FALLBACK);

  return (
    <div className="reveal-page__main flex flex-col">
      <Paths content={homeContent} />
      <Stats />
    </div>
  );
}
