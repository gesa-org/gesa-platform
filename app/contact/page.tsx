import { Suspense } from "react";
import { Mail } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import ContactForm from "./ContactForm";
import { getPageContent, CONTACT_CONTENT_FALLBACK } from "@/lib/content";

export const metadata = {
  title: "Contact — GESA",
};

// Phase 35 — banner text is Content Manager-editable via site_content key
// "page_contact".
export default async function ContactPage() {
  const content = await getPageContent("page_contact", CONTACT_CONTENT_FALLBACK);

  return (
    <>
      <PageHero icon={Mail} eyebrow={content.eyebrow} title={content.title} description={content.description} narrow />
      <section className="section narrow pt-0">
        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </section>
    </>
  );
}
