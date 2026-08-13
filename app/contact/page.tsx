import { Suspense } from "react";
import ContactForm from "./ContactForm";

export const metadata = {
  title: "Contact — GESA",
};

export default function ContactPage() {
  return (
    <section className="section narrow">
      <div className="text-center">
        <span className="eyebrow">Contact</span>
        <h1 className="my-2.5 text-[38px]">We&apos;re here to help</h1>
        <p className="mx-auto max-w-[560px] text-muted-fg">
          Questions about support, volunteering, or donating — send us a note and we&apos;ll get back
          to you.
        </p>
      </div>

      <Suspense fallback={null}>
        <ContactForm />
      </Suspense>
    </section>
  );
}
