import { Users2 } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import SupportGroupsInteractive, { SUPPORT_GROUPS_DIRECTORY_CONTENT_FALLBACK } from "@/components/SupportGroupsInteractive";
import CommunityIntro, { CommunityHeroExtras, COMMUNITY_INTRO_FALLBACK } from "@/components/support-groups/CommunityIntro";
import Testimonials from "@/components/home/Testimonials";
import DonateBand from "@/components/home/DonateBand";
import { getSupportGroups, getTestimonials } from "@/lib/queries";
import { getPageContent, SUPPORT_GROUPS_CONTENT_FALLBACK } from "@/lib/content";

export const revalidate = 60;

// Footer reveal effect (Phase 34 — extended from Home in Phase 29): opted
// into the same fixed donate-CTA + footer layer as Home, About, and Our
// Therapists (see SiteFooterSlot). This page's content is the opaque cover.
//
// Phase 35 — the banner text is Content Manager-editable via site_content
// key "page_support_groups". Round 2 — the registration flow's labels are
// editable too, via key "component_support_groups_directory".
//
// Phase 39 — the "Stories of Healing" testimonials section moved here from
// Home per Roy's request. The component still lives at
// components/home/Testimonials.tsx (the folder name is now a little stale
// since it's no longer Home-only, but the file can't be moved/deleted from
// the synced project folder without confirming first, and it's a generic,
// self-contained component either way — importing it from here works fine
// regardless of which folder it physically sits in). No changes to the
// component itself or to the testimonials data/table.
//
// Phase 47 — banner now uses the gold background treatment (`gold` prop
// on PageHero) per Roy's request; copy/labels/registration flow unchanged.
//
// Phase 107 — Roy sent a wireframe adding a hero buttons/tagline row, a
// "Why GESA exists" mission blurb, and a three-card pathway navigator
// between this banner and the real group-listing/registration flow below.
// Confirmed via AskUserQuestion that the existing SupportGroupsInteractive
// flow stays exactly as it is, just further down the page — so this
// banner's own eyebrow/title/description are untouched, `CommunityIntro`
// is new content inserted after it, and the registration section below
// picked up `id="support-groups-list"` so the new pathway cards' "Explore
// Community" card and the hero's own tagline link can jump straight to it.
export default async function SupportGroupsPage() {
  const [groups, content, directoryContent, communityIntro, testimonials] = await Promise.all([
    getSupportGroups(),
    getPageContent("page_support_groups", SUPPORT_GROUPS_CONTENT_FALLBACK),
    getPageContent("component_support_groups_directory", SUPPORT_GROUPS_DIRECTORY_CONTENT_FALLBACK),
    getPageContent("component_community_intro", COMMUNITY_INTRO_FALLBACK),
    getTestimonials(),
  ]);

  return (
    <div className="reveal-page__main">
      <PageHero gold icon={Users2} eyebrow={content.eyebrow} title={content.title} description={content.description}>
        <CommunityHeroExtras content={communityIntro} />
      </PageHero>
      <CommunityIntro content={communityIntro} />
      <section id="support-groups-list" className="section wrap pt-0">
        <SupportGroupsInteractive groups={groups} content={directoryContent} />
      </section>
      <Testimonials testimonials={testimonials} />

      {/* Phase 75 — DonateBand moved here from the fixed footer-reveal
          layer (see SiteFooterSlot.tsx) so it's a normal, always-visible
          section instead of part of the hidden-until-scroll effect — only
          the Footer stays inside that reveal layer now. */}
      <DonateBand />
    </div>
  );
}
