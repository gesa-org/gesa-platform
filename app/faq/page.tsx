import FaqAccordion from "@/components/FaqAccordion";
import { getFaqs } from "@/lib/queries";

export const revalidate = 300;

export default async function FaqPage() {
  const faqs = await getFaqs();

  return (
    <section className="section narrow">
      <div className="text-center">
        <span className="eyebrow">FAQ</span>
        <h1 className="my-2.5 text-[38px]">Frequently asked questions</h1>
      </div>
      <FaqAccordion faqs={faqs} />
    </section>
  );
}
