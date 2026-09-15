import { Users2 } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import CommunityIntro, { CommunityHeroExtras, COMMUNITY_INTRO_FALLBACK } from "@/components/support-groups/CommunityIntro";
import DonateBand from "@/components/home/DonateBand";
import { getPageContent, SUPPORT_GROUPS_CONTENT_FALLBACK } from "@/lib/content";
import { getActiveTherapists } from "@/lib/queries";
import { resolveEditorPreview } from "@/lib/ui-builder/pageContentResolver";
import EditorPreviewBridge from "@/components/ui-builder/public/EditorPreviewBridge";
import EditableText from "@/components/ui-builder/public/EditableText";

// Phase 219 — Roy asked for the Community page's (`/support-groups`) full
// content to move onto Find Support (`/find-your-therapist`, empty at the
// time of this request), transferred exactly as it existed. This is a
// straight move of app/support-groups/page.tsx's body onto this file.
//
// Phase 222 — Roy asked for just the group-listing (SupportGroupsInteractive,
// the `support-groups-list` section) and the Testimonials section to move
// back onto app/support-groups/page.tsx, leaving the gold PageHero banner
// and CommunityIntro's "Why GESA exists"/pathway cards here. This page keeps
// the same "support-groups" pageKey/content sources for the banner + intro
// (those didn't move), and no longer fetches `getSupportGroups()`/
// `getTestimonials()` or renders `SupportGroupsInteractive`/`Testimonials` —
// see app/support-groups/page.tsx's own Phase 222 comment for where that
// content lives now.
export const metadata = {
  title: "Find Support — GESA",
  description:
    "Charity-supported and professional community services and pathways from the GESA community.",
};

// Footer reveal effect — this page still owns SiteFooterSlot's reveal
// treatment (see that file's own comment); unaffected by the Phase 222
// section move since this page still has real content on it.
export default async function FindYourTherapistPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const [communityContentRaw, communityIntroRaw, therapists] = await Promise.all([
    getPageContent("page_support_groups", SUPPORT_GROUPS_CONTENT_FALLBACK),
    getPageContent("component_community_intro", COMMUNITY_INTRO_FALLBACK),
    getActiveTherapists(),
  ]);

  const { resolved, isEditorPreview } = await resolveEditorPreview(
    "support-groups",
    { ...communityContentRaw, intro: communityIntroRaw } as unknown as Record<string, unknown>,
    searchParams
  );
  const communityContent = resolved as unknown as typeof communityContentRaw;
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
      <DonateBand />
    </div>
  );

  return isEditorPreview ? <EditorPreviewBridge>{page}</EditorPreviewBridge> : page;
}
