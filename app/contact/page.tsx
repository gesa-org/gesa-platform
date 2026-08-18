import { Suspense } from "react";
import { Mail } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import ContactForm from "./ContactForm";

export const metadata = {
  title: "Contact — GESA",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        icon={Mail}
        eyebrow="Contact"
        title="We're here to help"
        description="Questions about support, volunteering, or donating — send us a note and we'll get back to you."
        narrow
      />
      <section className="section narrow pt-0">
        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </section>
    </>
  );
}
