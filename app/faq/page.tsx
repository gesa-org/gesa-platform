import { HelpCircle } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import FaqAccordion from "@/components/FaqAccordion";
import { getFaqs } from "@/lib/queries";

export const revalidate = 300;

export default async function FaqPage() {
  const faqs = await getFaqs();

  return (
    <>
      <PageHero icon={HelpCircle} eyebrow="FAQ" title="Frequently asked questions" narrow />
      <section className="section narrow pt-0">
        <FaqAccordion faqs={faqs} />
      </section>
    </>
  );
}
