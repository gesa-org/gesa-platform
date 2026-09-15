import Link from "next/link";
import { ShieldCheck, HeartHandshake, Users, Globe2, Mail } from "lucide-react";
import Card from "@/components/ui/Card";
import Hero, { HERO_CONTENT_FALLBACK } from "@/components/Hero";
import DonateBand, { DONATE_BAND_CONTENT_FALLBACK } from "@/components/home/DonateBand";
import Reveal from "@/components/motion/Reveal";
import VolunteerPrimaryCta from "@/components/volunteer/VolunteerPrimaryCta";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";
import { getPageContent, ABOUT_SECTIONS_FALLBACK } from "@/lib/content";
import { getActiveClinicLocations, getActiveTherapists } from "@/lib/queries";
import { resolveEditorPreview } from "@/lib/ui-builder/pageContentResolver";
import EditorPreviewBridge from "@/components/ui-builder/public/EditorPreviewBridge";
import EditableText from "@/components/ui-builder/public/EditableText";

// Phase 218 — reverting Phase 217. Roy asked to undo that phase entirely, so
// this page is restored to its Phase 216 state: the full Hero/AI Matching/
// How GESA Works/founder spotlight/Team & Advisors/DonateBand content that
// Phase 217 had moved to app/find-your-therapist/page.tsx. `/find-your-
// therapist` goes back to being intentionally empty (see that page's own
// Phase 218 comment), and `/support-groups` gets its own former Community
// content back too (see that page's own Phase 218 comment). No content or
// component changes below this comment beyond restoring the Phase 216
// version verbatim — same content sources ("page_about_hero",
// "page_about_sections", "component_donate_band"), same "about" pageKey.
export const metadata = {
  title: "About — GESA",
  description:
    "Get matched with a verified volunteer therapist — free, confidential, and no account required. Learn how GESA's AI matching and community support work.",
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
// page's own content is the opaque "cover." The generic donate band +
// footer sit in a separate fixed layer underneath (see SiteFooterSlot),
// uncovered once the visitor scrolls past this page's reserved bottom
// margin. Phase 218 — SiteFooterSlot's REVEAL_ROUTES lists "/about" again
// (and no longer "/find-your-therapist") to match this page owning the
// reveal treatment once more.
//
// Phase 35 — every section on this page (Hero, mission, how-it-works cards,
// founders, the volunteer CTA, the legal blurb) is Content Manager-editable
// via two site_content keys: "page_about_hero" (via the shared Hero
// component) and "page_about_sections" (everything below it).
export default async function AboutPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const [heroContentRaw, sectionsRaw, donateContentRaw, clinicLocations, therapists] = await Promise.all([
    getPageContent("page_about_hero", HERO_CONTENT_FALLBACK),
    getPageContent("page_about_sections", ABOUT_SECTIONS_FALLBACK),
    // Phase 153 — DonateBand's own site_content row, fetched here (instead
    // of left to that component's internal self-fetch) so this page's
    // editor-preview draft layer below can reach it too — the same
    // published-content object DonateBand would fetch itself either way.
    getPageContent("component_donate_band", DONATE_BAND_CONTENT_FALLBACK),
    // Phase 146 — fetched here so it can be handed down to Hero ->
    // HeroFindSupportCta -> the AI Matching modal's MatchWizard, which needs
    // the active clinic list for its Format & Location step.
    getActiveClinicLocations(),
    // Phase 151 — for the Browse Therapist search modal.
    getActiveTherapists(),
  ]);

  const { resolved, isEditorPreview } = await resolveEditorPreview(
    "about",
    { hero: heroContentRaw, sections: sectionsRaw, donate: donateContentRaw } as unknown as Record<string, unknown>,
    searchParams
  );
  const heroContent = (resolved as unknown as { hero: typeof heroContentRaw }).hero;
  const sections = (resolved as unknown as { sections: typeof sectionsRaw }).sections;
  const donateContent = (resolved as unknown as { donate: typeof donateContentRaw }).donate;

  const page = (
    <div className="reveal-page__main">
      <Hero content={heroContent} clinicLocations={clinicLocations} therapists={therapists} />

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
          data/editor fields without confirming first. (Note: this is a
          distinct, now-unused field from the *Community* content's own
          `missionHeading`/`missionBody` rendered on /support-groups — same
          field name, different content source, not a collision.) */}

      {/* Phase 145 — `id="how-it-works"` added so the Hero's primary CTA
          (an in-page anchor, since this Hero renders on the same page
          rather than linking out to it) has somewhere to scroll to. */}
      <section id="how-it-works" className="section bg-muted">
        <div className="wrap">
          <Reveal type="fade-up" className="block">
            <h2 className="text-center text-[30px] mb-2">
              <EditableText contentId="about.howItWorks.heading" label="“How GESA works” heading" value={sections.howItWorksHeading} as="span" />
            </h2>
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

      {sections.founders[0] && (
        <section className="section bg-sand-brown">
          <div className="wrap max-w-[980px]">
            <Reveal type="horizontal" distance={100} duration={0.9}>
              <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:gap-14">
                <div className="min-w-0 flex-1 text-center md:text-left">
                  <span className="eyebrow">
                    <EditableText contentId="about.founders.eyebrow" label="Founder spotlight eyebrow" value={sections.foundersHeading} as="span" />
                  </span>
                  <h2 className="my-2.5 text-[32px] sm:text-[36px]">Meet {sections.founders[0].name}</h2>
                  <div className="mb-3 text-[15px] font-semibold text-primary">{sections.founders[0].roleTitle}</div>
                  <p className="mb-5 text-[16px] leading-relaxed text-muted-fg">{sections.founders[0].shortBio}</p>
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

      <section className="section bg-background">
        <Reveal type="fade-up" as="div" className="wrap max-w-[640px] text-center">
          <h2 className="mb-2.5 text-[28px] sm:text-[30px]">
            <EditableText contentId="about.movement.heading" label="Movement band heading" value={sections.movementHeading} as="span" />
          </h2>
          <div className="mb-6 text-muted-fg">
            <EditableText contentId="about.movement.body" label="Movement band body" value={sections.movementSubtitle} as="span" />
          </div>
          <VolunteerPrimaryCta
            href={sections.movementCtaHref}
            className="inline-flex items-center rounded-full bg-primary px-7 py-3.5 text-[13px] font-semibold uppercase tracking-wide text-white transition-transform hover:-translate-y-px"
          >
            <EditableText contentId="about.movement.ctaLabel" label="Movement CTA label" value={sections.movementCtaLabel} as="span" />
          </VolunteerPrimaryCta>
        </Reveal>
      </section>

      {sections.founders.length > 1 && (
        <section className="section bg-muted">
          <div className="wrap">
            <div className="grid items-center gap-[clamp(1.5rem,4vw,3rem)] md:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)]">
              <Reveal type="fade-up" as="div" className="text-start">
                <span className="eyebrow">
                  <EditableText contentId="about.team.eyebrow" label="Team section eyebrow" value={sections.teamEyebrow} as="span" />
                </span>
                <h2 className="mb-3 text-[clamp(1.75rem,2.6vw,2.25rem)] leading-[1.15]">
                  <EditableText contentId="about.team.heading" label="Team section heading" value={sections.teamHeading} as="span" />
                </h2>
                <div className="max-w-[30rem] text-[clamp(0.95rem,1.1vw,1.0625rem)] leading-[1.6] text-muted-fg">
                  <EditableText contentId="about.team.intro" label="Team section intro" value={sections.teamIntro} as="span" />
                </div>
                <div className="mt-5">
                  <Link
                    href={sections.teamCtaHref}
                    className="inline-flex items-center rounded-full border border-border px-5 py-2.5 text-[12.5px] font-semibold uppercase tracking-wide text-primary hover:bg-secondary"
                  >
                    <EditableText contentId="about.team.ctaLabel" label="Team CTA label" value={sections.teamCtaLabel} as="span" />
                  </Link>
                </div>
              </Reveal>
              <StaggerGroup className="flex flex-col items-start gap-4 md:justify-self-end">
                {sections.founders.slice(1).map((m) => (
                  <StaggerItem key={m.name} className="w-full">
                    <div className="w-full max-w-[17rem] rounded-2xl border border-border bg-card p-[clamp(0.875rem,1.4vw,1.25rem)] text-center shadow-soft">
                      {m.photoUrl ? (
                        <div className="relative mx-auto h-[120px] w-[120px] overflow-hidden rounded-2xl sm:h-[140px] sm:w-[140px] lg:h-[160px] lg:w-[160px]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.photoUrl} alt={m.name} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="mx-auto flex h-[120px] w-[120px] items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-600 text-[30px] font-serif font-semibold text-white sm:h-[140px] sm:w-[140px] lg:h-[160px] lg:w-[160px]">
                          {initials(m.name)}
                        </div>
                      )}
                      <div className="mt-3.5 text-[clamp(1.05rem,1.3vw,1.25rem)] font-semibold">{m.name}</div>
                      <div className="mt-0.5 text-[13px] text-muted-fg sm:text-[14px]">{m.roleTitle}</div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </div>
          </div>
        </section>
      )}

      {/* Phase 75 — DonateBand moved here from the fixed footer-reveal
          layer (see SiteFooterSlot.tsx) so it's a normal, always-visible
          section instead of part of the hidden-until-scroll effect — only
          the Footer stays inside that reveal layer now. */}
      <DonateBand content={donateContent} />
    </div>
  );

  return isEditorPreview ? <EditorPreviewBridge>{page}</EditorPreviewBridge> : page;
}
