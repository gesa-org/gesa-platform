import { Users, Globe, ShieldCheck, Quote } from "lucide-react";
import Reveal from "@/components/motion/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";
import { getPageContent, type DonatePageContent } from "@/lib/content";
import DonateForm from "@/components/donate/DonateForm";
import { resolveEditorPreview } from "@/lib/ui-builder/pageContentResolver";
import EditorPreviewBridge from "@/components/ui-builder/public/EditorPreviewBridge";
import EditableText from "@/components/ui-builder/public/EditableText";
import EditableImage from "@/components/ui-builder/public/EditableImage";
import DottedGlobe from "@/components/donate/DottedGlobe";
import DonateHeroBackground from "@/components/donate/DonateHeroBackground";
import ParallaxLayer from "@/components/motion/ParallaxLayer";
import ImpactGallery from "@/components/donate/ImpactGallery";
import FounderMessage from "@/components/donate/FounderMessage";
import DonateCtaButton from "@/components/donate/DonateCtaButton";

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
  // Phase 223 — the 3 floating hero photos from Roy's "BG Donate Page.jpg"
  // reference mockup. No local asset exists for the actual video-call/
  // volunteer/clinical-team photos in that mockup (see EXECUTION_PLAN.md
  // Phase 223 — bash was down this session so they couldn't be cropped out
  // of the mockup file and copied into public/), so these default to the
  // same 3 real GESA photographs already in use in the "Why your support
  // matters" section below, purely so the hero never shows a broken image
  // before Roy uploads the actual mockup photos via Admin > UI Builder >
  // Page Content > Donate > "Hero photos" (same upload flow as every other
  // image field on this page).
  heroPhoto1Image: "/images/donate/community-support-circle.jpg",
  heroPhoto1ImageAlt: "A therapist video-calling with clients as part of a remote support session",
  heroPhoto1Caption: "Therapist (Kenya)",
  heroPhoto2Image: "/images/donate/one-on-one-conversation.jpg",
  heroPhoto2ImageAlt: "A volunteer reading with a child outdoors as part of a community support programme",
  heroPhoto3Image: "/images/donate/avp-toolkit-training.jpg",
  heroPhoto3ImageAlt: "A clinical team reviewing a case together on a tablet",
  // Phase 224 — heading renamed from "Choose how you would like to
  // contribute" to match the donation section's new name in Roy's required
  // narrative flow ("Your gift can help create possibility"). DonateForm's
  // actual giving mechanics (recurring/one-time toggle, preset + custom
  // amounts, Mollie submission) are untouched — only this heading string.
  givingHeading: "Your gift can help create possibility",
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
  // Phase 238 — third testimonial, real approved copy from Roy (not a
  // placeholder like the two above).
  testimonial3Quote: "The support gave me hope when I didn't know where to turn. I felt heard, understood and not alone.",
  testimonial3Author: "Programme participant",
  // Phase 224 — "See the impact" horizontal photo gallery, inserted between
  // testimonials and the donation form per Roy's required narrative flow.
  // No 7 distinct authentic photos were supplied this phase (only the 3
  // real GESA photos already used elsewhere on this page exist locally —
  // see EXECUTION_PLAN.md Phase 224), so each of these 7 slots defaults to
  // one of those 3 real photos, cycled, rather than a broken image or an
  // invented stock photo. Roy can replace each slot individually via
  // Admin > UI Builder > Page Content > Donate > "Impact gallery" once he
  // has the 7 real photographs — the gallery's layout/aspect ratios are
  // already built to take them as-is.
  impactGalleryEyebrow: "See the impact",
  impactGalleryHeading: "People. Places. Stories.",
  impactGallerySubtitle: "Every contribution helps create real moments of care, learning, connection and hope across communities.",
  galleryPhoto1Image: "/images/donate/one-on-one-conversation.jpg",
  galleryPhoto1ImageAlt: "A support practitioner listening closely to someone during a one-on-one session",
  galleryPhoto1Caption: "Care that meets people where they are",
  galleryPhoto2Image: "/images/donate/avp-toolkit-training.jpg",
  galleryPhoto2ImageAlt: "A facilitator leading a skills workshop for a group of participants",
  galleryPhoto2Caption: "Learning together",
  galleryPhoto3Image: "/images/donate/community-support-circle.jpg",
  galleryPhoto3ImageAlt: "A community group gathered together outdoors in an open support circle",
  galleryPhoto3Caption: "Community-led connection",
  galleryPhoto4Image: "/images/donate/avp-toolkit-training.jpg",
  galleryPhoto4ImageAlt: "Participants sharing materials during an education and skills session",
  galleryPhoto4Caption: "Tools for everyday wellbeing",
  galleryPhoto5Image: "/images/donate/community-support-circle.jpg",
  galleryPhoto5ImageAlt: "A group taking part together in a shared activity",
  galleryPhoto5Caption: "Shared moments of support",
  galleryPhoto6Image: "/images/donate/one-on-one-conversation.jpg",
  galleryPhoto6ImageAlt: "A volunteer organising materials ahead of a support session",
  galleryPhoto6Caption: "Preparing care with intention",
  galleryPhoto7Image: "/images/donate/community-support-circle.jpg",
  galleryPhoto7ImageAlt: "The outdoor community setting where a GESA-supported gathering takes place",
  galleryPhoto7Caption: "Rooted in local communities",
  // Phase 224 — two-column founder/team message, directly after the
  // donation form. No verified founder name/bio/consented photo was
  // supplied, so this uses "The GESA team" rather than inventing one, per
  // Roy's explicit instruction.
  founderHeading: "Why we do this",
  founderQuote: "We believe wellbeing should not be determined by where you live, the language you speak, or the resources available to you.",
  founderBody: "GESA exists to help make meaningful emotional support, therapeutic care and learning opportunities more accessible across communities, languages and borders. We bring people, practitioners and practical tools together so support can reach further.",
  founderSignature: "— The GESA team",
  founderImage: "/images/donate/one-on-one-conversation.jpg",
  founderImageAlt: "A GESA team member in conversation as part of a community support session",
  founderLinkLabel: "Learn about GESA",
  founderLinkHref: "/about",
  // Phase 224 — final CTA repurposed from a volunteer-recruitment ask
  // ("Be part of the movement", opening the volunteer application modal)
  // to a donation ask, per Roy's required flow ending in DONATION/THANK
  // YOU. The button now scrolls to the giving box (#giving-box, the same
  // anchor the hero CTA already uses) instead of opening
  // VolunteerPrimaryCta's modal — see the section below for the plain
  // anchor swap.
  movementHeading: "Be part of the change",
  movementSubtitle: "Your generosity can help create a ripple of positive change — one person, one family and one community at a time.",
  movementCtaLabel: "Make a Donation",
  movementCtaHref: "#giving-box",
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
    { quote: content.testimonial3Quote, author: content.testimonial3Author, quoteId: "donate.testimonials.quote3", authorId: "donate.testimonials.author3" },
  ];

  // Phase 223 — the 3 floating hero photos from Roy's "BG Donate Page.jpg"
  // reference mockup. Same shape/pattern as whySupportPhotos above.
  const heroPhotos = {
    photo1: {
      src: content.heroPhoto1Image,
      alt: content.heroPhoto1ImageAlt,
      fallback: PHOTO_ONERROR_FALLBACK[0],
      imageContentId: "donate.hero.photo1Image",
      altContentId: "donate.hero.photo1ImageAlt",
    },
    photo2: {
      src: content.heroPhoto2Image,
      alt: content.heroPhoto2ImageAlt,
      fallback: PHOTO_ONERROR_FALLBACK[1],
      imageContentId: "donate.hero.photo2Image",
      altContentId: "donate.hero.photo2ImageAlt",
    },
    photo3: {
      src: content.heroPhoto3Image,
      alt: content.heroPhoto3ImageAlt,
      fallback: PHOTO_ONERROR_FALLBACK[2],
      imageContentId: "donate.hero.photo3Image",
      altContentId: "donate.hero.photo3ImageAlt",
    },
  };

  // Phase 224 — "See the impact" gallery photos. Varied widths (sm/lg
  // breakpoints) give the strip an editorial, non-grid feel; the mobile
  // (base) width is the same ~80vw for every item so exactly one photo
  // reads as the main image with a visible sliver of the next, signalling
  // horizontal scroll — see ImpactGallery.tsx's own comment.
  const GALLERY_WIDTHS = [
    "w-[78vw] max-w-[320px] sm:w-[300px] lg:w-[360px]",
    "w-[78vw] max-w-[320px] sm:w-[240px] lg:w-[260px]",
    "w-[78vw] max-w-[320px] sm:w-[280px] lg:w-[320px]",
    "w-[78vw] max-w-[320px] sm:w-[220px] lg:w-[240px]",
    "w-[78vw] max-w-[320px] sm:w-[300px] lg:w-[340px]",
    "w-[78vw] max-w-[320px] sm:w-[240px] lg:w-[260px]",
    "w-[78vw] max-w-[320px] sm:w-[280px] lg:w-[300px]",
  ];
  const galleryPhotos = [
    { src: content.galleryPhoto1Image, alt: content.galleryPhoto1ImageAlt, caption: content.galleryPhoto1Caption, n: 1 },
    { src: content.galleryPhoto2Image, alt: content.galleryPhoto2ImageAlt, caption: content.galleryPhoto2Caption, n: 2 },
    { src: content.galleryPhoto3Image, alt: content.galleryPhoto3ImageAlt, caption: content.galleryPhoto3Caption, n: 3 },
    { src: content.galleryPhoto4Image, alt: content.galleryPhoto4ImageAlt, caption: content.galleryPhoto4Caption, n: 4 },
    { src: content.galleryPhoto5Image, alt: content.galleryPhoto5ImageAlt, caption: content.galleryPhoto5Caption, n: 5 },
    { src: content.galleryPhoto6Image, alt: content.galleryPhoto6ImageAlt, caption: content.galleryPhoto6Caption, n: 6 },
    { src: content.galleryPhoto7Image, alt: content.galleryPhoto7ImageAlt, caption: content.galleryPhoto7Caption, n: 7 },
  ].map((photo, i) => ({
    src: photo.src,
    alt: photo.alt,
    caption: photo.caption,
    fallbackSrc: PHOTO_ONERROR_FALLBACK[i % PHOTO_ONERROR_FALLBACK.length].src,
    fallbackAlt: PHOTO_ONERROR_FALLBACK[i % PHOTO_ONERROR_FALLBACK.length].alt,
    imageContentId: `donate.impactGallery.photo${photo.n}Image`,
    altContentId: `donate.impactGallery.photo${photo.n}ImageAlt`,
    captionContentId: `donate.impactGallery.photo${photo.n}Caption`,
    widthClassName: GALLERY_WIDTHS[i],
  }));

  const page = (
    <div>
      {/* Hero — Phase 223: rebuilt to match Roy's "BG Donate Page.jpg"
          reference mockup (a full screenshot he dropped in the project
          root) as closely as this codebase's existing patterns allow: a
          warm ivory-to-tan background (`.donate-hero-warm`, see
          globals.css — built from the existing --clay-soft/--sand-brown
          tokens, since `.gold-banner` was repurposed to flat grey back in
          Phase 130 and is the wrong base here), a faint dotted-globe
          graphic bleeding off the right edge (DottedGlobe.tsx — no such
          asset existed in the codebase, drawn fresh as simple dashed
          lat/long arcs + node dots in the same restrained line-art spirit
          as GoldWatermarks), and 3 floating photos with no card chrome:
          a video-call screenshot (captioned, top-left), a volunteer
          reading with a child (bottom-left), and a clinical team around a
          tablet (bottom-right, the mockup's dominant photo). Text reverts
          to dark-on-light (foreground/muted-fg) since the reference's
          background is light, not the white-on-dark text the previous,
          unreferenced version of this hero used. The CTA keeps the dark
          --espresso pill, matching the mockup's dark navy button. Photos
          are wired as real UI Builder image fields (donate.hero.photo1-3,
          pageRegistry.ts "Hero photos" group) so Roy can upload the exact
          3 photos from his mockup via Admin himself — see this file's
          DONATE_PAGE_FALLBACK comment for why they default to the 3
          existing donate photos in the meantime. */}
      <section className="donate-hero-warm relative isolate overflow-hidden py-16 lg:py-24">
        {/* Phase 241 — immersive multi-layer parallax background, reusing
            the same 2 of the 3 hero photos rendered sharply in the
            foreground collage below (heroPhotos.photo3 far, photo1 mid) so
            no new image assets/CMS fields were needed. Purely decorative
            (aria-hidden, pointer-events-none) and sits at z-0, well behind
            the z-10 content column — see DonateHeroBackground.tsx for the
            full depth/accessibility/reduced-motion contract. */}
        <DonateHeroBackground farSrc={heroPhotos.photo3.src} midSrc={heroPhotos.photo1.src} />
        <div className="wrap relative z-10 lg:flex lg:items-center lg:gap-6">
          {/* Left photo stack — video call (captioned) + volunteer/child,
              hidden below lg since a floating collage doesn't degrade
              gracefully to a narrow viewport; mobile keeps the plain
              centered text hero. Phase 241: wrapped in ParallaxLayer as the
              hero's "foreground fragment" depth plane — smallest movement of
              the three layers, per the brief. */}
          <ParallaxLayer speed={6} className="relative hidden h-[420px] w-[26%] shrink-0 lg:block">
            <span className="absolute -top-6 left-1 text-[12px] font-medium text-muted-fg">
              <EditableText
                contentId="donate.hero.photo1Caption"
                label="Hero photo 1 caption"
                value={content.heroPhoto1Caption}
                as="span"
              />
            </span>
            <div className="absolute left-0 top-6 aspect-[4/3] w-full overflow-hidden rounded-[var(--radius)] shadow-soft">
              <EditableImage
                contentId={heroPhotos.photo1.imageContentId}
                altContentId={heroPhotos.photo1.altContentId}
                label="Hero photo 1 (video call)"
                src={heroPhotos.photo1.src}
                alt={heroPhotos.photo1.alt}
                fallbackSrc={heroPhotos.photo1.fallback.src}
                fallbackAlt={heroPhotos.photo1.fallback.alt}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 left-6 aspect-[4/3] w-[72%] overflow-hidden rounded-[var(--radius)] shadow-soft">
              <EditableImage
                contentId={heroPhotos.photo2.imageContentId}
                altContentId={heroPhotos.photo2.altContentId}
                label="Hero photo 2 (volunteer with child)"
                src={heroPhotos.photo2.src}
                alt={heroPhotos.photo2.alt}
                fallbackSrc={heroPhotos.photo2.fallback.src}
                fallbackAlt={heroPhotos.photo2.fallback.alt}
                className="h-full w-full object-cover"
              />
            </div>
          </ParallaxLayer>

          {/* Center text column. Phase 241: text/CTA now sit over the new
              photo background + dark overlay instead of the plain warm
              gradient, so heading/description/bold-line switched from
              dark-on-light to white/off-white for contrast — the eyebrow
              (`.eyebrow`, gold `--clay`) and the CTA's dark `--espresso` pill
              already read clearly against a dark background and are
              unchanged. A max 6px "at rest" translate is intentionally NOT
              tied to scroll (per the brief: the text block itself should
              feel stable, not drift with the parallax layers). */}
          <div className="relative z-10 mx-auto max-w-[520px] text-center lg:mx-0 lg:flex-1">
            <Reveal type="fade-up">
              <span className="eyebrow">
                <EditableText contentId="donate.hero.eyebrow" label="Hero eyebrow" value={content.eyebrow} as="span" />
              </span>
              <h1 className="mt-3 font-serif text-[38px] font-semibold leading-tight text-white sm:text-[44px]">
                <EditableText contentId="donate.hero.heading" label="Hero heading" value={content.title} as="span" />
              </h1>
              <div className="mx-auto mt-5 max-w-[520px] text-[16px] leading-relaxed text-white/80">
                <EditableText contentId="donate.hero.description" label="Hero description" value={content.subtitle} as="span" />
              </div>
              <p className="mt-3 font-semibold text-white">
                <EditableText contentId="donate.hero.boldLine" label="Hero bold line" value={content.boldLine} as="span" />
              </p>
              {/* Phase 233 — was `<a href="#giving-box">`, anchor-scrolling
                  down to the inline giving section. Roy asked every
                  donation CTA to open the same donation modal instead of
                  scrolling/redirecting — see DonateCtaButton.tsx. Styling/
                  label/placement all unchanged, only the click behavior. */}
              <DonateCtaButton
                content={content}
                className="mt-7 inline-flex items-center justify-center rounded-full bg-espresso px-7 py-3.5 text-[13px] font-semibold uppercase tracking-wide text-white shadow-soft transition-all hover:-translate-y-px hover:bg-espresso/90"
              >
                <EditableText contentId="donate.hero.ctaLabel" label="Hero CTA label" value={content.heroCtaLabel} as="span" />
              </DonateCtaButton>
            </Reveal>
          </div>

          {/* Right side — dotted globe behind the clinical-team photo,
              bleeding off the section's right edge. Phase 241: also wrapped
              in ParallaxLayer, same small "foreground fragment" strength as
              the left collage above. */}
          <ParallaxLayer speed={6} className="relative hidden h-[420px] w-[30%] shrink-0 lg:block">
            <DottedGlobe className="pointer-events-none absolute -right-[18%] top-1/2 h-[130%] w-[130%] -translate-y-1/2 text-[color:var(--sand-brown)] opacity-40" />
            <div className="absolute bottom-0 right-0 aspect-[16/11] w-[88%] overflow-hidden rounded-[var(--radius)] shadow-soft">
              <EditableImage
                contentId={heroPhotos.photo3.imageContentId}
                altContentId={heroPhotos.photo3.altContentId}
                label="Hero photo 3 (clinical team)"
                src={heroPhotos.photo3.src}
                alt={heroPhotos.photo3.alt}
                fallbackSrc={heroPhotos.photo3.fallback.src}
                fallbackAlt={heroPhotos.photo3.fallback.alt}
                className="h-full w-full object-cover"
              />
            </div>
          </ParallaxLayer>
        </div>
      </section>

      {/* "Why your support matters" — Phase 200: 3 real photographs (not
          stock images) with a short category label and caption each, per
          Roy's reference doc ("Website ideas 14_9_26.pdf", Page 5, section
          2 — "Use 3 strong photographs rather than lots of text"). Phase
          224: this is step 2 (STORY) of the required narrative flow —
          position unchanged, directly after the hero. */}
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

      {/* Testimonials — Phase 200, moved up in Phase 224 to sit directly
          after "Why your support matters" (step 3, HUMAN VOICE, of the
          required narrative flow) instead of after the giving box. The two
          quotes shipped in DONATE_PAGE_FALLBACK are the reference doc's own
          worked examples, not real GESA testimonials yet — see that file's
          Phase 200 comment and EXECUTION_PLAN.md before treating this
          section as publish-ready; swapping in real, consented testimonials
          later only ever means editing these two fields via Admin, nothing
          structural. */}
      <section className="section border-t border-border bg-sage-soft/40">
        <div className="wrap max-w-[820px]">
          <Reveal type="fade-up">
            <h2 className="mb-9 text-center font-serif text-[26px] font-semibold text-foreground">
              <EditableText contentId="donate.testimonials.heading" label="Testimonials heading" value={content.testimonialsHeading} as="span" />
            </h2>
          </Reveal>
          <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* "See the impact" — Phase 224, new. Step 4 (IMPACT) of the required
          narrative flow, inserted directly after testimonials and directly
          before the donation form. See ImpactGallery.tsx for the
          horizontal-scroll/accessibility implementation. */}
      <ImpactGallery
        eyebrow={content.impactGalleryEyebrow}
        eyebrowContentId="donate.impactGallery.eyebrow"
        heading={content.impactGalleryHeading}
        headingContentId="donate.impactGallery.heading"
        subtitle={content.impactGallerySubtitle}
        subtitleContentId="donate.impactGallery.subtitle"
        photos={galleryPhotos}
      />

      {/* Giving box — the interactive part, see DonateForm.tsx. Kept
          exactly as-is (Mollie, not Stripe, recurring/one-time toggle,
          preset + custom amounts all untouched) per Roy's own
          clarification — only its heading text and its position changed
          across Phase 200/224. Phase 224 moved this to sit directly after
          the new gallery (step 5, DONATION, of the required narrative
          flow) instead of before testimonials. */}
      <section className="pb-16">
        <div className="wrap">
          <Reveal type="fade-up">
            <DonateForm content={content} />
          </Reveal>
        </div>
      </section>

      {/* Founder/team message — Phase 224, new. Directly after the donation
          form, closing out the narrative flow's DONATION -> THANK YOU beat
          with a human, grounding note of thanks/purpose rather than an
          abrupt drop to the next section. See FounderMessage.tsx — "The
          GESA team" signature is intentional (no verified founder identity
          supplied), not a placeholder to fill in. */}
      <FounderMessage
        heading={content.founderHeading}
        quote={content.founderQuote}
        body={content.founderBody}
        signature={content.founderSignature}
        image={content.founderImage}
        imageAlt={content.founderImageAlt}
        imageFallback={PHOTO_ONERROR_FALLBACK[1]}
        linkLabel={content.founderLinkLabel}
        linkHref={content.founderLinkHref}
      />

      {/* "What your gift helps make possible" — three icon cards. Kept
          (not requested for removal), positioned after the founder message
          so the required 7-section flow's hard ordering constraints
          (gallery directly after testimonials, donation directly after
          gallery, final CTA last before the footer) are all satisfied. */}
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

      {/* Final CTA — Phase 224: repurposed from a volunteer-recruitment
          band ("Be part of the movement", opening VolunteerPrimaryCta's
          application modal) to a donation ask ("Be part of the change" /
          "Make a Donation"), per the required flow's final beat.
          Phase 233 — this was a plain `<a href={content.movementCtaHref}>`.
          Roy flagged (and a live check confirmed) that already-published
          `page_donate` content still had this field's stale pre-Phase-224
          value, `/contact?subject=Volunteer` — a leftover from before this
          band was repurposed — so the live button was redirecting to the
          Contact page instead of the donation flow, even though this
          file's own fallback had already been fixed to "#giving-box" in
          Phase 224. Rather than depend on every already-published row
          having the right href (and silently breaking again the same way
          if it's ever cleared/reset), this now always opens the same
          donation modal via DonateCtaButton, matching the hero CTA and the
          giving section's own flow — no href involved at all.
          `content.movementCtaHref`/its admin field are left in the data
          model, unused, per the site's standing "don't delete a field just
          because a section stopped reading it" precedent (see e.g. Phase
          108/226's own notes) — kept in case a future redesign wants a
          plain link here again. */}
      <section className="bg-espresso py-16 text-center text-[#c7d0de]">
        <div className="wrap max-w-[620px]">
          <h2 className="mb-3 font-serif text-[26px] font-semibold text-white">
            <EditableText contentId="donate.movement.heading" label="Final CTA heading" value={content.movementHeading} as="span" />
          </h2>
          <p className="mb-6 leading-relaxed">
            <EditableText contentId="donate.movement.subtitle" label="Final CTA subtitle" value={content.movementSubtitle} as="span" />
          </p>
          <DonateCtaButton
            content={content}
            className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-[13px] font-semibold uppercase tracking-wide text-espresso transition-all hover:-translate-y-px hover:bg-white/90"
          >
            <EditableText contentId="donate.movement.ctaLabel" label="Final CTA button label" value={content.movementCtaLabel} as="span" />
          </DonateCtaButton>
        </div>
      </section>

    </div>
  );

  return isEditorPreview ? <EditorPreviewBridge>{page}</EditorPreviewBridge> : page;
}
