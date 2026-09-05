import { Users } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import TherapistsDirectory, { THERAPISTS_DIRECTORY_CONTENT_FALLBACK } from "@/components/TherapistsDirectory";
import DonateBand from "@/components/home/DonateBand";
import { getActiveTherapists } from "@/lib/queries";
import { getPageContent, THERAPISTS_CONTENT_FALLBACK } from "@/lib/content";
import { resolveEditorPreview } from "@/lib/ui-builder/pageContentResolver";
import EditorPreviewBridge from "@/components/ui-builder/public/EditorPreviewBridge";
import EditableText from "@/components/ui-builder/public/EditableText";

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
// Phase 135 — the banner (namespace "") and the directory filter sidebar
// (namespace "directory") are merged into one object here so
// resolveEditorPreview() can patch both from a single per-page draft, then
// destructured back apart for the existing JSX below (which is otherwise
// completely unchanged from before this phase).
export default async function TherapistsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const [therapists, contentRaw, directoryContentRaw] = await Promise.all([
    getActiveTherapists(),
    getPageContent("page_therapists", THERAPISTS_CONTENT_FALLBACK),
    getPageContent("component_therapists_directory", THERAPISTS_DIRECTORY_CONTENT_FALLBACK),
  ]);

  const { resolved, isEditorPreview } = await resolveEditorPreview(
    "therapists",
    { ...contentRaw, directory: directoryContentRaw } as unknown as Record<string, unknown>,
    searchParams
  );
  const content = resolved as unknown as typeof contentRaw;
  const directoryContent = (resolved as unknown as { directory: typeof directoryContentRaw }).directory;

  const page = (
    <div className="reveal-page__main">
      <PageHero
        gold
        icon={Users}
        eyebrow={<EditableText contentId="therapists.hero.eyebrow" label="Hero eyebrow" value={content.eyebrow} as="span" />}
        title={<EditableText contentId="therapists.hero.heading" label="Hero heading" value={content.title} as="span" />}
        description={<EditableText contentId="therapists.hero.description" label="Hero description" value={content.description} as="span" />}
      />
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

  return isEditorPreview ? <EditorPreviewBridge>{page}</EditorPreviewBridge> : page;
}
