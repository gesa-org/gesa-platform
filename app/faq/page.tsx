import { HelpCircle } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import FaqAccordion from "@/components/FaqAccordion";
import { getFaqs } from "@/lib/queries";
import { getPageContent, FAQ_CONTENT_FALLBACK } from "@/lib/content";

export const revalidate = 300;

// Phase 35 — banner text is Content Manager-editable via site_content key
// "page_faq"; the actual Q&A list below was already DB-driven (the faqs
// table) before this — the Content Manager's FAQ tab manages that table
// directly rather than duplicating it into site_content.
export default async function FaqPage() {
  const [faqs, content] = await Promise.all([getFaqs(), getPageContent("page_faq", FAQ_CONTENT_FALLBACK)]);

  return (
    <>
      <PageHero
        icon={HelpCircle}
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description || undefined}
        narrow
      />
      <section className="section narrow pt-0">
        <FaqAccordion faqs={faqs} />
      </section>
    </>
  );
}
