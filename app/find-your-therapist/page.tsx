import Link from "next/link";
import { ShieldCheck, HeartHandshake, Users, Globe2, Mail, Users2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Hero, { HERO_CONTENT_FALLBACK } from "@/components/Hero";
import PageHero from "@/components/ui/PageHero";
import SupportGroupsInteractive, { SUPPORT_GROUPS_DIRECTORY_CONTENT_FALLBACK } from "@/components/SupportGroupsInteractive";
import CommunityIntro, { CommunityHeroExtras, COMMUNITY_INTRO_FALLBACK } from "@/components/support-groups/CommunityIntro";
import Testimonials from "@/components/home/Testimonials";
import DonateBand, { DONATE_BAND_CONTENT_FALLBACK } from "@/components/home/DonateBand";
import Reveal from "@/components/motion/Reveal";
import VolunteerPrimaryCta from "@/components/volunteer/VolunteerPrimaryCta";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";
import { getPageContent, ABOUT_SECTIONS_FALLBACK, SUPPORT_GROUPS_CONTENT_FALLBACK } from "@/lib/content";
import { getActiveClinicLocations, getActiveTherapists, getSupportGroups, getTestimonials } from "@/lib/queries";
import { resolveEditorPreview } from "@/lib/ui-builder/pageContentResolver";
import EditorPreviewBridge from "@/components/ui-builder/public/EditorPreviewBridge";
import EditableText from "@/components/ui-builder/public/EditableText";

// Phase 217 — Roy asked for the Community page's (`/support-groups`) full
// content — the gold "Community" banner with its Charity/Professional
// Services CTAs, the "Why GESA exists" mission blurb + three-card pathway
// navigator, the real support-group listing/registration flow, and the
// "Stories of Healing" testimonials — moved onto this page, appended after
// the existing Find Support content, and `/support-groups` left
// intentionally empty (see that page's own Phase 217 comment). Confirmed
// with Roy first that this page's own content is the AI Matching/Browse
// Therapist experience that had briefly moved to `/about` in Phase 216 —
// that move is reversed here (this file is, once again, byte-for-byte what
// Phase 145/216 called the "about" content, unchanged below down through
// the Team & Advisors section) so "Find Support" genuinely has the content
// this request describes as already being here. `/about` is now the one
// left intentionally empty instead (see that page's own Phase 217 comment)
// — it's back to being unused for now, a trade-off flagged to Roy rather
// than guessed at silently.
//
// Everything from the "Explore More Ways to Receive Support" heading below
// is new to this file, moved verbatim from app/support-groups/page.tsx:
// same components (PageHero, CommunityHeroExtras, CommunityIntro,
// SupportGroupsInteractive, Testimonials), same content sources/fallbacks,
// same section id (`support-groups-list`, which CommunityIntro's own
// in-page anchors already point at — both components are self-contained,
// so moving them onto a new page needed no internal changes). One
// deliberate exception: Community's own closing `<DonateBand />` is NOT
// duplicated here — this page already ends with its own DonateBand (moved
// down from Phase 75), and DonateBand is "a single component shared
// identically across Home, Our Professionals, and Community" (its own
// Phase 80 comment) — rendering it twice on one page would be a literal
// duplicate section, which Roy's request explicitly asked to avoid.
export const metadata = {
  title: "Find Support — GESA",
  description:
    "Get matched with a verified volunteer therapist — free, confidential, and no account required. Explore every support pathway: AI Matching, Browse Therapist, charity-supported and professional community services, and support groups.",
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
// margin. Phase 217 — SiteFooterSlot's REVEAL_ROUTES now lists
// "/find-your-therapist" again (and no longer "/about" or "/support-groups"
// — both are empty now) to match this page owning the reveal treatment.
//
// Phase 35 — every section on this page (Hero, mission, how-it-works cards,
// founders, the volunteer CTA, the legal blurb) is Content Manager-editable
// via two site_content keys: "page_about_hero" (via the shared Hero
// component) and "page_about_sections" (everything below it). The
// transferred Community sections keep their own separate Content Manager
// wiring too (site_content keys "page_support_groups"/
// "component_support_groups_directory"/"component_community_intro", read
// via the "support-groups" pageKey) — nothing about that CMS wiring changed
// with the move, only which URL the content renders at.
export default async function FindYourTherapistPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const [
    heroContentRaw,
    sectionsRaw,
    donateContentRaw,
    clinicLocations,
    therapists,
    communityContentRaw,
    directoryContentRaw,
    communityIntroRaw,
    groups,
    testimonials,
  ] = await Promise.all([
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
    // Phase 151 — for the Browse Therapist search modal. Phase 217 — this
    // same array is now also passed to CommunityHeroExtras below (the
    // Charity/Professional Services CTAs), which needs the identical active
    // therapist roster — one fetch, two consumers, not a second query.
    getActiveTherapists(),
    getPageContent("page_support_groups", SUPPORT_GROUPS_CONTENT_FALLBACK),
    getPageContent("component_support_groups_directory", SUPPORT_GROUPS_DIRECTORY_CONTENT_FALLBACK),
    getPageContent("component_community_intro", COMMUNITY_INTRO_FALLBACK),
    getSupportGroups(),
    getTestimonials(),
  ]);

  const { resolved, isEditorPreview } = await resolveEditorPreview(
    "about",
    { hero: heroContentRaw, sections: sectionsRaw, donate: donateContentRaw } as unknown as Record<string, unknown>,
    searchParams
  );
  const heroContent = (resolved as unknown as { hero: typeof heroContentRaw }).hero;
  const sections = (resolved as unknown as { sections: typeof sectionsRaw }).sections;
  const donateContent = (resolved as unknown as { donate: typeof donateContentRaw }).donate;

  // Phase 217 — a second, independent resolveEditorPreview call for the
  // transferred Community content, keyed by its own "support-groups"
  // pageKey (unchanged from app/support-groups/page.tsx) so an admin's
  // draft edits to either half of this now-combined page keep resolving
  // against the correct registry/draft-row scope. `wantsPreview`/the
  // admin-role check inside resolveEditorPreview only depends on
  // `searchParams` + the signed-in profile, not on which pageKey was
  // passed, so `isEditorPreview`/`isCommunityEditorPreview` are always
  // identical in practice — either both true (admin previewing) or both
  // false — only which draft row gets applied differs between the two
  // calls.
  const { resolved: communityResolved, isEditorPreview: isCommunityEditorPreview } = await resolveEditorPreview(
    "support-groups",
    { ...communityContentRaw, directory: directoryContentRaw, intro: communityIntroRaw } as unknown as Record<string, unknown>,
    searchParams
  );
  const communityContent = communityResolved as unknown as typeof communityContentRaw;
  const directoryContent = (communityResolved as unknown as { directory: typeof directoryContentRaw }).directory;
  const communityIntro = (communityResolved as unknown as { intro: typeof communityIntroRaw }).intro;

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
          `missionHeading`/`missionBody` rendered further down this page —
          same field name, different content source, not a collision.) */}

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

      {/* Phase 217 — transition section, per Roy's explicit spec, marking
          where the transferred Community content begins. New copy, not
          moved from anywhere — everything below this point (through
          Testimonials) is the former /support-groups page, otherwise
          unchanged. Plain heading/body, matching this page's own
          `bg-background` sections above rather than inventing a new style. */}
      <section className="section bg-background text-center">
        <div className="wrap max-w-[640px]">
          <h2 className="mb-2.5 text-[28px] sm:text-[30px]">Explore More Ways to Receive Support</h2>
          <p className="text-muted-fg">
            Choose the support option that best fits your needs, from charity-supported services to professional care.
          </p>
        </div>
      </section>

      {/* Everything from here down is app/support-groups/page.tsx's own
          content, moved verbatim (same components, same content sources) —
          see this file's own header comment for what was deliberately left
          out (Community's own closing DonateBand, to avoid a literal
          duplicate section on this page). */}
      <PageHero
        gold
        icon={Users2}
        eyebrow={<EditableText contentId="supportGroups.hero.eyebrow" label="Hero eyebrow" value={communityContent.eyebrow} as="span" />}
        title={<EditableText contentId="supportGroups.hero.heading" label="Hero heading" value={communityContent.title} as="span" />}
        description={<EditableText contentId="supportGroups.hero.description" label="Hero description" value={communityContent.description} as="span" />}
      >
        <CommunityHeroExtras content={communityIntro} therapists={therapists} />
      </PageHero>
      <CommunityIntro content={communityIntro} />
      <section id="support-groups-list" className="section wrap pt-0">
        <SupportGroupsInteractive groups={groups} content={directoryContent} />
      </section>
      <Testimonials testimonials={testimonials} />

      {/* Phase 75 — DonateBand moved here from the fixed footer-reveal
          layer (see SiteFooterSlot.tsx) so it's a normal, always-visible
          section instead of part of the hidden-until-scroll effect — only
          the Footer stays inside that reveal layer now. Renders once for
          the whole combined page — see this file's header comment on why
          Community's own second DonateBand call isn't duplicated here. */}
      <DonateBand content={donateContent} />
    </div>
  );

  return isEditorPreview || isCommunityEditorPreview ? <EditorPreviewBridge>{page}</EditorPreviewBridge> : page;
}
