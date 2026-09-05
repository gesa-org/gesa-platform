import { Suspense } from "react";
import { Mail } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import ContactForm from "./ContactForm";
import { getPageContent, CONTACT_CONTENT_FALLBACK } from "@/lib/content";
import { resolveEditorPreview } from "@/lib/ui-builder/pageContentResolver";
import EditorPreviewBridge from "@/components/ui-builder/public/EditorPreviewBridge";
import EditableText from "@/components/ui-builder/public/EditableText";

export const metadata = {
  title: "Contact — GESA",
};

// Phase 35 — banner text is Content Manager-editable via site_content key
// "page_contact". Phase 135 — also visually editable via the Page Editor's
// click-to-select canvas; ContactForm's own fields/consent text/submit
// logic are untouched (see CONTENT_GUIDE.md's existing form-field
// carve-out).
export default async function ContactPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const contentRaw = await getPageContent("page_contact", CONTACT_CONTENT_FALLBACK);
  const { resolved, isEditorPreview } = await resolveEditorPreview("contact", contentRaw as unknown as Record<string, unknown>, searchParams);
  const content = resolved as unknown as typeof contentRaw;

  const page = (
    <>
      <PageHero
        icon={Mail}
        eyebrow={<EditableText contentId="contact.hero.eyebrow" label="Hero eyebrow" value={content.eyebrow} as="span" />}
        title={<EditableText contentId="contact.hero.heading" label="Hero heading" value={content.title} as="span" />}
        description={<EditableText contentId="contact.hero.description" label="Hero description" value={content.description} as="span" />}
        narrow
      />
      <section className="section narrow pt-0">
        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </section>
    </>
  );

  return isEditorPreview ? <EditorPreviewBridge>{page}</EditorPreviewBridge> : page;
}
