import Link from "next/link";
import { ShieldCheck, HeartHandshake, Users, Globe2, Mail } from "lucide-react";
import Card from "@/components/ui/Card";
import Hero, { HERO_CONTENT_FALLBACK } from "@/components/Hero";
import DonateBand from "@/components/home/DonateBand";
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

      {/* Phase 104 — Roy sent a screenshot of the "OUR STORY" mission
          section (eyebrow/heading/body, on the sage-soft wash) and asked to
          remove it from the page entirely. This was the "Our Mission"
          section added in Phase 70 (`sections.ourMissionEyebrow/
          ourMissionHeading/ourMissionBody`) — unlike Phase 77/85's removals,
          Roy also explicitly asked to remove it from the Content Manager,
          so — unusually — this one drops the fields from the type/fallback/
          admin editor too, not just the render. See lib/content.ts and
          components/admin/content/AboutSectionsEditor.tsx. */}

      {/* Phase 77 — Roy asked to remove the "Why GESA exists" section
          entirely. `sections.missionHeading`/`missionParagraphs` and their
          Content Manager editor fields are left untouched — just no
          longer rendered here — per the standing rule against removing
          data/editor fields without confirming first. */}

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
      {/* Phase 84 — Roy sent a reference screenshot of a redesigned About
          page: a single-founder spotlight ("OUR FOUNDER" eyebrow, "Meet
          [Name]" headline, role subtitle, bio, a signature-style rendering
          of the name), a plain tagline/CTA band underneath it, and a
          separate "Team & Advisors" grid below that. He asked to keep this
          section's existing bg-clay-soft wash and both founders' existing
          photos untouched — only the layout/text arrangement changed.
          `founders[0]` (Ilana) is the spotlighted founder; `founders`
          slice(1) onward (Karin, today) move into the new Team & Advisors
          section further down instead of a second alternating row here. */}
      {sections.founders[0] && (
        <section className="section bg-clay-soft">
          <div className="wrap max-w-[980px]">
            <Reveal type="horizontal" distance={100} duration={0.9}>
              <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:gap-14">
                <div className="min-w-0 flex-1 text-center md:text-left">
                  <span className="eyebrow">{sections.foundersHeading}</span>
                  <h2 className="my-2.5 text-[32px] sm:text-[36px]">Meet {sections.founders[0].name}</h2>
                  <div className="mb-3 text-[15px] font-semibold text-primary">{sections.founders[0].roleTitle}</div>
                  <p className="mb-5 text-[16px] leading-relaxed text-muted-fg">{sections.founders[0].shortBio}</p>
                  {/* Phase 87 — Roy asked for this line to look like a real
                      handwritten signature (font-signature/Caveat, see
                      globals.css) and to slide in from the left on its own
                      as the section scrolls into view, distinct from the
                      rest of the block's motion. No new content field
                      needed — still just the founder's own name — but it
                      gets its own nested Reveal (rather than only relying
                      on the parent Reveal wrapping the whole row) so it
                      visibly animates in on its own, with a short delay so
                      it reads as "signing off" after the text above it has
                      already appeared. */}
                  <Reveal type="horizontal" distance={60} duration={0.7} delay={0.35}>
                    <div className="mb-4 font-signature text-[40px] leading-none text-primary">
                      {sections.founders[0].name}
                    </div>
                  </Reveal>
                  <a
                    href={`mailto:${sections.founders[0].email}`}
                    className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary"
                  >
                    <Mail size={15} /> {sections.founders[0].email}
                  </a>
                </div>
                {/* Phase 62/66 — same real-photo-with-initials-fallback
                    treatment as before, untouched, just repositioned to the
                    right of the text per the new layout. */}
                {sections.founders[0].photoUrl ? (
                  <div className="relative h-[240px] w-[240px] flex-none overflow-hidden rounded-2xl sm:h-[280px] sm:w-[280px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sections.founders[0].photoUrl}
                      alt={sections.founders[0].name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-[240px] w-[240px] flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-600 text-[48px] font-serif font-semibold text-white sm:h-[280px] sm:w-[280px]">
                    {initials(sections.founders[0].name)}
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Phase 84 — new tagline/CTA band between the founder spotlight and
          the Team & Advisors grid, per Roy's reference screenshot. Opens
          the volunteer application modal by default via VolunteerPrimaryCta
          (same recognized-default-href pattern used by the volunteer CTA
          band further down this page). */}
      <section className="section bg-background">
        <Reveal type="fade-up" as="div" className="wrap max-w-[640px] text-center">
          <h2 className="mb-2.5 text-[28px] sm:text-[30px]">{sections.movementHeading}</h2>
          <p className="mb-6 text-muted-fg">{sections.movementSubtitle}</p>
          <VolunteerPrimaryCta
            href={sections.movementCtaHref}
            className="inline-flex items-center rounded-full bg-primary px-7 py-3.5 text-[13px] font-semibold uppercase tracking-wide text-white transition-transform hover:-translate-y-px"
          >
            {sections.movementCtaLabel}
          </VolunteerPrimaryCta>
        </Reveal>
      </section>

      {/* Phase 84 — "Team & Advisors": founders[1] onward (Karin, today)
          plus anyone else added to the founders list later, each shown as a
          compact bordered card (real photo if uploaded, otherwise an
          outlined-initials circle) rather than the founder spotlight's
          bigger treatment above. Section is skipped entirely if there's
          nobody in it yet, e.g. a fresh site with only one founder row. */}
      {sections.founders.length > 1 && (
        <section className="section bg-muted">
          <div className="wrap max-w-[820px]">
            <Reveal type="fade-up" className="block text-center">
              <span className="eyebrow">{sections.teamEyebrow}</span>
              <h2 className="my-2.5 text-[30px]">{sections.teamHeading}</h2>
              <p className="mx-auto max-w-[600px] text-muted-fg">{sections.teamIntro}</p>
            </Reveal>
            <StaggerGroup className="mt-7 flex flex-wrap justify-center gap-4">
              {sections.founders.slice(1).map((m) => (
                <StaggerItem key={m.name}>
                  <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-card px-5 py-4 text-left">
                    {m.photoUrl ? (
                      <div className="relative h-12 w-12 flex-none overflow-hidden rounded-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.photoUrl} alt={m.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-border text-[14px] font-semibold text-primary">
                        {initials(m.name)}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">{m.name}</div>
                      <div className="text-[13px] text-muted-fg">{m.roleTitle}</div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
            <div className="mt-6 text-center">
              <Link
                href={sections.teamCtaHref}
                className="inline-flex items-center rounded-full border border-border px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-primary hover:bg-secondary"
              >
                {sections.teamCtaLabel}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Phase 85 — Roy sent a screenshot of the "Join us as a caregiver"
          volunteer CTA band and the legal/tax-note block below it, asking
          for both to be removed from the About page. Their content fields
          (volunteerHeading/Body/PrimaryLabel/etc., legalBlurb, taxNote) are
          left untouched in the content model and Content Manager editor —
          same "don't delete data just because a section stopped rendering
          it" precedent as Phase 77's missionHeading/missionParagraphs —
          just no longer rendered here. */}

      {/* Phase 75 — DonateBand moved here from the fixed footer-reveal
          layer (see SiteFooterSlot.tsx) so it's a normal, always-visible
          section instead of part of the hidden-until-scroll effect — only
          the Footer stays inside that reveal layer now. */}
      <DonateBand />
    </div>
  );
}
