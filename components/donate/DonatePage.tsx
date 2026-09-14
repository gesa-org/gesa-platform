import { Users, Globe, ShieldCheck, Lock, Heart, Quote } from "lucide-react";
import VolunteerPrimaryCta from "@/components/volunteer/VolunteerPrimaryCta";
import Reveal from "@/components/motion/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";
import { getPageContent, type DonatePageContent } from "@/lib/content";
import DonateForm from "@/components/donate/DonateForm";
import { resolveEditorPreview } from "@/lib/ui-builder/pageContentResolver";
import EditorPreviewBridge from "@/components/ui-builder/public/EditorPreviewBridge";
import EditableText from "@/components/ui-builder/public/EditableText";
import { getMediaAssetsForPage, type MediaAssetWithUrl } from "@/lib/media";

// Phase 98 — Roy sent a reference image for a full donate page (hero,
// giving box, "what your gift helps make possible" icon row, a dark
// "movement" band, a trust-badge row, and a closing crisis-resources line)
// and asked for the header's "JOIN GESA" button to become "DONATE" and open
// this page, with every function in the reference actually working and
// captured by the CRM — see DonateForm.tsx for the interactive giving box
// and gift-intent capture.
//
// Phase 200 — Roy sent a separate reference doc ("Website ideas
// 14_9_26.pdf", Page 5 — "Donation - ideas") laying out a photo-led
// PHOTO -> STORY -> HUMAN VOICE -> IMPACT -> DONATION -> THANK YOU flow for
// this page, along with 3 real photographs to use in it. His follow-up
// message explicitly narrowed the ask to that Page 5 section using those
// photos, and said nothing about replacing the working Mollie flow with the
// doc's own generic Stripe/PayPal boilerplate — so DonateForm.tsx is
// untouched here. Added: a "Why your support matters" 3-photo section
// (Therapy/Education/Wellbeing, captions straight from the doc) and a
// Testimonials section, both slotted around the existing giving box. The
// existing impact-icon row, movement band, trust badges, and crisis line
// already cover the doc's "impact" and "closing CTA" beats, so they're
// unchanged. This file is the static shell around it, styled
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
  // Phase 200 — captions are taken directly from Roy's own reference doc
  // ("Website ideas 14_9_26.pdf", Page 5, section 2), not invented here.
  whySupportHeading: "Why your support matters",
  photo1Category: "Therapy",
  photo1Caption: "Creating access to support and therapeutic care.",
  photo2Category: "Education",
  photo2Caption: "Sharing knowledge and tools that can create lasting change.",
  photo3Category: "Wellbeing",
  photo3Caption: "Helping people and communities build healthier, more connected futures.",
  // Phase 200 — these two quotes are the reference doc's own worked
  // examples, not real GESA testimonials. Roy's doc is explicit that only
  // real, permissioned testimonials should go live — treat these as
  // placeholders to replace via the Content Manager before publishing.
  testimonialsHeading: "In their own words",
  testimonial1Quote: "The support gave me hope when I didn't know where to turn. I felt heard, understood and not alone.",
  testimonial1Author: "Programme participant",
  testimonial2Quote: "What makes GESA different is the way it connects therapy with education and community.",
  testimonial2Author: "Name / Role",
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

// Phase 200 — the 3 real, authentic photographs Roy provided for this page
// (not stock photography): a community support circle, a one-on-one
// conversation on a bench, and an AVP Toolkit training session.
//
// Phase 201 — these are now the *fallback* only. The real, current image
// for each slot is looked up at request time from the new Media Library
// (lib/media.ts, keyed "page_donate" / "whySupport.photo1|2|3") so Roy can
// upload/replace these photos himself from Content Manager > Media Library
// without a code change — this array only renders if nothing has been
// uploaded there yet, same "never render blank" fallback contract every
// other CMS-backed field on this site already follows.
const WHY_SUPPORT_PHOTOS = [
  {
    src: "/images/donate/community-support-circle.jpg",
    alt: "A GESA-supported community gathered in an outdoor support circle, seated together under trees",
  },
  {
    src: "/images/donate/one-on-one-conversation.jpg",
    alt: "Two women in conversation on a bench, one taking notes during a one-on-one support session",
  },
  {
    src: "/images/donate/avp-toolkit-training.jpg",
    alt: "A facilitator leading an AVP Toolkit training session for a full room of participants",
  },
] as const;

// Phase 201 — small helper so the three whySupportPhotos entries above stay
// readable: returns {src, alt} from the Media Library if that section key
// has an assigned asset, or {} (spreads to nothing, leaving the hardcoded
// fallback in place) if not.
function mediaOverride(
  mediaBySlot: Map<string, MediaAssetWithUrl>,
  sectionKey: string
): { src: string; alt: string } | Record<string, never> {
  const asset = mediaBySlot.get(sectionKey);
  if (!asset) return {};
  return { src: asset.publicUrl, alt: asset.alt_text || asset.file_name };
}

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
  const [contentRaw, mediaBySlot] = await Promise.all([
    getPageContent("page_donate", DONATE_PAGE_FALLBACK),
    getMediaAssetsForPage("page_donate"),
  ]);
  const { resolved, isEditorPreview } = await resolveEditorPreview("donate", contentRaw as unknown as Record<string, unknown>, searchParams);
  const content = resolved as unknown as typeof contentRaw;
  const crisisLinkIsExternal = content.crisisLinkHref.startsWith("http");

  const impactItems = [
    { title: content.impact1Title, description: content.impact1Description, contentId: "donate.impact.card1Description" },
    { title: content.impact2Title, description: content.impact2Description, contentId: "donate.impact.card2Description" },
    { title: content.impact3Title, description: content.impact3Description, contentId: "donate.impact.card3Description" },
  ];

  const trustBadges = [content.trustBadge1Label, content.trustBadge2Label, content.trustBadge3Label, content.trustBadge4Label];

  // Phase 201 — Media Library asset wins over the hardcoded fallback when
  // one has been assigned to that slot (see WHY_SUPPORT_PHOTOS's own
  // comment above). "src"/"alt" only change if a real upload exists;
  // category/caption text is unaffected either way — those are still plain
  // site_content fields, not part of the Media Library.
  const whySupportPhotos = [
    { ...WHY_SUPPORT_PHOTOS[0], ...mediaOverride(mediaBySlot, "whySupport.photo1"), category: content.photo1Category, caption: content.photo1Caption, categoryContentId: "donate.whySupport.photo1Category", captionContentId: "donate.whySupport.photo1Caption" },
    { ...WHY_SUPPORT_PHOTOS[1], ...mediaOverride(mediaBySlot, "whySupport.photo2"), category: content.photo2Category, caption: content.photo2Caption, categoryContentId: "donate.whySupport.photo2Category", captionContentId: "donate.whySupport.photo2Caption" },
    { ...WHY_SUPPORT_PHOTOS[2], ...mediaOverride(mediaBySlot, "whySupport.photo3"), category: content.photo3Category, caption: content.photo3Caption, categoryContentId: "donate.whySupport.photo3Category", captionContentId: "donate.whySupport.photo3Caption" },
  ];

  const testimonials = [
    { quote: content.testimonial1Quote, author: content.testimonial1Author, quoteId: "donate.testimonials.quote1", authorId: "donate.testimonials.author1" },
    { quote: content.testimonial2Quote, author: content.testimonial2Author, quoteId: "donate.testimonials.quote2", authorId: "donate.testimonials.author2" },
  ];

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

      {/* "Why your support matters" — Phase 200: 3 real photographs (not
          stock images) with a short category label and caption each, per
          Roy's reference doc ("Website ideas 14_9_26.pdf", Page 5, section
          2 — "Use 3 strong photographs rather than lots of text"). Sits
          between the hero and the giving box, same position the reference
          doc's own page order puts it in. */}
      <section className="section border-t border-border bg-background">
        <div className="wrap">
          <Reveal type="fade-up">
            <h2 className="mb-9 text-center font-serif text-[26px] font-semibold text-foreground">
              <EditableText contentId="donate.whySupport.heading" label="Why your support matters heading" value={content.whySupportHeading} as="span" />
            </h2>
          </Reveal>
          <StaggerGroup className="grid gap-6 sm:grid-cols-3">
            {whySupportPhotos.map((photo) => (
              <StaggerItem key={photo.src} className="overflow-hidden rounded-[var(--radius)] border border-border bg-card shadow-soft">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-accent-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.src} alt={photo.alt} className="h-full w-full object-cover" />
                </div>
                <div className="p-5">
                  <h3 className="mb-1.5 text-[13px] font-bold uppercase tracking-wide text-primary">
                    <EditableText contentId={photo.categoryContentId} label="Photo category label" value={photo.category} as="span" />
                  </h3>
                  <p className="text-[14px] leading-relaxed text-muted-fg">
                    <EditableText contentId={photo.captionContentId} label="Photo caption" value={photo.caption} as="span" />
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Giving box — the interactive part, see DonateForm.tsx. Kept
          exactly as-is (Mollie, not Stripe) per Roy's own clarification —
          only the sections around it changed for Phase 200. */}
      <section className="pb-16">
        <div className="wrap">
          <Reveal type="fade-up">
            <DonateForm content={content} />
          </Reveal>
        </div>
      </section>

      {/* Testimonials — Phase 200. Roy's reference doc flags this as one of
          the most important sections on the page. The two quotes shipped in
          DONATE_PAGE_FALLBACK are the doc's own worked examples, not real
          GESA testimonials yet — see that file's Phase 200 comment and
          EXECUTION_PLAN.md before treating this section as publish-ready. */}
      <section className="section border-t border-border bg-sage-soft/40">
        <div className="wrap max-w-[820px]">
          <Reveal type="fade-up">
            <h2 className="mb-9 text-center font-serif text-[26px] font-semibold text-foreground">
              <EditableText contentId="donate.testimonials.heading" label="Testimonials heading" value={content.testimonialsHeading} as="span" />
            </h2>
          </Reveal>
          <StaggerGroup className="grid gap-6 sm:grid-cols-2">
            {testimonials.map((t) => (
              <StaggerItem key={t.quoteId} className="rounded-[var(--radius)] border border-border bg-card p-7 shadow-soft">
                <Quote className="mb-3 text-primary/40" size={22} />
                <p className="mb-4 text-[15px] italic leading-relaxed text-foreground">
                  “<EditableText contentId={t.quoteId} label="Testimonial quote" value={t.quote} as="span" />”
                </p>
                <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-fg">
                  — <EditableText contentId={t.authorId} label="Testimonial attribution" value={t.author} as="span" />
                </p>
              </StaggerItem>
            ))}
          </StaggerGroup>
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
