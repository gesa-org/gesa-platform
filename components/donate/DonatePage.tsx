import { Users, Globe, ShieldCheck, Lock, Heart } from "lucide-react";
import VolunteerPrimaryCta from "@/components/volunteer/VolunteerPrimaryCta";
import Reveal from "@/components/motion/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";
import { getPageContent, type DonatePageContent } from "@/lib/content";
import DonateForm from "@/components/donate/DonateForm";
import { resolveEditorPreview } from "@/lib/ui-builder/pageContentResolver";
import EditorPreviewBridge from "@/components/ui-builder/public/EditorPreviewBridge";
import EditableText from "@/components/ui-builder/public/EditableText";

// Phase 98 — Roy sent a reference image for a full donate page (hero,
// giving box, "what your gift helps make possible" icon row, a dark
// "movement" band, a trust-badge row, and a closing crisis-resources line)
// and asked for the header's "JOIN GESA" button to become "DONATE" and open
// this page, with every function in the reference actually working and
// captured by the CRM — see DonateForm.tsx for the interactive giving box
// and gift-intent capture. This file is the static shell around it, styled
// entirely from the site's own existing tokens (--primary/--espresso/
// --accent-soft/--card/--border) rather than inventing new colors, matching
// the reference's black-pill-on-white look via the same --primary token the
// Header's own CTA and the About/Home sections already use.
export const DONATE_PAGE_FALLBACK: DonatePageContent = {
  published: true,
  eyebrow: "Your Choice Creates Impact",
  title: "You can help meaningful support reach someone.",
  subtitle:
    "Across the world, professionals are choosing to gift their time, experience and expertise. Your contribution helps GESA bring that support to eligible people and communities across languages, cultures and borders.",
  boldLine: "Their time is the gift. Your support helps it reach further.",
  heroCtaLabel: "Make support possible",
  givingHeading: "Choose how you would like to contribute",
  onceLabel: "Give once",
  monthlyLabel: "Give monthly",
  amount1: "25",
  amount2: "50",
  amount3: "100",
  customLabel: "Custom amount",
  giftNote: "Every contribution helps move gifted professional support from intention into action.",
  giftCtaLabel: "Make my gift",
  impactHeading: "What your gift helps make possible",
  impact1Title: "Access",
  impact1Description: "Helping eligible people discover and enter the right support pathway.",
  impact2Title: "Connection",
  impact2Description: "Bringing people and professionals together across language and distance.",
  impact3Title: "Continuity",
  impact3Description: "Supporting the coordination and delivery of gifted support programmes.",
  movementHeading: "One choice can carry support across the world.",
  movementSubtitle: "Your contribution becomes part of a global movement built by people who choose to give, participate and create meaningful change.",
  movementCtaLabel: "Be part of the movement",
  movementCtaHref: "/contact?subject=Volunteer",
  trustBadge1Label: "Clear Impact",
  trustBadge2Label: "Secure Contribution",
  trustBadge3Label: "Global Reach",
  trustBadge4Label: "Professional Time, Gifted",
  crisisText: "Need immediate emergency support?",
  crisisLinkLabel: "Find local crisis services.",
  crisisLinkHref: "https://findahelpline.com/",
};

const IMPACT_ICONS = [Users, Globe, ShieldCheck];
const TRUST_ICONS = [ShieldCheck, Lock, Globe, Users];

// Phase 135 — hero band's text is now the visual editor's canvas-selectable
// reference implementation for this page; the impact/movement/trust/crisis
// sections below stay exactly as they render today (their fields are
// registered in pageRegistry.ts and fully draft/publish-able, just not
// wrapped in EditableText yet — see that file's Phase 135 comment). The
// interactive giving box (DonateForm) is deliberately excluded from the
// visual editor entirely, per the spec's own payment-logic guardrail.
export default async function DonatePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
} = {}) {
  const contentRaw = await getPageContent("page_donate", DONATE_PAGE_FALLBACK);
  const { resolved, isEditorPreview } = await resolveEditorPreview("donate", contentRaw as unknown as Record<string, unknown>, searchParams);
  const content = resolved as unknown as typeof contentRaw;
  const crisisLinkIsExternal = content.crisisLinkHref.startsWith("http");

  const impactItems = [
    { title: content.impact1Title, description: content.impact1Description, contentId: "donate.impact.card1Description" },
    { title: content.impact2Title, description: content.impact2Description, contentId: "donate.impact.card2Description" },
    { title: content.impact3Title, description: content.impact3Description, contentId: "donate.impact.card3Description" },
  ];

  const trustBadges = [content.trustBadge1Label, content.trustBadge2Label, content.trustBadge3Label, content.trustBadge4Label];

  const page = (
    <div>
      {/* Hero — plain background, centered text, matching the reference's
          white page with a black pill CTA (reused from --primary, the same
          token the Header's own CTA and Button's "primary" variant use). */}
      <section className="section">
        <div className="wrap max-w-[680px] text-center">
          <Reveal type="fade-up">
            <span className="eyebrow">
              <EditableText contentId="donate.hero.eyebrow" label="Hero eyebrow" value={content.eyebrow} as="span" />
            </span>
            <h1 className="mt-3 font-serif text-[38px] font-semibold leading-tight text-foreground sm:text-[44px]">
              <EditableText contentId="donate.hero.heading" label="Hero heading" value={content.title} as="span" />
            </h1>
            <div className="mx-auto mt-5 max-w-[520px] text-[16px] leading-relaxed text-muted-fg">
              <EditableText contentId="donate.hero.description" label="Hero description" value={content.subtitle} as="span" />
            </div>
            <p className="mt-3 font-semibold text-foreground">
              <EditableText contentId="donate.hero.boldLine" label="Hero bold line" value={content.boldLine} as="span" />
            </p>
            <a
              href="#giving-box"
              className="mt-7 inline-flex items-center justify-center rounded-full bg-primary px-7 py-3.5 text-[13px] font-semibold uppercase tracking-wide text-primary-fg shadow-soft transition-all hover:-translate-y-px hover:bg-primary-600"
            >
              <EditableText contentId="donate.hero.ctaLabel" label="Hero CTA label" value={content.heroCtaLabel} as="span" />
            </a>
          </Reveal>
        </div>
      </section>

      {/* Giving box — the interactive part, see DonateForm.tsx. */}
      <section className="pb-16">
        <div className="wrap">
          <Reveal type="fade-up">
            <DonateForm content={content} />
          </Reveal>
        </div>
      </section>

      {/* "What your gift helps make possible" — three icon cards. */}
      <section className="section border-t border-border bg-background">
        <div className="wrap">
          <h2 className="mb-9 text-center font-serif text-[26px] font-semibold text-foreground">{content.impactHeading}</h2>
          <StaggerGroup className="grid gap-6 sm:grid-cols-3">
            {impactItems.map((item, i) => {
              const Icon = IMPACT_ICONS[i];
              return (
                <StaggerItem key={item.title} className="rounded-[var(--radius)] border border-border bg-card p-7 text-center">
                  <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-primary">
                    <Icon size={24} />
                  </span>
                  <h3 className="mb-1.5 text-[13px] font-bold uppercase tracking-wide text-primary">{item.title}</h3>
                  <div className="text-[14px] leading-relaxed text-muted-fg">
                    <EditableText contentId={item.contentId} label="Impact card description" value={item.description} as="span" />
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      {/* Movement band — dark full-bleed section, matching the reference's
          dark CTA block. Reuses --espresso, the site's one true dark
          surface (otherwise only used by the Footer), same as the reference
          image's contrast block. "Be part of the movement" opens the real
          volunteer application modal by default (VolunteerPrimaryCta),
          exactly like the About page's own movement CTA. */}
      <section className="bg-espresso py-16 text-center text-[#c7d0de]">
        <div className="wrap max-w-[620px]">
          <h2 className="mb-3 font-serif text-[26px] font-semibold text-white">{content.movementHeading}</h2>
          <p className="mb-6 leading-relaxed">{content.movementSubtitle}</p>
          <VolunteerPrimaryCta
            href={content.movementCtaHref}
            className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-[13px] font-semibold uppercase tracking-wide text-espresso transition-all hover:-translate-y-px hover:bg-white/90"
          >
            {content.movementCtaLabel}
          </VolunteerPrimaryCta>
        </div>
      </section>

      {/* Trust badges row. */}
      <section className="border-b border-border bg-sage-soft py-10">
        <StaggerGroup className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-center gap-x-12 gap-y-6 px-6 sm:justify-between">
          {trustBadges.map((label, i) => {
            const Icon = TRUST_ICONS[i] ?? TRUST_ICONS[TRUST_ICONS.length - 1];
            return (
              <StaggerItem key={label} className="flex items-center gap-3.5">
                <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-card text-primary shadow-sm">
                  <Icon size={22} />
                </span>
                <span className="max-w-[130px] text-left text-[13px] font-semibold uppercase leading-snug tracking-wide text-primary">
                  {label}
                </span>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </section>

      {/* Closing crisis-resources line — same real, functioning external
          link pattern as DonateBand's own crisis line. */}
      <p className="flex items-center justify-center gap-1.5 px-6 py-6 text-center text-[14px] text-muted-fg">
        <Heart size={15} className="flex-none" />
        {content.crisisText}{" "}
        <a
          href={content.crisisLinkHref}
          target={crisisLinkIsExternal ? "_blank" : undefined}
          rel={crisisLinkIsExternal ? "noreferrer" : undefined}
          className="underline underline-offset-2 hover:text-primary"
        >
          {content.crisisLinkLabel}
        </a>
      </p>
    </div>
  );

  return isEditorPreview ? <EditorPreviewBridge>{page}</EditorPreviewBridge> : page;
}
