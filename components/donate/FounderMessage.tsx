import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import EditableText from "@/components/ui-builder/public/EditableText";
import EditableImage from "@/components/ui-builder/public/EditableImage";

// Phase 224 — two-column founder/team message, placed directly after the
// donation form per Roy's required narrative flow (...DONATION -> THANK
// YOU). Roy was explicit: no verified founder name, biography, or
// consented photo exists yet, so this renders "The GESA team" as the
// signature rather than inventing a founder identity — see
// DONATE_PAGE_FALLBACK's own Phase 224 comment and EXECUTION_PLAN.md.
// A plain server-renderable section (no interactivity of its own) —
// EditableText/EditableImage are client components but drop in here the
// same way they do in every other section of DonatePage.tsx.
export default function FounderMessage({
  heading,
  quote,
  body,
  signature,
  image,
  imageAlt,
  imageFallback,
  linkLabel,
  linkHref,
}: {
  heading: string;
  quote: string;
  body: string;
  signature: string;
  image: string;
  imageAlt: string;
  imageFallback: { src: string; alt: string };
  linkLabel: string;
  linkHref: string;
}) {
  return (
    <section className="section border-t border-border bg-sage-soft/40">
      <div className="wrap">
        <Reveal type="fade-up">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="order-2 lg:order-1">
              <h2 className="mb-5 font-serif text-[26px] font-semibold text-foreground">
                <EditableText contentId="donate.founder.heading" label="Founder section heading" value={heading} as="span" />
              </h2>
              <p className="mb-5 font-serif text-[20px] italic leading-relaxed text-foreground">
                “<EditableText contentId="donate.founder.quote" label="Founder quote" value={quote} as="span" />”
              </p>
              <div className="mb-6 text-[15px] leading-relaxed text-muted-fg">
                <EditableText contentId="donate.founder.body" label="Founder body copy" value={body} as="span" />
              </div>
              <p className="mb-6 text-[14px] font-semibold text-foreground">
                <EditableText contentId="donate.founder.signature" label="Signature line" value={signature} as="span" />
              </p>
              <Link
                href={linkHref}
                className="inline-flex items-center text-[13px] font-semibold uppercase tracking-wide text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary-600"
              >
                <EditableText contentId="donate.founder.linkLabel" label="Learn about GESA link label" value={linkLabel} as="span" />
              </Link>
            </div>
            <div className="order-1 aspect-[4/3] w-full overflow-hidden rounded-[var(--radius)] shadow-soft lg:order-2">
              <EditableImage
                contentId="donate.founder.image"
                altContentId="donate.founder.imageAlt"
                label="Founder/team photo"
                src={image}
                alt={imageAlt}
                fallbackSrc={imageFallback.src}
                fallbackAlt={imageFallback.alt}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
