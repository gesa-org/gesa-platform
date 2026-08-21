import { Users } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import TherapistsDirectory, { THERAPISTS_DIRECTORY_CONTENT_FALLBACK } from "@/components/TherapistsDirectory";
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
export default async function TherapistsPage() {
  const [therapists, content, directoryContent] = await Promise.all([
    getActiveTherapists(),
    getPageContent("page_therapists", THERAPISTS_CONTENT_FALLBACK),
    getPageContent("component_therapists_directory", THERAPISTS_DIRECTORY_CONTENT_FALLBACK),
  ]);

  return (
    <div className="reveal-page__main">
      <PageHero icon={Users} eyebrow={content.eyebrow} title={content.title} description={content.description} />
      <section className="section wrap pt-0">
        <TherapistsDirectory therapists={therapists} content={directoryContent} />
      </section>
    </div>
  );
}
