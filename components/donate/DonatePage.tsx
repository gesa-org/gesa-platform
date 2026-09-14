import { Users, Globe, ShieldCheck, Quote } from "lucide-react";
import VolunteerPrimaryCta from "@/components/volunteer/VolunteerPrimaryCta";
import Reveal from "@/components/motion/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";
import { getPageContent, type DonatePageContent } from "@/lib/content";
import DonateForm from "@/components/donate/DonateForm";
import { resolveEditorPreview } from "@/lib/ui-builder/pageContentResolver";
import EditorPreviewBridge from "@/components/ui-builder/public/EditorPreviewBridge";
import EditableText from "@/components/ui-builder/public/EditableText";
import EditableImage from "@/components/ui-builder/public/EditableImage";

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
// unchanged.
//
// Phase 201 briefly wired these 3 photos to a standalone "Media Library"
// tab in Content Manager (immediate-effect assign, no draft/publish gating).
// Phase 202 replaced that for these specific slots with real UI Builder
// fields (type "image"/"altText" in pageRegistry.ts) so an admin can
// upload/preview/publish/discard them exactly like every text field on this
// page — see EditableImage.tsx and EXECUTION_PLAN.md Phase 202 for the full
// mechanism and why. The general-purpose Media Library tab still exists for
// other, not-yet-migrated use cases. This file is the static shell around it, styled
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
  // Phase 202 — the actual photo files. These are the exact 3 real
  // photographs Roy provided (a community support circle, a one-on-one
  // bench conversation, an AVP Toolkit training session) — same literal
  // defaults Phase 200/201 already shipped, now living as real UI Builder
  // fields (type "image"/"altText") instead of a hardcoded array, so an
  // admin can upload/replace them from Admin > UI Builder > Page Content >
  // Donate. Per requirement #7 ("preserve backward compatibility by using
  // the current static images as defaults for existing records"), these
  // exact values are what every existing published `page_donate` row will
  // resolve to until an admin explicitly replaces one via the Inspector.
  photo1Image: "/images/donate/community-support-circle.jpg",
  photo1ImageAlt: "A GESA-supported community gathered in an outdoor support circle, seated together under trees",
  photo2Image: "/images/donate/one-on-one-conversation.jpg",
  photo2ImageAlt: "Two women in conversation on a bench, one taking notes during a one-on-one support session",
  photo3Image: "/images/donate/avp-toolkit-training.jpg",
  photo3ImageAlt: "A facilitator leading an AVP Toolkit training session for a full room of participants",
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

// Phase 202 — last-resort fallback if a published/draft image URL 404s or
// otherwise fails to load client-side (requirement: "include safe fallback
// images/behavior if an image URL is missing or fails to load"). Deliberately
// the same real photo Phase 200/201 shipped for each slot, not a generic
// placeholder — see EditableImage's onImgError usage below.
const PHOTO_ONERROR_FALLBACK = [
  { src: "/images/donate/community-support-circle.jpg", alt: "Community support" },
  { src: "/images/donate/one-on-one-conversation.jpg", alt: "One-on-one support conversation" },
  { src: "/images/donate/avp-toolkit-training.jpg", alt: "AVP Toolkit training session" },
] as const;

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
  const impactItems = [
    { title: content.impact1Title, description: content.impact1Description, contentId: "donate.impact.card1Description" },
    { title: content.impact2Title, description: content.impact2Description, contentId: "donate.impact.card2Description" },
    { title: content.impact3Title, description: content.impact3Description, contentId: "donate.impact.card3Description" },
  ];


  // Phase 202 — src/alt now come straight from the resolved page content
  // (draft-aware in editor preview, published on the live site — same
  // `resolveEditorPreview` layering every text field on this page already
  // gets), not a separate Media Library lookup. See this file's top-of-file
  // Phase 202 comment for why that superseded Phase 201's approach here.
  const whySupportPhotos = [
    {
      src: content.photo1Image,
      alt: content.photo1ImageAlt,
      fallback: PHOTO_ONERROR_FALLBACK[0],
      category: content.photo1Category,
      caption: content.photo1Caption,
      imageContentId: "donate.whySupport.photo1Image",
      altContentId: "donate.whySupport.photo1ImageAlt",
      categoryContentId: "donate.whySupport.photo1Category",
      captionContentId: "donate.whySupport.photo1Caption",
    },
    {
      src: content.photo2Image,
      alt: content.photo2ImageAlt,
      fallback: PHOTO_ONERROR_FALLBACK[1],
      category: content.photo2Category,
      caption: content.photo2Caption,
      imageContentId: "donate.whySupport.photo2Image",
      altContentId: "donate.whySupport.photo2ImageAlt",
      categoryContentId: "donate.whySupport.photo2Category",
      captionContentId: "donate.whySupport.photo2Caption",
    },
    {
      src: content.photo3Image,
      alt: content.photo3ImageAlt,
      fallback: PHOTO_ONERROR_FALLBACK[2],
      category: content.photo3Category,
      caption: content.photo3Caption,
      imageContentId: "donate.whySupport.photo3Image",
      altContentId: "donate.whySupport.photo3ImageAlt",
      categoryContentId: "donate.whySupport.photo3Category",
      captionContentId: "donate.whySupport.photo3Caption",
    },
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
              <StaggerItem key={photo.imageContentId} className="overflow-hidden rounded-[var(--radius)] border border-border bg-card shadow-soft">
                {/* Phase 202 — fixed aspect-ratio container (unchanged from
                    Phase 200) means swapping the image never shifts layout,
                    regardless of the uploaded photo's own dimensions. */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-accent-soft">
                  <EditableImage
                    contentId={photo.imageContentId}
                    altContentId={photo.altContentId}
                    label={`Photo image (${photo.category || "untitled"})`}
                    src={photo.src}
                    alt={photo.alt}
                    fallbackSrc={photo.fallback.src}
                    fallbackAlt={photo.fallback.alt}
                    className="h-full w-full object-cover"
                  />
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

    </div>
  );

  return isEditorPreview ? <EditorPreviewBridge>{page}</EditorPreviewBridge> : page;
}
