import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Card from "@/components/ui/Card";
import Reveal from "@/components/motion/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";
import VolunteerPrimaryCta from "@/components/volunteer/VolunteerPrimaryCta";
import type { CommunityIntroContent } from "@/lib/content";

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

export function CommunityHeroExtras({ content }: { content: CommunityIntroContent }) {
  return (
    <>
      <StaggerItem>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={content.heroPrimaryHref}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[13px] font-semibold uppercase tracking-wide text-white shadow-soft transition-all hover:-translate-y-px hover:bg-primary-600"
          >
            {content.heroPrimaryLabel}
          </Link>
          <VolunteerPrimaryCta
            href={content.heroSecondaryHref}
            className="inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-primary bg-transparent px-7 py-3.5 text-[13px] font-semibold uppercase tracking-wide text-primary transition-all hover:-translate-y-px hover:bg-white/40"
          >
            {content.heroSecondaryLabel}
          </VolunteerPrimaryCta>
        </div>
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
      ctaLabel: content.card1CtaLabel,
      ctaHref: content.card1CtaHref,
    },
    {
      eyebrow: content.card2Eyebrow,
      title: content.card2Title,
      body: content.card2Body,
      ctaLabel: content.card2CtaLabel,
      ctaHref: content.card2CtaHref,
    },
    {
      eyebrow: content.card3Eyebrow,
      title: content.card3Title,
      body: content.card3Body,
      ctaLabel: content.card3CtaLabel,
      ctaHref: content.card3CtaHref,
    },
  ];

  return (
    <>
      <section className="section bg-muted">
        <Reveal type="fade-up" as="div" className="wrap max-w-[720px] text-center">
          <h2 className="mb-3 text-[30px]">{content.missionHeading}</h2>
          <p className="text-[15.5px] leading-relaxed text-muted-fg">{content.missionBody}</p>
        </Reveal>
      </section>

      <section id="pathways" className="section">
        <div className="wrap">
          <Reveal type="fade-up" className="block">
            <h2 className="text-center text-[30px] mb-8">Choose your pathway</h2>
          </Reveal>
          <StaggerGroup className="grid gap-5 sm:grid-cols-3">
            {cards.map((c, i) => (
              <StaggerItem key={c.title}>
                <Card className="flex h-full flex-col">
                  <span className="mb-3 text-[13px] font-semibold text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <span className="eyebrow mb-2 text-primary">{c.eyebrow}</span>
                  <h3 className="mb-2 text-[19px]">{c.title}</h3>
                  <p className="mb-5 flex-1 text-[14px] text-muted-fg">{c.body}</p>
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
        </div>
      </section>

      <section className="section bg-clay-soft">
        <Reveal type="fade-up" as="div" className="wrap max-w-[640px] text-center">
          <h2 className="mb-2.5 text-[28px] sm:text-[30px]">{content.closingHeading}</h2>
          <p className="text-muted-fg">{content.closingSubtitle}</p>
        </Reveal>
      </section>
    </>
  );
}
