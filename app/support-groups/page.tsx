import { Users2 } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import SupportGroupsInteractive, { SUPPORT_GROUPS_DIRECTORY_CONTENT_FALLBACK } from "@/components/SupportGroupsInteractive";
import CommunityIntro, { CommunityHeroExtras, COMMUNITY_INTRO_FALLBACK } from "@/components/support-groups/CommunityIntro";
import Testimonials from "@/components/home/Testimonials";
import DonateBand from "@/components/home/DonateBand";
import { getPageContent, SUPPORT_GROUPS_CONTENT_FALLBACK } from "@/lib/content";
import { getActiveTherapists, getSupportGroups, getTestimonials } from "@/lib/queries";
import { resolveEditorPreview } from "@/lib/ui-builder/pageContentResolver";
import EditorPreviewBridge from "@/components/ui-builder/public/EditorPreviewBridge";
import EditableText from "@/components/ui-builder/public/EditableText";

// Phase 218 — reverting Phase 217. Roy asked to undo that phase entirely, so
// this page is restored to its Phase 216 state: the full gold "Community"
// banner (Charity/Professional Services CTAs), the "Why GESA exists"
// mission blurb + three-card pathway navigator, the real support-group
// listing/registration flow, "Stories of Healing" testimonials, and its own
// closing DonateBand — all of which Phase 217 had moved onto
// app/find-your-therapist/page.tsx and dropped the duplicate DonateBand
// call. Same "support-groups" pageKey, same three content sources
// ("page_support_groups", "component_support_groups_directory",
// "component_community_intro"), same component set as before — nothing
// changed beyond restoring this file to render here again.
export const metadata = {
  title: "Community — GESA",
  description:
    "Charity-supported and professional community services, support groups, and stories of healing from the GESA community.",
};

// Footer reveal effect — Phase 218 restores "/support-groups" to
// SiteFooterSlot's REVEAL_ROUTES to match this page owning the reveal
// treatment again (see that file's own Phase 218 comment).
export default async function SupportGroupsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const [communityContentRaw, directoryContentRaw, communityIntroRaw, therapists, groups, testimonials] =
    await Promise.all([
      getPageContent("page_support_groups", SUPPORT_GROUPS_CONTENT_FALLBACK),
      getPageContent("component_support_groups_directory", SUPPORT_GROUPS_DIRECTORY_CONTENT_FALLBACK),
      getPageContent("component_community_intro", COMMUNITY_INTRO_FALLBACK),
      getActiveTherapists(),
      getSupportGroups(),
      getTestimonials(),
    ]);

  const { resolved, isEditorPreview } = await resolveEditorPreview(
    "support-groups",
    { ...communityContentRaw, directory: directoryContentRaw, intro: communityIntroRaw } as unknown as Record<string, unknown>,
    searchParams
  );
  const communityContent = resolved as unknown as typeof communityContentRaw;
  const directoryContent = (resolved as unknown as { directory: typeof directoryContentRaw }).directory;
  const communityIntro = (resolved as unknown as { intro: typeof communityIntroRaw }).intro;

  const page = (
    <div className="reveal-page__main">
      <PageHero
        gold
        icon={Users2}
        eyebrow={<EditableText contentId="supportGroups.hero.eyebrow" label="Hero eyebrow" value={communityContent.eyebrow} as="span" />}
        title={<EditableText contentId="supportGroups.hero.heading" label="Hero heading" value={communityContent.title} as="span" />}
        description={<EditableText contentId="supportGroups.hero.description" label="Hero description" value={communityContent.description} as="span" />}
      >
        <CommunityHeroExtras content={communityIntro} therapists={therapists} />
      </PageHero>
      <CommunityIntro content={communityIntro} />
      <section id="support-groups-list" className="section wrap pt-0">
        <SupportGroupsInteractive groups={groups} content={directoryContent} />
      </section>
      <Testimonials testimonials={testimonials} />
      <DonateBand />
    </div>
  );

  return isEditorPreview ? <EditorPreviewBridge>{page}</EditorPreviewBridge> : page;
}
