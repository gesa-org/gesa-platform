import Link from "next/link";
import { Heart } from "lucide-react";
import VolunteerPrimaryCta from "@/components/volunteer/VolunteerPrimaryCta";
import { getPageContent, type DonateBandContent } from "@/lib/content";

// Phase 80 round 2 — this band is rendered identically on Home, About, Our
// Therapists, and Support Groups (Phase 75), so one Content Manager save
// updates all four pages at once.
// Phase 83 — Roy asked for a redesign: the single "Donate to GESA" button
// became two pill CTAs, plus a small crisis-resources line underneath.
// `cta1Href` defaults to the same href VolunteerPrimaryCta already treats
// as "open the volunteer application modal" (see that component), so "Join
// as a professional" opens the modal by default rather than just linking
// to the contact page, matching the About page's existing volunteer CTA
// behavior.
export const DONATE_BAND_CONTENT_FALLBACK: DonateBandContent = {
  published: true,
  headline: "Your gift keeps care free",
  subtitle:
    "Every donation extends the six free sessions that make GESA possible for people who have nowhere else to turn.",
  cta1Label: "Join as a professional",
  cta1Href: "/contact?subject=Volunteer",
  cta2Label: "Explore the community",
  cta2Href: "/support-groups",
  crisisText: "Need immediate emergency support?",
  crisisLinkLabel: "Find local crisis services.",
  crisisLinkHref: "https://findahelpline.com/",
};

const PILL_CLASS =
  "inline-flex items-center rounded-full border border-white/70 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white/10";

export default async function DonateBand() {
  const content = await getPageContent("component_donate_band", DONATE_BAND_CONTENT_FALLBACK);
  const crisisLinkIsExternal = content.crisisLinkHref.startsWith("http");

  return (
    <section className="section bg-gradient-to-br from-primary to-primary-600">
      <div className="wrap text-center">
        <h2 className="mb-2.5 font-serif text-[34px] font-semibold text-white">{content.headline}</h2>
        <p className="mx-auto max-w-[560px] text-white/80">{content.subtitle}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5">
          <VolunteerPrimaryCta href={content.cta1Href} className={PILL_CLASS}>
            {content.cta1Label}
          </VolunteerPrimaryCta>
          <Link href={content.cta2Href} className={PILL_CLASS}>
            {content.cta2Label}
          </Link>
        </div>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-[14px] text-white/80">
          <Heart size={15} className="flex-none" />
          {content.crisisText}{" "}
          <a
            href={content.crisisLinkHref}
            target={crisisLinkIsExternal ? "_blank" : undefined}
            rel={crisisLinkIsExternal ? "noreferrer" : undefined}
            className="underline underline-offset-2 hover:text-white"
          >
            {content.crisisLinkLabel}
          </a>
        </p>
      </div>
    </section>
  );
}
