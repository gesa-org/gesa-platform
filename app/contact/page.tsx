import { Suspense } from "react";
import { Mail } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import ContactForm from "./ContactForm";
import { getPageContent, CONTACT_CONTENT_FALLBACK } from "@/lib/content";
import { resolveEditorPreview } from "@/lib/ui-builder/pageContentResolver";
import EditorPreviewBridge from "@/components/ui-builder/public/EditorPreviewBridge";
import EditableText from "@/components/ui-builder/public/EditableText";
import { GESA_PUBLIC_CONTACT_EMAIL, GESA_PUBLIC_CONTACT_MAILTO } from "@/lib/contact";

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
        {/* Phase 177 — a direct, clickable email option alongside the form,
            for anyone who'd rather not fill it in. Reads from the same
            public contact constant the Footer's mailto link uses (see
            lib/contact.ts), so both always point at the same address. */}
        <p className="mt-6 text-center text-[14px] text-muted-fg">
          Prefer email? Reach us directly at{" "}
          <a href={GESA_PUBLIC_CONTACT_MAILTO} className="font-semibold text-primary underline">
            {GESA_PUBLIC_CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </>
  );

  return isEditorPreview ? <EditorPreviewBridge>{page}</EditorPreviewBridge> : page;
}
