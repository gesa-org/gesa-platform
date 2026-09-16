import SupportGroupsInteractive, { SUPPORT_GROUPS_DIRECTORY_CONTENT_FALLBACK } from "@/components/SupportGroupsInteractive";
import Testimonials from "@/components/home/Testimonials";
import { getPageContent } from "@/lib/content";
import { getSupportGroups, getTestimonials } from "@/lib/queries";
import { resolveEditorPreview } from "@/lib/ui-builder/pageContentResolver";
import EditorPreviewBridge from "@/components/ui-builder/public/EditorPreviewBridge";

// Phase 219 asked for this page's full content to move onto Find Support
// (app/find-your-therapist/page.tsx), leaving this route intentionally
// empty. Phase 222 (this file's own update) — Roy asked for just the
// group-listing/registration flow (SupportGroupsInteractive, the
// `support-groups-list` section id) and the Testimonials section to move
// back here, while the gold PageHero banner and CommunityIntro's "Why GESA
// exists"/pathway cards stay on Find Support (see that page's own comment).
// Route stays live either way — no 404, shared header/footer via the root
// layout — the "Community" nav link now opens a page with real content on
// it again, just less of it than before Phase 219.
//
// Content source note: `component_support_groups_directory`'s labels
// (no-groups message, register/confirm button labels, etc.) are namespaced
// under the "support-groups" UI Builder pageKey, which still points its
// `route` at `/find-your-therapist` (lib/ui-builder/pageRegistry.ts) since
// that pageKey's other two sources (the banner + CommunityIntro) still
// render there — only this one namespace's content actually renders on
// this page now. Flagged in EXECUTION_PLAN.md as a minor, cosmetic-only
// "View live page" link mismatch in the admin UI Builder; the labels
// themselves still resolve, publish, and preview correctly regardless.
export const metadata = {
  title: "Community — GESA",
};

export default async function SupportGroupsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const [directoryContentRaw, groups, testimonials] = await Promise.all([
    getPageContent("component_support_groups_directory", SUPPORT_GROUPS_DIRECTORY_CONTENT_FALLBACK),
    getSupportGroups(),
    getTestimonials(),
  ]);

  const { resolved, isEditorPreview } = await resolveEditorPreview(
    "support-groups",
    { directory: directoryContentRaw } as unknown as Record<string, unknown>,
    searchParams
  );
  const directoryContent = (resolved as unknown as { directory: typeof directoryContentRaw }).directory;

  const page = (
    <div>
      {/* Phase 240 — Roy asked for this section's background to pick up the
          same deep-navy radial gradient used on the Home landing page,
          replacing the plain light page background behind these cards.
          Scoped to this section only (not the Testimonials section below,
          which keeps its light card/text treatment) since every group card
          here is already fully opaque (.charcoal-marble) with its own
          white/gold text — nothing relies on the light background showing
          through, so this is a safe, self-contained color swap. */}
      <section
        id="support-groups-list"
        className="section wrap"
        style={{ background: "radial-gradient(circle at 50% 20%, #152A3B 0%, #0B1623 55%, #07111B 100%)" }}
      >
        <SupportGroupsInteractive groups={groups} content={directoryContent} />
      </section>
      <Testimonials testimonials={testimonials} />
    </div>
  );

  return isEditorPreview ? <EditorPreviewBridge>{page}</EditorPreviewBridge> : page;
}
