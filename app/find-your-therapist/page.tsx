import { Sparkle } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import FindSupportFlow from "@/components/find-support/FindSupportFlow";
import { getActiveClinicLocations } from "@/lib/queries";
import { getPageContent, FIND_YOUR_THERAPIST_CONTENT_FALLBACK } from "@/lib/content";
import { resolveEditorPreview } from "@/lib/ui-builder/pageContentResolver";
import EditorPreviewBridge from "@/components/ui-builder/public/EditorPreviewBridge";
import EditableText from "@/components/ui-builder/public/EditableText";

// Phase 144 — Roy asked for consistent "Find Support" wording site-wide
// (nav label, this page's title, and the About page's CTA all needed to
// read the same thing, to make clear this is the one canonical entry point
// for the AI matching flow). The browser-tab/SEO title is the one part of
// this page that isn't admin-editable via Content Manager, so it's set
// directly here rather than through site_content.
export const metadata = {
  title: "Find Support — GESA",
  description: "A short, guided match to a verified volunteer therapist based on your needs and preferences.",
};

// Phase 80 round 2 — this hero banner had no Content Manager wiring at all;
// now reads from "page_find_your_therapist" via the same SimplePageContent/
// getPageContent pattern every other banner-only page uses (see
// lib/content.ts's SIMPLE_PAGE_ENTRIES registry). Phase 140 — also visually
// editable via the Page Editor's click-to-select canvas (this page had no
// pageRegistry.ts entry at all until this phase — a real gap a site-wide
// audit found, not a deliberate exclusion like the legal pages).
export default async function FindYourTherapistPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const [clinicLocations, contentRaw] = await Promise.all([
    getActiveClinicLocations(),
    getPageContent("page_find_your_therapist", FIND_YOUR_THERAPIST_CONTENT_FALLBACK),
  ]);
  const { resolved, isEditorPreview } = await resolveEditorPreview(
    "find-your-therapist",
    contentRaw as unknown as Record<string, unknown>,
    searchParams
  );
  const content = resolved as unknown as typeof contentRaw;

  const page = (
    <>
      <PageHero
        icon={Sparkle}
        eyebrow={<EditableText contentId="find-your-therapist.hero.eyebrow" label="Hero eyebrow" value={content.eyebrow} as="span" />}
        title={<EditableText contentId="find-your-therapist.hero.heading" label="Hero heading" value={content.title} as="span" />}
        description={<EditableText contentId="find-your-therapist.hero.description" label="Hero description" value={content.description} as="span" />}
      />
      <section className="section wrap pt-0">
        <FindSupportFlow clinicLocations={clinicLocations} />
      </section>
    </>
  );

  return isEditorPreview ? <EditorPreviewBridge>{page}</EditorPreviewBridge> : page;
}
