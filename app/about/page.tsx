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

  // Phase 242 — Home's TERROR portal card ("I serve or support someone who
  // serves") now links here as `/about?openMatch=terror` instead of the
  // general `/intake?path=` listing, so it lands directly in AI Matching
  // (the only place that flow exists — see Hero.tsx/HeroFindSupportCta.tsx's
  // own Phase 242 comments). `openMatch`'s value is only ever used to look
  // up a display label below; it never feeds the wizard's actual matching
  // logic (WizardAnswers has no pathway field to set), so an unrecognized or
  // missing value just means no auto-open/no label, never a crash.
  const openMatchParam = typeof searchParams?.openMatch === "string" ? searchParams.openMatch : undefined;
  const OPEN_MATCH_LABELS: Record<string, string> = {
    terror: "Continuing your request for support related to serving or supporting someone who serves.",
  };
  const autoOpenMatch = Boolean(openMatchParam && OPEN_MATCH_LABELS[openMatchParam]);
  const matchContextLabel = openMatchParam ? OPEN_MATCH_LABELS[openMatchParam] : undefined;

  const page = (
    <div className="reveal-page__main">
      <Hero
        content={heroContent}
        clinicLocations={clinicLocations}
        therapists={therapists}
        autoOpenMatch={autoOpenMatch}
        matchContextLabel={matchContextLabel}
      />

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
      {/* Phase 228 — Roy sent a reference screenshot of this section (plus
          the Team & Advisors section below and CommunityIntro's "Why GESA
          exists" section) and asked all three to switch to "Sage Green" —
          the same --green-sage token (#9BA689) already used on Home's
          icon-badge row (components/home/Stats.tsx). `bg-muted` ->
          `bg-green-sage`. */}
      <section id="how-it-works" className="section bg-green-sage">
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
        // Phase 229 — Roy sent a reference swatch (a dark slate-blue
        // gradient) and asked this Founder spotlight section to switch from
        // its gold `bg-sand-brown` to that dark tone. Reused the existing
        // `--primary` token ("Deep Slate", #2b3140) rather than a new hex —
        // it's the same dark navy already used for DonateBand's default
        // (non-ivory) band. Unlike a straight background swap, every text
        // element in here that relied on the *light* gold background for
        // contrast needed to flip too: `text-primary`/default-foreground
        // text is the exact same dark-slate color as the new background, so
        // left as-is it would have gone invisible. Recolored to
        // `text-white`/`text-white/80`, matching DonateBand's own established
        // convention for text on this same dark-navy background (see that
        // component's heading/subtitle classes). The gold `.eyebrow` label
        // color (`--clay`) was left untouched — gold reads fine against dark
        // navy, same pairing DonateBand/Stats already use elsewhere.
        // Phase 231 — Roy asked this section (plus the movement band below
        // and Community's "Choose your pathway" section) to match the
        // footer's "Help us grow" card color specifically — a richer navy
        // (~#0B1F3A) than `--primary`. `bg-primary` -> `bg-navy-deep`; every
        // text color set above already reads fine against it (still dark),
        // so no further changes needed here.
        <section className="section bg-navy-deep">
          <div className="wrap max-w-[980px]">
            <Reveal type="horizontal" distance={100} duration={0.9}>
              <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:gap-14">
                <div className="min-w-0 flex-1 text-center md:text-left">
                  <span className="eyebrow">
                    <EditableText contentId="about.founders.eyebrow" label="Founder spotlight eyebrow" value={sections.foundersHeading} as="span" />
                  </span>
                  <h2 className="my-2.5 text-[32px] text-white sm:text-[36px]">Meet {sections.founders[0].name}</h2>
                  <div className="mb-3 text-[15px] font-semibold text-white">{sections.founders[0].roleTitle}</div>
                  <p className="mb-5 text-[16px] leading-relaxed text-white/80">{sections.founders[0].shortBio}</p>
                  <Reveal type="horizontal" distance={60} duration={0.7} delay={0.35}>
                    <div className="mb-4 font-signature text-[40px] leading-none text-white">
                      {sections.founders[0].name}
                    </div>
                  </Reveal>
                  <a
                    href={`mailto:${sections.founders[0].email}`}
                    className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-white hover:text-white/80"
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
                  // Phase 229 — this section's own background is now the
                  // same `--primary` dark slate this fallback avatar already
                  // used, so a founder with no photo would blend straight
                  // into the section. Added a light ring so it stays visibly
                  // distinct; the gradient/initials/photo-present path are
                  // otherwise unchanged.
                  <div className="flex h-[240px] w-[240px] flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-600 text-[48px] font-serif font-semibold text-white ring-2 ring-white/25 sm:h-[280px] sm:w-[280px]">
                    {initials(sections.founders[0].name)}
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Phase 231 — Roy sent a reference screenshot of this "A global
          vision. A human movement." band and asked it (plus the Founder
          spotlight below and Community's "Choose your pathway" section) to
          switch to the same deep navy (~#0B1F3A) as the footer's "Help us
          grow" card — see app/globals.css's --navy-deep comment. Unlike the
          Founder-spotlight swap (Phase 229, already dark before this),
          every text element here relied on the *light* `bg-background`
          it's replacing, so all three needed a color flip: heading/body go
          from unset-default/`text-muted-fg` (both dark) to `text-white`/
          `text-white/80`. The button also flips — a solid `bg-primary` pill
          would have had weak contrast sitting on a similarly dark navy
          section — to the same outlined white-border treatment DonateBand
          already uses for pill CTAs on its own dark-navy band. */}
      <section className="section bg-navy-deep">
        <Reveal type="fade-up" as="div" className="wrap max-w-[640px] text-center">
          <h2 className="mb-2.5 text-[28px] text-white sm:text-[30px]">
            <EditableText contentId="about.movement.heading" label="Movement band heading" value={sections.movementHeading} as="span" />
          </h2>
          <div className="mb-6 text-white/80">
            <EditableText contentId="about.movement.body" label="Movement band body" value={sections.movementSubtitle} as="span" />
          </div>
          <VolunteerPrimaryCta
            href={sections.movementCtaHref}
            className="inline-flex items-center rounded-full border border-white/70 px-7 py-3.5 text-[13px] font-semibold uppercase tracking-wide text-white transition-all hover:-translate-y-px hover:bg-white/10"
          >
            <EditableText contentId="about.movement.ctaLabel" label="Movement CTA label" value={sections.movementCtaLabel} as="span" />
          </VolunteerPrimaryCta>
        </Reveal>
      </section>

      {sections.founders.length > 1 && (
        // Phase 228 — Team & Advisors section switched to "Sage Green"
        // (--green-sage) alongside "How GESA works" above and
        // CommunityIntro's "Why GESA exists" section — see this page's
        // "How GESA works" section comment above for the full context.
        <section className="section bg-green-sage">
          <div className="wrap">
            <div className="grid items-center gap-[clamp(1.5rem,4vw,3rem)] md:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)]">
              <Reveal type="fade-up" as="div" className="text-start">
                {/* Phase 245 — Roy asked for the "TEAM & ADVISORS" eyebrow to
                    switch from its usual gold (`.eyebrow`'s shared
                    `color: var(--clay)`, used site-wide) to literal black,
                    for this instance only — `text-[#000000]` is a Tailwind
                    utility, which (per this file's own `@layer utilities`
                    ordering in globals.css) loads after `.eyebrow`'s
                    `@layer components` rule and overrides just this one
                    span, leaving every other eyebrow on the site untouched. */}
                <span className="eyebrow text-[#000000]">
                  <EditableText contentId="about.team.eyebrow" label="Team section eyebrow" value={sections.teamEyebrow} as="span" />
                </span>
                {/* Phase 245 — new centered sub-label sitting between the
                    eyebrow and the heading, per Roy's request: additive, not
                    a replacement for the eyebrow/heading/intro/CTA below (the
                    CTA button further down happens to share this same "Meet
                    our team" copy today, but is a separate field —
                    `teamCtaLabel` — so editing one doesn't silently change
                    the other). `text-center` is set directly on this block
                    rather than on the column, so it centers on its own
                    without touching the left-aligned (`text-start`) heading/
                    intro/CTA around it — same "override just this element"
                    approach as the eyebrow color change above. */}
                <p className="eyebrow block text-center text-[#000000]">
                  <EditableText contentId="about.team.subLabel" label="Team sub-label" value={sections.teamSubLabel} as="span" />
                </p>
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
