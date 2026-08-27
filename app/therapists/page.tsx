import { Users } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import TherapistsDirectory, { THERAPISTS_DIRECTORY_CONTENT_FALLBACK } from "@/components/TherapistsDirectory";
import DonateBand from "@/components/home/DonateBand";
import { getActiveTherapists } from "@/lib/queries";
import { getPageContent, THERAPISTS_CONTENT_FALLBACK } from "@/lib/content";

export const revalidate = 60;

// Footer reveal effect (Phase 34 — extended from Home in Phase 29): opted
// into the same fixed donate-CTA + footer layer as Home, About, and Support
// Groups (see SiteFooterSlot). This page's content is the opaque cover.
//
// Phase 35 — the banner text is Content Manager-editable via site_content
// key "page_therapists". Round 2 — the filter sidebar's labels are editable
// too, via key "component_therapists_directory".
//
// Phase 47 — banner now uses the gold background treatment (`gold` prop
// on PageHero) per Roy's request; copy/labels/filters unchanged.
export default async function TherapistsPage() {
  const [therapists, content, directoryContent] = await Promise.all([
    getActiveTherapists(),
    getPageContent("page_therapists", THERAPISTS_CONTENT_FALLBACK),
    getPageContent("component_therapists_directory", THERAPISTS_DIRECTORY_CONTENT_FALLBACK),
  ]);

  return (
    <div className="reveal-page__main">
      <PageHero gold icon={Users} eyebrow={content.eyebrow} title={content.title} description={content.description} />
      {/* Phase 55 — Roy sent a reference screenshot showing this section on
          a warm cream background instead of the page's usual cool ivory
          (--background). Scoped to just this section (bg-clay-soft, the
          same pale-gold-wash token the gold-banner era already introduced
          in app/globals.css) rather than changing --background globally,
          since the ask was specifically about this section and About's
          founders section, not every page site-wide.
          Phase 55 follow-up — the background color was first put on the
          same element as `wrap` (max-width 1160px, centered), which made
          it fill only that centered box instead of the full viewport width
          — exactly the "cut / certain area only" Roy flagged. Fixed by
          moving `bg-clay-soft` to this outer, full-width <section>, with
          `wrap` now on its own inner <div> that only constrains the
          *content's* width, not the color. */}
      <section className="section pt-0 bg-clay-soft">
        <div className="wrap">
          <TherapistsDirectory therapists={therapists} content={directoryContent} />
        </div>
      </section>

      {/* Phase 75 — DonateBand moved here from the fixed footer-reveal
          layer (see SiteFooterSlot.tsx) so it's a normal, always-visible
          section instead of part of the hidden-until-scroll effect — only
          the Footer stays inside that reveal layer now. */}
      <DonateBand />
    </div>
  );
}
