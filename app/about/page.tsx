import Link from "next/link";
import { ShieldCheck, HeartHandshake, Users, Globe2, Mail, Phone, ArrowRight } from "lucide-react";
import Card from "@/components/ui/Card";
import Hero, { HERO_CONTENT_FALLBACK } from "@/components/Hero";
import Reveal from "@/components/motion/Reveal";
import VolunteerPrimaryCta from "@/components/volunteer/VolunteerPrimaryCta";
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

      {/* Phase 55 — Roy sent a reference screenshot showing this section on
          a warm cream background instead of the page's usual cool ivory
          (--background). Scoped to just this section (bg-clay-soft, the
          same pale-gold-wash token the gold-banner era already introduced
          in app/globals.css) rather than changing --background globally,
          since the ask was specifically about this section and Our
          Therapists' directory section, not every page site-wide.
          Phase 55 follow-up — the background color was first put on the
          same element as `wrap max-w-[820px]`, which made it fill only
          that narrow centered box instead of the full viewport width —
          exactly the "cut / certain area only" Roy flagged. Fixed by
          moving `bg-clay-soft` to this outer, full-width <section>, with
          `wrap max-w-[820px]` now on its own inner <div> that only
          constrains the *content's* width, not the color. */}
      <section className="section bg-clay-soft">
        {/* Phase 66 — Roy sent a reference mockup of a bigger, alternating
            photo/text layout (photo-left-text-right for the first founder,
            text-left-photo-right for the second) with each row sliding in
            from the side its photo starts on as it scrolls into view,
            replacing the small side-by-side 2-up card grid from Phase 62.
            Text content itself (name/role/bio/email) is unchanged — only
            the layout, sizing, and motion changed, per Roy's "text details
            is as is" instruction. Widened from max-w-[820px] to
            max-w-[980px] so two-up alternating rows have room to breathe
            at the new, bigger photo size. */}
        <div className="wrap max-w-[980px]">
          <Reveal type="fade-up" className="block text-center">
            <span className="eyebrow">{sections.foundersHeading}</span>
            <h2 className="my-2.5 text-[30px]">{sections.foundersHeading}</h2>
            <p className="mx-auto max-w-[600px] text-muted-fg">{sections.foundersIntro}</p>
          </Reveal>
          <div className="mt-8.5 mt-[34px] flex flex-col gap-6">
            {sections.founders.map((p, i) => {
              // Alternate which side each row's photo starts on — even
              // index (Ilana, first) slides in from the left; odd index
              // (Karin, second) slides in from the right. A small
              // per-row delay (on top of each row's own viewport trigger)
              // keeps the intended left-then-right order even if both
              // happen to scroll into view together on a fast scroll.
              const reversed = i % 2 === 1;
              return (
                <Reveal
                  key={p.name}
                  type={reversed ? "horizontal-right" : "horizontal"}
                  distance={140}
                  duration={0.9}
                  delay={i * 0.25}
                >
                  <Card
                    className={`flex flex-col items-center gap-7 p-7 text-center sm:p-8 md:flex-row md:text-left ${
                      reversed ? "md:flex-row-reverse" : ""
                    }`}
                  >
                    {/* Phase 62 — founders can now have a real photo attached
                        via the Content Manager; falls back to the initials
                        block exactly as before for any founder nobody has
                        uploaded one for yet. Phase 66 — sized up from
                        112x96px to a bigger 260px square per Roy's "a
                        little bit bigger than the current design" ask. */}
                    {p.photoUrl ? (
                      <div className="relative h-[220px] w-[220px] flex-none overflow-hidden rounded-2xl sm:h-[260px] sm:w-[260px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.photoUrl} alt={p.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-[220px] w-[220px] flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-600 text-[48px] font-serif font-semibold text-white sm:h-[260px] sm:w-[260px]">
                        {initials(p.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="m-0 text-2xl">{p.name}</h3>
                      <div className="my-1 mb-3 text-[15px] font-semibold text-primary">{p.roleTitle}</div>
                      <p className="mb-3 text-[16px] leading-relaxed text-muted-fg">{p.shortBio}</p>
                      <a
                        href={`mailto:${p.email}`}
                        className="inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-primary"
                      >
                        <Mail size={16} /> {p.email}
                      </a>
                    </div>
                  </Card>
                </Reveal>
              );
            })}
          </div>
          <p className="mt-5 text-center text-[13px] text-muted-fg">
            More of our team, advisory board, and volunteer network will be introduced here soon.
          </p>
        </div>
      </section>

      <section className="section bg-gradient-to-br from-primary to-primary-600">
        <Reveal type="fade-up" as="div" className="wrap text-center max-w-[640px]">
          <h2 className="mb-2.5 text-[30px] text-white">{sections.volunteerHeading}</h2>
          <p className="mx-auto text-white/90">{sections.volunteerBody}</p>
          <div className="mt-5.5 mt-[22px] flex flex-wrap justify-center gap-3.5">
            {/* Phase 63 — opens the real volunteer application modal when
                this is still pointed at its original default; otherwise
                stays a normal link, so an admin who's deliberately
                repointed this via the Content Manager isn't overridden. */}
            <VolunteerPrimaryCta
              href={sections.volunteerPrimaryHref}
              className="inline-flex items-center gap-2 rounded-full bg-card px-6 py-3.5 text-[15px] font-semibold text-primary"
            >
              {sections.volunteerPrimaryLabel} <ArrowRight size={16} />
            </VolunteerPrimaryCta>
            <Link
              href={sections.volunteerSecondaryHref}
              className="inline-flex items-center rounded-full border border-white/60 px-6 py-3.5 text-[15px] font-semibold text-white"
            >
              {sections.volunteerSecondaryLabel}
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Phase 68 — Roy asked for a light sage green background here,
          matched consistently with Home's Stats section below via the new
          --sage-soft token, rather than the old --accent-soft wash used
          site-wide for smaller chip/badge surfaces. */}
      <section className="section bg-sage-soft">
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
