import Link from "next/link";
import { ShieldCheck, HeartHandshake, Users, Globe2, Mail, Phone, ArrowRight } from "lucide-react";
import Card from "@/components/ui/Card";
import Hero, { HERO_CONTENT_FALLBACK } from "@/components/Hero";
import Reveal from "@/components/motion/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";
import { getPageContent, ABOUT_SECTIONS_FALLBACK } from "@/lib/content";

export const metadata = {
  title: "About — GESA",
  description: "Who we are: GESA's mission, how it works, and the founders behind it.",
};

// Fixed icon-per-position for the "How GESA works" cards — icon choice
// wasn't one of the requested editable fields, only each card's title/body
// text. If a published row ever has more/fewer points than this list, extra
// points fall back to the last icon rather than crashing.
const HOW_IT_WORKS_ICONS = [ShieldCheck, HeartHandshake, Users, Globe2];

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}

// Footer reveal effect (Phase 34 — extended from Home in Phase 29): this
// page's own content, including its own "Join us as a caregiver" CTA
// section further down, is the opaque "cover." The generic donate band +
// footer sit in a separate fixed layer underneath (see SiteFooterSlot),
// uncovered once the visitor scrolls past this page's reserved bottom
// margin.
//
// Phase 35 — every section on this page (Hero, mission, how-it-works cards,
// founders, the volunteer CTA, the legal blurb) is now Content Manager-
// editable via two site_content keys: "page_about_hero" (via the shared
// Hero component) and "page_about_sections" (everything below it). The
// fallback objects above are exactly today's live copy — publishing the
// seeded rows changes nothing visually until an admin actually edits them.
//
// Phase 45 — section headings get the standard fade+rise Reveal, and the
// two card grids (how-it-works, founders) get the same staggered card
// entrance used everywhere else on the site. This is a Server Component
// (it fetches `sections` above), which is fine — Reveal/StaggerGroup are
// Client Components and Next.js allows a Server Component to render them
// directly, no boundary conversion needed for this page itself.
export default async function AboutPage() {
  const [heroContent, sections] = await Promise.all([
    getPageContent("page_about_hero", HERO_CONTENT_FALLBACK),
    getPageContent("page_about_sections", ABOUT_SECTIONS_FALLBACK),
  ]);

  return (
    <div className="reveal-page__main">
      <Hero content={heroContent} />

      <section className="section wrap max-w-[760px]">
        <Reveal type="fade-up">
          <h2 className="text-[30px]">{sections.missionHeading}</h2>
          {sections.missionParagraphs.map((p, i) => (
            <p key={i} className="text-muted-fg text-[15.5px]">
              {p}
            </p>
          ))}
        </Reveal>
      </section>

      <section className="section bg-muted">
        <div className="wrap">
          <Reveal type="fade-up" className="block">
            <h2 className="text-center text-[30px] mb-2">{sections.howItWorksHeading}</h2>
          </Reveal>
          <StaggerGroup className="mt-7.5 mt-[30px] grid gap-[22px] sm:grid-cols-2 lg:grid-cols-4">
            {sections.howItWorksPoints.map((pt, i) => {
              const Icon = HOW_IT_WORKS_ICONS[i] ?? HOW_IT_WORKS_ICONS[HOW_IT_WORKS_ICONS.length - 1];
              return (
                <StaggerItem key={pt.title}>
                  <Card>
                    <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-accent-soft text-primary">
                      <Icon size={22} />
                    </div>
                    <h3 className="mt-3.5 mb-1.5 text-[17px]">{pt.title}</h3>
                    <p className="text-sm text-muted-fg">{pt.body}</p>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      <section className="section wrap max-w-[820px]">
        <Reveal type="fade-up" className="block text-center">
          <span className="eyebrow">{sections.foundersHeading}</span>
          <h2 className="my-2.5 text-[30px]">{sections.foundersHeading}</h2>
          <p className="mx-auto max-w-[600px] text-muted-fg">{sections.foundersIntro}</p>
        </Reveal>
        <StaggerGroup className="mt-8.5 mt-[34px] grid gap-[22px] sm:grid-cols-2">
          {sections.founders.map((p) => (
            <StaggerItem key={p.name}>
              <Card className="flex items-start gap-5">
                <div className="flex h-[112px] w-24 flex-none items-center justify-center rounded-[14px] bg-gradient-to-br from-primary to-primary-600 text-[26px] font-serif font-semibold text-white">
                  {initials(p.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="m-0 text-xl">{p.name}</h3>
                  <div className="my-0.5 mb-2.5 text-sm font-semibold text-primary">{p.roleTitle}</div>
                  <p className="mb-2.5 text-[14.5px] text-muted-fg">{p.shortBio}</p>
                  <a
                    href={`mailto:${p.email}`}
                    className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-primary"
                  >
                    <Mail size={15} /> {p.email}
                  </a>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </StaggerGroup>
        <p className="mt-5 text-center text-[13px] text-muted-fg">
          More of our team, advisory board, and volunteer network will be introduced here soon.
        </p>
      </section>

      <section className="section bg-gradient-to-br from-primary to-primary-600">
        <Reveal type="fade-up" as="div" className="wrap text-center max-w-[640px]">
          <h2 className="mb-2.5 text-[30px] text-white">{sections.volunteerHeading}</h2>
          <p className="mx-auto text-white/90">{sections.volunteerBody}</p>
          <div className="mt-5.5 mt-[22px] flex flex-wrap justify-center gap-3.5">
            <Link
              href={sections.volunteerPrimaryHref}
              className="inline-flex items-center gap-2 rounded-full bg-card px-6 py-3.5 text-[15px] font-semibold text-primary"
            >
              {sections.volunteerPrimaryLabel} <ArrowRight size={16} />
            </Link>
            <Link
              href={sections.volunteerSecondaryHref}
              className="inline-flex items-center rounded-full border border-white/60 px-6 py-3.5 text-[15px] font-semibold text-white"
            >
              {sections.volunteerSecondaryLabel}
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="section bg-accent-soft">
        <div className="wrap text-center max-w-[700px]">
          <p className="mb-3 text-[15px] text-primary-600">{sections.legalBlurb}</p>
          <div className="text-[13.5px] leading-[1.9] text-muted-fg">
            <div>
              <strong>{sections.taxNote}</strong>
            </div>
            <div>A registered non-profit organization.</div>
            <div className="mt-2">
              <a href="tel:988" className="inline-flex items-center gap-1.5 font-semibold text-primary">
                <Phone size={15} /> Emergency contact numbers
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
