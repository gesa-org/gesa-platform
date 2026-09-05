import { HelpCircle } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import FaqAccordion from "@/components/FaqAccordion";
import { getFaqs } from "@/lib/queries";
import { getPageContent, FAQ_CONTENT_FALLBACK } from "@/lib/content";
import { resolveEditorPreview } from "@/lib/ui-builder/pageContentResolver";
import EditorPreviewBridge from "@/components/ui-builder/public/EditorPreviewBridge";
import EditableText from "@/components/ui-builder/public/EditableText";

export const revalidate = 300;

// Phase 35 — banner text is Content Manager-editable via site_content key
// "page_faq". Phase 135 — also visually editable via the Page Editor's
// click-to-select canvas. The actual Q&A list below is real, reorderable
// data (the `faqs` table) managed through Content Manager's FaqManager
// repeater UI — that stays exactly as it is; the visual editor's own
// repeater field type isn't built yet (see pageRegistry.ts's Phase 135
// comment on ContentFieldType).
export default async function FaqPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const [faqs, contentRaw] = await Promise.all([getFaqs(), getPageContent("page_faq", FAQ_CONTENT_FALLBACK)]);
  const { resolved, isEditorPreview } = await resolveEditorPreview("faq", contentRaw as unknown as Record<string, unknown>, searchParams);
  const content = resolved as unknown as typeof contentRaw;

  const page = (
    <>
      <PageHero
        icon={HelpCircle}
        eyebrow={<EditableText contentId="faq.hero.eyebrow" label="Hero eyebrow" value={content.eyebrow} as="span" />}
        title={<EditableText contentId="faq.hero.heading" label="Hero heading" value={content.title} as="span" />}
        description={content.description ? <EditableText contentId="faq.hero.description" label="Hero description" value={content.description} as="span" /> : undefined}
        narrow
      />
      <section className="section narrow pt-0">
        <FaqAccordion faqs={faqs} />
      </section>
    </>
  );

  return isEditorPreview ? <EditorPreviewBridge>{page}</EditorPreviewBridge> : page;
}
