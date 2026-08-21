import Paths, { HOME_CONTENT_FALLBACK } from "@/components/home/Paths";
import Stats from "@/components/home/Stats";
import Testimonials from "@/components/home/Testimonials";
import { getTestimonials } from "@/lib/queries";
import { getPageContent } from "@/lib/content";

export const revalidate = 300;

// Footer reveal effect (design.md §7.1.1): this page's content is the
// "cover" — opaque, on top (z-index 2), with a reserved bottom margin sized
// to match the donate CTA + footer that sit underneath it in a fixed layer
// (rendered globally in app/layout.tsx via SiteFooterSlot — see
// REVEAL_ROUTES there for which pages opt in). As the visitor scrolls past
// the end of "Stories of healing," the reserved margin runs out and the CTA
// + footer are uncovered. The donate band used to live at the bottom of this
// page in normal flow — it's now rendered as part of that reveal layer
// instead, so it appears right before the footer rather than as a normal
// section here.
export default async function Home() {
  const [testimonials, homeContent] = await Promise.all([
    getTestimonials(),
    getPageContent("page_home", HOME_CONTENT_FALLBACK),
  ]);

  return (
    <div className="reveal-page__main flex flex-col">
      <Paths content={homeContent} />
      <Stats />
      <Testimonials testimonials={testimonials} />
    </div>
  );
}
