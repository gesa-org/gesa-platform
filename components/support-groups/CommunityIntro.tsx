"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Card from "@/components/ui/Card";
import Reveal from "@/components/motion/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";
import CommunityServiceModal from "@/components/support-groups/CommunityServiceModal";
import type { CommunityIntroContent } from "@/lib/content";
import type { PublicTherapistRow } from "@/lib/database.types";
import EditableText from "@/components/ui-builder/public/EditableText";

// Phase 107 — Roy sent a wireframe of a new hero-buttons row, a "Why GESA
// exists" mission blurb, a three-card pathway navigator, and a closing band
// for the Support Groups page (labeled "Community" in the live nav, Phase
// 105), asking for this exact layout/copy while keeping the page's real
// group-listing/registration flow (SupportGroupsInteractive) below it,
// unchanged — confirmed both over AskUserQuestion before building this.
// This component is everything between the page's existing PageHero banner
// (unchanged) and that existing registration flow.
//
// The three pathway cards were confirmed to be general site-wide
// navigation (crisis intake, the therapist directory, this same page's own
// group listing further down) rather than something specific to browsing
// support groups — same reasoning as Home's own three path cards, just
// phrased for this page's "choose your next step" framing. Card numbers
// (01/02/03) are fixed by position, not editable, same precedent as Home's
// per-card icons.
//
// The wireframe had a large empty gap between the pathway cards and the
// closing band — an artifact of its plain, unstyled export, not an
// intentional design element — so this component uses the site's normal
// section padding throughout instead of reproducing that gap.
export const COMMUNITY_INTRO_FALLBACK: CommunityIntroContent = {
  published: true,
  heroPrimaryLabel: "Explore Your Options",
  heroPrimaryHref: "#pathways",
  heroSecondaryLabel: "Join The Movement",
  heroSecondaryHref: "/contact?subject=Volunteer",
  tagline1Label: "Global Community",
  tagline1Href: "#support-groups-list",
  tagline2Label: "Independent Professionals",
  tagline2Href: "/therapists",
  tagline3Label: "Gifted Support",
  tagline3Href: "/intake?path=crisis",
  missionHeading: "Why GESA exists",
  missionBody:
    "Every person deserves space to feel seen, supported and empowered to grow. GESA was created to make emotional support easier to discover and access. We bring together independent professionals, gifted professional time and supportive communities within one global ecosystem, so more people can choose a meaningful next step.",
  card1Eyebrow: "Support after a crisis",
  card1Title: "Access gifted professional support",
  card1Body:
    "For eligible people and communities affected by crisis, verified professionals contribute their time and expertise through a limited number of gifted sessions.",
  card1CtaLabel: "Explore Gifted Support",
  card1CtaHref: "/intake?path=crisis",
  card2Eyebrow: "Find independent support",
  card2Title: "Choose the professional who feels right for you",
  card2Body: "Explore independent professionals by area of support, language, approach, availability and fee.",
  card2CtaLabel: "Find My Support",
  card2CtaHref: "/therapists",
  card3Eyebrow: "Grow in community",
  card3Title: "Connect, participate and move forward together",
  card3Body: "Discover groups, conversations and shared spaces created to support connection, strength and growth.",
  card3CtaLabel: "Explore Community",
  card3CtaHref: "#support-groups-list",
  closingHeading: "One global vision. Many ways forward.",
  closingSubtitle: "Choose the pathway that reflects what you need today.",
};

// Phase 159 — briefly switched the secondary button and tagline row to
// white to stay legible on a deep-navy gold-banner background; reverted
// alongside the rest of that phase once Roy said the new color didn't work
// on the live site.
//
// Phase 196 — Roy asked for these two hero buttons repurposed entirely: from
// "Explore Your Options" (a plain #pathways anchor link) and "Join The
// Movement" (opened the volunteer/therapist application modal — recruiting,
// not client booking) to "Charity Services" and "Professional Services",
// each opening a client-facing booking search (CommunityServiceModal). The
// underlying `content.heroPrimaryLabel/heroPrimaryHref/heroSecondaryLabel/
// heroSecondaryHref` Content Manager fields are left in the data model
// untouched (same "don't delete data just because a section stopped
// rendering it" precedent as this file's own Phase 108 comment below) but
// are no longer read here — the new labels and behavior are fixed, per
// Roy's exact spec, not admin-editable text/links anymore.
export function CommunityHeroExtras({
  content,
  therapists,
}: {
  content: CommunityIntroContent;
  // Phase 196 — the active roster, needed so the two new CTAs can open a
  // real therapist search (see CommunityServiceModal). Defaults to [] so
  // this component doesn't become required-prop-breaking for any other
  // caller, though PageHero's own children slot on the Community page is
  // the only place this renders today.
  therapists?: PublicTherapistRow[];
}) {
  const [openService, setOpenService] = useState<"charity" | "professional" | null>(null);
  return (
    <>
      <StaggerItem>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setOpenService("charity")}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[13px] font-semibold uppercase tracking-wide text-white shadow-soft transition-all hover:-translate-y-px hover:bg-primary-600"
          >
            Charity Services
          </button>
          <button
            type="button"
            onClick={() => setOpenService("professional")}
            className="inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-primary bg-transparent px-7 py-3.5 text-[13px] font-semibold uppercase tracking-wide text-primary transition-all hover:-translate-y-px hover:bg-white/40"
          >
            Professional Services
          </button>
        </div>
        {openService && (
          <CommunityServiceModal
            open
            onClose={() => setOpenService(null)}
            therapists={therapists ?? []}
            serviceType={openService}
          />
        )}
      </StaggerItem>
      <StaggerItem>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[13px] font-medium text-primary/80">
          <Link href={content.tagline1Href} className="hover:text-primary hover:underline">
            {content.tagline1Label}
          </Link>
          <span aria-hidden="true">·</span>
          <Link href={content.tagline2Href} className="hover:text-primary hover:underline">
            {content.tagline2Label}
          </Link>
          <span aria-hidden="true">·</span>
          <Link href={content.tagline3Href} className="hover:text-primary hover:underline">
            {content.tagline3Label}
          </Link>
        </div>
      </StaggerItem>
    </>
  );
}

export default function CommunityIntro({ content }: { content: CommunityIntroContent }) {
  const cards = [
    {
      eyebrow: content.card1Eyebrow,
      title: content.card1Title,
      body: content.card1Body,
      bodyContentId: "supportGroups.intro.card1Body",
      ctaLabel: content.card1CtaLabel,
      ctaHref: content.card1CtaHref,
    },
    {
      eyebrow: content.card2Eyebrow,
      title: content.card2Title,
      body: content.card2Body,
      bodyContentId: "supportGroups.intro.card2Body",
      ctaLabel: content.card2CtaLabel,
      ctaHref: content.card2CtaHref,
    },
    {
      eyebrow: content.card3Eyebrow,
      title: content.card3Title,
      body: content.card3Body,
      bodyContentId: "supportGroups.intro.card3Body",
      ctaLabel: content.card3CtaLabel,
      ctaHref: content.card3CtaHref,
    },
  ];

  return (
    <>
      {/* Phase 109 — Roy first asked for this section's background to
          match the site's ivory tone; switched bg-muted (--muted:
          #b7c3d6, a real blue-gray, not ivory) to bg-background
          (--background: #eef1f6, "Powder Ivory" in globals.css).
          Phase 110 — Roy then sent a specific swatch, "Warm Ivory"
          #F2EFE6, hardcoded as a literal arbitrary value since it didn't
          match any existing token.
          Later — Roy sent a new swatch, "Sand Brown" #CBA560, and asked to
          replace this "beige"/warm-ivory background (this is the "Why GESA
          exists" section) along with About's Founder spotlight and Our
          Professionals' directory band. Moved onto the new --sand-brown
          token (app/globals.css) rather than another hardcoded hex, since
          this is now the third section sharing this exact color. */}
      {/* Phase 228 — Roy sent a reference screenshot of this section (plus
          two on the About page) and asked all three to switch to "Sage
          Green" — the same --green-sage token (#9BA689) already used on
          Home's icon-badge row (components/home/Stats.tsx). `bg-sand-brown`
          -> `bg-green-sage` here; About's Founder spotlight and Our
          Professionals' directory band were NOT part of this request and
          stay on --sand-brown. */}
      <section className="section bg-green-sage">
        <Reveal type="fade-up" as="div" className="wrap max-w-[720px] text-center">
          <h2 className="mb-3 text-[30px]">{content.missionHeading}</h2>
          <div className="text-[15.5px] leading-relaxed text-muted-fg">
            <EditableText contentId="supportGroups.intro.missionBody" label="Mission body" value={content.missionBody} as="span" />
          </div>
        </Reveal>
      </section>

      {/* Phase 231 — Roy sent a reference screenshot of this "Choose your
          pathway" section (plus About's movement band and Founder
          spotlight) and asked it to switch to the same deep navy (~#0B1F3A)
          as the footer's "Help us grow" card — see app/globals.css's
          --navy-deep comment. The 3 cards below sit on their own light
          `bg-card` (via the shared <Card> component) regardless of what the
          section around them does, so only this section's own background
          and the "Choose your pathway" heading (previously unset/dark
          default) needed to change. */}
      <section id="pathways" className="section bg-navy-deep">
        <div className="wrap">
          <Reveal type="fade-up" className="block">
            <h2 className="text-center text-[30px] mb-8 text-white">Choose your pathway</h2>
          </Reveal>
          <StaggerGroup className="grid gap-5 sm:grid-cols-3">
            {cards.map((c, i) => (
              <StaggerItem key={c.title}>
                <Card className="flex h-full flex-col">
                  <span className="mb-3 text-[13px] font-semibold text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <span className="eyebrow mb-2 text-primary">{c.eyebrow}</span>
                  <h3 className="mb-2 text-[19px]">{c.title}</h3>
                  <div className="mb-5 flex-1 text-[14px] text-muted-fg">
                    <EditableText contentId={c.bodyContentId} label="Pathway card body" value={c.body} as="span" />
                  </div>
                  <Link
                    href={c.ctaHref}
                    className="inline-flex items-center justify-center gap-1.5 self-start rounded-full bg-primary px-5 py-2.5 text-[12.5px] font-semibold uppercase tracking-wide text-white transition-all hover:-translate-y-px hover:bg-primary-600"
                  >
                    {c.ctaLabel} <ArrowRight size={13} />
                  </Link>
                </Card>
              </StaggerItem>
            ))}
          </StaggerGroup>

          {/* Phase 244 — Roy sent a reference screenshot of this exact
              "Choose your pathway" section with the "One global vision.
              Many ways forward." / "Choose the pathway that reflects what
              you need today." copy sitting directly below the three cards,
              still inside the same dark-navy band (no visible seam,
              matching the screenshot's continuous background) — effectively
              asking for the Phase 108 removal to be undone. `closingHeading`/
              `closingSubtitle` were deliberately left in the content model/
              admin editor when that phase removed their render (see the
              precedent this comment used to sit under), so no data or
              schema change is needed here — only bringing back the JSX,
              rendered plainly beneath the card grid rather than as its own
              separate `<section>`. `mt-14` gives clear separation from the
              cards above, and this section's own `.section` padding-bottom
              (64px desktop / 44px mobile, globals.css) already gives clear
              separation from DonateBand's "Be part of the change" band
              directly below, so no extra bottom margin was needed.
              Phase 244 round 2 — Roy asked for this specifically as plain
              supporting text, not another heading (this section already has
              one semantic <h2>, "Choose your pathway", above the cards), so
              both lines render as <p> rather than the <h2>/<div> pairing
              this used to have — same centered, `text-white`/`text-white/80`
              look as before, just non-heading markup. */}
          <Reveal type="fade-up" className="mt-14 block text-center">
            <p className="mx-auto max-w-[640px] text-[19px] font-medium leading-snug text-white sm:text-[21px]">
              <EditableText contentId="supportGroups.intro.closingHeading" label="Closing band heading" value={content.closingHeading} as="span" />
            </p>
            <p className="mx-auto mt-2.5 max-w-[640px] text-[15px] text-white/80">
              <EditableText contentId="supportGroups.intro.closingSubtitle" label="Closing band subtitle" value={content.closingSubtitle} as="span" />
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
