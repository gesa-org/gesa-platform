import Link from "next/link";
import { getPageContent, type DonateBandContent } from "@/lib/content";

// Phase 80 round 2 — this band is rendered identically on Home, About, Our
// Therapists, and Support Groups (Phase 75), but had zero Content Manager
// wiring — four hardcoded copies of the same headline/subtitle/CTA that
// could only ever be kept in sync by editing all four call sites by hand
// (there was only ever one, here). Made it a self-fetching async Server
// Component (same `getPageContent` pattern used everywhere else) rather
// than threading a `content` prop through all four pages, since every call
// site wants the exact same content anyway — one edit in the Content
// Manager now really does fix all four places at once.
export const DONATE_BAND_CONTENT_FALLBACK: DonateBandContent = {
  published: true,
  headline: "Your gift keeps care free",
  subtitle:
    "Every donation extends the six free sessions that make GESA possible for people who have nowhere else to turn.",
  ctaLabel: "Donate to GESA",
  ctaHref: "/contact?subject=Donation",
};

export default async function DonateBand() {
  const content = await getPageContent("component_donate_band", DONATE_BAND_CONTENT_FALLBACK);

  return (
    <section className="section bg-gradient-to-br from-primary to-primary-600">
      <div className="wrap text-center">
        <h2 className="mb-2.5 text-[34px] text-white">{content.headline}</h2>
        <p className="mx-auto max-w-[560px] text-white/90">{content.subtitle}</p>
        <Link
          href={content.ctaHref}
          className="mt-5.5 mt-[22px] inline-flex items-center rounded-full bg-card px-6 py-3.5 text-[15px] font-semibold text-primary transition-transform hover:-translate-y-px"
        >
          {content.ctaLabel}
        </Link>
      </div>
    </section>
  );
}
