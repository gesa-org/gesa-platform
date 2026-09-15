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

// Phase 219 — Roy asked for the Community page's (`/support-groups`) full
// content to move onto Find Support (`/find-your-therapist`, empty at the
// time of this request), transferred exactly as it existed — no rewrite,
// no merge with any other page's content, no new transition copy, same
// section order/styling/components/functionality. This is a straight move
// of app/support-groups/page.tsx's body onto this file: same components
// (PageHero, CommunityHeroExtras, CommunityIntro, SupportGroupsInteractive,
// Testimonials, DonateBand), same content sources/fallbacks
// ("page_support_groups"/"component_support_groups_directory"/
// "component_community_intro", "support-groups" pageKey), same
// `support-groups-list` section id (CommunityIntro's own in-page anchors
// already point at it — a self-contained component, so moving it needed no
// internal changes). `/support-groups` is now intentionally empty (see
// that page's own Phase 219 comment) — route stays live, shared header/
// footer unaffected.
export const metadata = {
  title: "Find Support — GESA",
  description:
    "Charity-supported and professional community services, support groups, and stories of healing from the GESA community.",
};

// Footer reveal effect — Phase 219 moves "/find-your-therapist" into
// SiteFooterSlot's REVEAL_ROUTES (and drops "/support-groups") to match
// this page owning the reveal treatment now (see that file's own comment).
export default async function FindYourTherapistPage({
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
