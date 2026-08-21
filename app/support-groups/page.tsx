import { Users2 } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import SupportGroupsInteractive, { SUPPORT_GROUPS_DIRECTORY_CONTENT_FALLBACK } from "@/components/SupportGroupsInteractive";
import { getSupportGroups } from "@/lib/queries";
import { getPageContent, SUPPORT_GROUPS_CONTENT_FALLBACK } from "@/lib/content";

export const revalidate = 60;

// Footer reveal effect (Phase 34 — extended from Home in Phase 29): opted
// into the same fixed donate-CTA + footer layer as Home, About, and Our
// Therapists (see SiteFooterSlot). This page's content is the opaque cover.
//
// Phase 35 — the banner text is Content Manager-editable via site_content
// key "page_support_groups". Round 2 — the registration flow's labels are
// editable too, via key "component_support_groups_directory".
export default async function SupportGroupsPage() {
  const [groups, content, directoryContent] = await Promise.all([
    getSupportGroups(),
    getPageContent("page_support_groups", SUPPORT_GROUPS_CONTENT_FALLBACK),
    getPageContent("component_support_groups_directory", SUPPORT_GROUPS_DIRECTORY_CONTENT_FALLBACK),
  ]);

  return (
    <div className="reveal-page__main">
      <PageHero icon={Users2} eyebrow={content.eyebrow} title={content.title} description={content.description} />
      <section className="section wrap pt-0">
        <SupportGroupsInteractive groups={groups} content={directoryContent} />
      </section>
    </div>
  );
}
