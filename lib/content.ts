import { getSiteContent } from "@/lib/queries";

// The Content Manager's read-side contract (CRM Phase 35): every editable
// page/section is one row in the existing public.site_content table
// (key text, value jsonb — already had admin-write + public-read RLS from
// Phase 3, no new table needed). Every content shape below carries its own
// `published` flag *inside* the JSON value rather than as a separate DB
// column, so turning a page's content on/off is just one field in the same
// row the admin UI already edits.
//
// getPageContent() is the fallback contract itself: if the row doesn't
// exist yet, the fetch throws, or `published` is explicitly false, the
// caller's hardcoded fallback object renders instead — the page is never
// blank and never depends on the CMS being configured correctly to load at
// all. This mirrors the requested architecture's "Frontend Renderer &
// Fallback" layer exactly.
export async function getPageContent<T extends Record<string, unknown>>(
  key: string,
  fallback: T
): Promise<T> {
  try {
    const row = await getSiteContent<Partial<T> & { published?: boolean }>(key);
    if (!row || row.published === false) return fallback;
    // Shallow-merge over the fallback so an old row missing a newer field
    // (e.g. a page schema gained a field after the row was first saved)
    // still renders something sensible for that field instead of "undefined".
    return { ...fallback, ...row } as T;
  } catch {
    return fallback;
  }
}

// Shared shape for every page whose editable content is just its PageHero
// banner (Our Therapists, Support Groups, Blog, Contact) or a narrow
// variant of it (FAQ, which has no description). Kept as one type so the
// admin "SimplePageEditor" can render the same three fields for all of them.
export type SimplePageContent = {
  published: boolean;
  eyebrow: string;
  title: string;
  description: string;
};

// Extended in the "everything down to every button and label" round: the
// three trust badges and the three path cards below the headline were
// previously hardcoded in components/home/Paths.tsx. Note the path cards'
// visible title/description text is baked into the card photo itself (see
// the Phase 19 comment in Paths.tsx) — title/description here only change
// the screen-reader label, not what a sighted visitor sees. ctaLink is the
// one field per card that has a real, visible effect (where the card
// navigates to). This is called out again in the admin editor itself so it
// isn't a silent trap.
export type HomeContent = {
  published: boolean;
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  badge1Label: string;
  badge2Label: string;
  badge3Label: string;
  footerNote: string;
  // Phase 51 — the continuous "news line" ticker below the hero. One
  // phrase per line (split on "\n" wherever this is read), distinct from
  // the trust badges/card titles above rather than repeating them — see
  // components/motion/NewsTicker.tsx.
  purposeTicker: string;
  card1Title: string;
  card1Description: string;
  card1CtaLabel: string;
  card1CtaLink: string;
  card2Title: string;
  card2Description: string;
  card2CtaLabel: string;
  card2CtaLink: string;
  card3Title: string;
  card3Description: string;
  card3CtaLabel: string;
  card3CtaLink: string;
};

// Powers components/Hero.tsx, currently only used on About — kept general
// (not "AboutHeroContent") since Hero.tsx itself has no idea which page
// it's rendered on.
export type HeroContent = {
  published: boolean;
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  backgroundImage: string;
};

export type AboutSectionsContent = {
  published: boolean;
  ourMissionEyebrow: string;
  ourMissionHeading: string;
  ourMissionBody: string;
  missionHeading: string;
  missionParagraphs: string[];
  howItWorksHeading: string;
  howItWorksPoints: { title: string; body: string }[];
  foundersHeading: string;
  foundersIntro: string;
  // Phase 62 — photoUrl is optional/empty-string-default rather than
  // required: existing founder rows published before this phase won't have
  // one yet, and the About page falls back to the initials block it always
  // used when there's no photo, so nothing breaks for founders nobody has
  // uploaded a picture for.
  founders: { name: string; roleTitle: string; email: string; shortBio: string; photoUrl: string }[];
  volunteerHeading: string;
  volunteerBody: string;
  volunteerPrimaryLabel: string;
  volunteerPrimaryHref: string;
  volunteerSecondaryLabel: string;
  volunteerSecondaryHref: string;
  legalBlurb: string;
  taxNote: string;
};

// Extended the same round as HomeContent above — column headings, link
// labels, and the bottom bar were hardcoded in components/Footer.tsx. Link
// *destinations* stay fixed (not editable here) since those are structural
// navigation, not content — only the visible label text moved into this
// shape, matching Roy's "keep the current build structure" instruction.
export type FooterContent = {
  published: boolean;
  tagline: string;
  exploreHeading: string;
  exploreAboutLabel: string;
  exploreTherapistsLabel: string;
  exploreSupportGroupsLabel: string;
  exploreBlogLabel: string;
  exploreBlogBadge: string;
  exploreFaqLabel: string;
  exploreContactLabel: string;
  supportHeading: string;
  supportFindTherapistLabel: string;
  supportJoinGroupLabel: string;
  supportDonateLabel: string;
  supportVolunteerLabel: string;
  supportEmergencyLabel: string;
  legalHeading: string;
  // Phase 80 round 2 — these five link labels were the last hardcoded
  // strings left in the footer (the hrefs stay fixed, same rule as every
  // other footer link — only visible label text is editable here).
  legalPrivacyLabel: string;
  legalCookiesLabel: string;
  legalNoticeLabel: string;
  legalAccessibilityLabel: string;
  legalTermsLabel: string;
  copyrightLine: string;
  madeWithLine: string;
  // Phase 57 — Roy sent a simpler reference than Phase 56 (which was
  // reverted for breaking the live footer): no fifth column, no CTA
  // button, just a "Connect with Us" social-icon row and a "Our Trusted
  // Partners" row, both below the existing four columns. Social hrefs
  // default to "#" (not "") deliberately this time — Phase 56's icons
  // defaulted to "" and only rendered when set, which likely contributed
  // to "looks broken" since none of the four icons showed up out of the
  // box. Defaulting to "#" means every icon always renders, matching the
  // reference visually immediately; Roy replaces "#" with real profile
  // URLs via the Content Manager whenever he has them.
  connectWithUsLabel: string;
  socialLinkedinHref: string;
  socialTwitterHref: string;
  socialInstagramHref: string;
  socialFacebookHref: string;
  trustedPartnersHeading: string;
  partner1Label: string;
  partner2Label: string;
  partner3Label: string;
  nonprofitStatusLine: string;
};

// New this round — the global header nav (components/Header.tsx) was fully
// hardcoded. Same rule as the footer: link labels are editable, the Donate
// button's href is editable too since it's a marketing CTA rather than
// primary site navigation, but the four main nav items' destinations stay
// fixed.
export type HeaderContent = {
  published: boolean;
  homeLabel: string;
  aboutLabel: string;
  therapistsLabel: string;
  supportGroupsLabel: string;
  donateLabel: string;
  donateHref: string;
};

// New this round — the Our Therapists directory's filter sidebar and empty
// state (components/TherapistsDirectory.tsx) were fully hardcoded static
// labels (the underlying filter *options* — specialties, languages,
// durations — stay data-driven from real therapist records, not editable
// text; only the fixed labels around them are).
export type TherapistsDirectoryContent = {
  published: boolean;
  searchLabel: string;
  searchPlaceholder: string;
  definitionLabel: string;
  anyOptionLabel: string;
  languageLabel: string;
  anyLanguageLabel: string;
  durationLabel: string;
  genderLabel: string;
  maleLabel: string;
  femaleLabel: string;
  nonbinaryLabel: string;
  noPreferenceLabel: string;
  joinAsTherapistLabel: string;
  applyFiltersLabel: string;
  noResultsMessage: string;
};

// New this round — Support Groups' registration flow
// (components/SupportGroupsInteractive.tsx) had several static strings
// worth editing without touching the booking logic itself.
export type SupportGroupsDirectoryContent = {
  published: boolean;
  noGroupsMessage: string;
  registerButtonLabel: string;
  confirmButtonLabel: string;
  successHeading: string;
};

// Phase 80 round 2 — "make sure all the content/text/layout on the site is
// captured, and future additions stay consistent" audit. The four shapes
// below (DonateBandContent, HomeStatsContent, CrisisButtonContent,
// IntakeFlowContent) cover the highest-value gaps found: components reused
// across multiple pages (so one edit fixes every occurrence) or shown
// site-wide. See CONTENT_GUIDE.md for the convention every future page/
// component should follow so nothing new ships hardcoded again, and for the
// short list of lower-priority gaps (deep wizard-step microcopy, dynamic
// booking-modal copy) intentionally deferred out of this round.

// Powers components/home/DonateBand.tsx — identical on Home, About, Our
// Therapists, and Support Groups (Phase 75), so this one row fixes all four
// at once instead of four separate hardcoded copies that could drift.
// Phase 83 — Roy asked for a redesign: the single "Donate to GESA" button
// became two pill CTAs (join as a professional / explore the community),
// plus a small crisis-resources line underneath. `cta1Href` still defaults
// to VolunteerPrimaryCta's recognized default, so "Join as a professional"
// keeps opening the volunteer application modal rather than just linking to
// the contact page, exactly like the About page's existing volunteer CTA.
export type DonateBandContent = {
  published: boolean;
  headline: string;
  subtitle: string;
  cta1Label: string;
  cta1Href: string;
  cta2Label: string;
  cta2Href: string;
  crisisText: string;
  crisisLinkLabel: string;
  crisisLinkHref: string;
};

// Powers components/home/Stats.tsx (Home only). Phase 83 — Roy asked for a
// redesign: the four counted-up numeric stats became four static icon
// badges (Verified Profiles / Multilingual Support / Clear Session Fees /
// Global Community). Icons are fixed per position in code (same convention
// as CrisisButton's resource icons) since only the label text is meant to
// be admin-editable.
export type HomeStatsContent = {
  published: boolean;
  badge1Label: string;
  badge2Label: string;
  badge3Label: string;
  badge4Label: string;
};

// Powers components/CrisisButton.tsx — rendered globally in app/layout.tsx,
// so this is on every single page. Resource hrefs stay editable too (unlike
// most nav links) since these are real hotline numbers/URLs that can change,
// not internal site structure.
export type CrisisButtonContent = {
  published: boolean;
  triggerLabel: string;
  modalHeading: string;
  modalSubtitle: string;
  resource1Title: string;
  resource1Description: string;
  resource1Href: string;
  resource2Title: string;
  resource2Description: string;
  resource2Href: string;
  resource3Title: string;
  resource3Description: string;
  resource3Href: string;
  resource4Title: string;
  resource4Description: string;
  resource4Href: string;
  disclaimer: string;
};

// Powers app/intake/page.tsx and components/intake/IntakeMatchFlow.tsx — the
// fast "reach out now" path's per-path labels/hero titles and the crisis
// path's safety disclaimer. Deliberately does not cover the deeper
// IntakeBookingModal copy (dynamic, name/date-interpolated strings) — see
// CONTENT_GUIDE.md for why that's a separate follow-up.
export type IntakeFlowContent = {
  published: boolean;
  pathCrisisLabel: string;
  pathVeteranLabel: string;
  pathGeneralLabel: string;
  pathHelpersLabel: string;
  crisisHeroTitle: string;
  defaultHeroTitle: string;
  crisisDisclaimer: string;
  moreHelplinesText: string;
  ongoingSupportPrompt: string;
  matchListIntro: string;
};

// --- Fallback objects: the single source of truth for "what the site looks
// like if the Content Manager row is missing, unpublished, or unreachable."
// Every one of these is exactly today's live copy — seeding the matching
// site_content row with the same values (done as part of Phase 35) means
// publishing changes nothing visually until an admin actually edits
// something. Both the live pages and the admin editor forms import these
// from here, so there's one source of truth for "what English text this
// page starts with," not two copies that can drift apart. ---

export const THERAPISTS_CONTENT_FALLBACK: SimplePageContent = {
  published: true,
  eyebrow: "Our Specialists",
  title: "Verified volunteer therapists",
  description:
    "Browse our network of verified volunteer therapists. Search and filter to find the right fit, then open a profile to read more and book.",
};

export const SUPPORT_GROUPS_CONTENT_FALLBACK: SimplePageContent = {
  published: true,
  eyebrow: "Support Groups",
  title: "Facilitated circles for collective healing",
  description: "Online and in-person groups, guided by verified facilitators. You are welcome exactly as you are.",
};

export const BLOG_CONTENT_FALLBACK: SimplePageContent = {
  published: true,
  eyebrow: "Blog",
  title: "In the Press & Resources",
  description: "Updates from GESA, and resources from our network of volunteer therapists.",
};

export const FAQ_CONTENT_FALLBACK: SimplePageContent = {
  published: true,
  eyebrow: "FAQ",
  title: "Frequently asked questions",
  description: "",
};

export const CONTACT_CONTENT_FALLBACK: SimplePageContent = {
  published: true,
  eyebrow: "Contact",
  title: "We're here to help",
  description: "Questions about support, volunteering, or donating — send us a note and we'll get back to you.",
};

// Phase 80 round 2 — the Find Your Therapist wizard's PageHero banner had no
// Content Manager wiring at all until now.
export const FIND_YOUR_THERAPIST_CONTENT_FALLBACK: SimplePageContent = {
  published: true,
  eyebrow: "Find Your Therapist",
  title: "A guided match, just for you",
  description:
    "Answer a few quick questions and we'll match you with a verified volunteer therapist suited to your needs — free, confidential, and no account required.",
};

export const ABOUT_SECTIONS_FALLBACK: AboutSectionsContent = {
  published: true,
  ourMissionEyebrow: "Our Mission",
  ourMissionHeading: "Care shouldn't depend on where you were born or what you can afford.",
  ourMissionBody:
    "GESA connects people carrying real emotional weight with real, qualified therapists — free of charge, wherever they are. We measure our work by one thing: whether someone who couldn't otherwise reach support, reached it.",
  missionHeading: "Why GESA exists",
  missionParagraphs: [
    "Millions of people carry pain that has nowhere to go — after displacement, loss, or the quiet exhaustion of staying strong for others. GESA exists to meet that pain with warmth, dignity, and real professional care.",
    "We bring skilled therapists to the people who need them most, across borders and languages, and we keep it free at the point of need so that ability to pay is never the reason someone goes without support.",
  ],
  howItWorksHeading: "How GESA works",
  howItWorksPoints: [
    {
      title: "Verified volunteer therapists",
      body: "A global community of credential-checked professionals who donate their time.",
    },
    {
      title: "Up to six free sessions",
      body: "Every person receives six sessions at no cost, with continued support afterward at a reduced donation fee.",
    },
    {
      title: "Thoughtful matching",
      body: "We pair each person with a therapist who fits their needs, language, and preferences.",
    },
    {
      title: "Global reach, 20+ languages",
      body: "Support that crosses time zones and speaks your language, online and confidential.",
    },
  ],
  foundersHeading: "Our Founders",
  foundersIntro: "Meet the founders behind GESA — a global home for free, trauma-informed emotional support.",
  founders: [
    {
      name: "Ilana O'Malley",
      roleTitle: "Co-Founder, GESA",
      email: "ilana@gesa.org",
      shortBio:
        "Ilana helped establish GESA out of a conviction that no one should face emotional pain alone or be priced out of care. She guides the alliance's mission of warm, accessible support and its growing worldwide community of volunteer therapists.",
      photoUrl: "",
    },
    {
      name: "Karin Horen",
      roleTitle: "Co-Founder, GESA",
      email: "karin@gesa.org",
      shortBio:
        "Karin co-founded GESA to connect skilled, compassionate therapists with people carrying the weight of war, displacement, and antisemitism. She leads the community and partnerships that keep six sessions free for everyone who reaches out.",
      photoUrl: "",
    },
  ],
  volunteerHeading: "Join us as a caregiver",
  volunteerBody:
    "Are you a licensed therapist with a few hours a month to give? Your time becomes someone's turning point. Join a global network making care free and human.",
  volunteerPrimaryLabel: "Become a volunteer therapist",
  volunteerPrimaryHref: "/contact?subject=Volunteer",
  volunteerSecondaryLabel: "Find a therapist",
  volunteerSecondaryHref: "/find-your-therapist",
  legalBlurb:
    "GESA is a registered nonprofit connecting volunteer emotional-support specialists worldwide with Israelis facing war-related distress and Jewish communities abroad experiencing antisemitism.",
  taxNote: "Donations are tax-deductible in Israel, the U.S., the U.K., and Spain.",
};

// Registry the Content Manager's admin UI iterates over to build its
// "Pages" tab list. Each entry names the site_content key, a human label,
// and which generic editor shape it uses — adding a new simple banner-only
// page later is one entry here, not a new bespoke component or a new tab
// wired by hand into ContentManagerApp.
//
// Phase 80 round 2 — this registry existed since Phase 35 but
// ContentManagerApp actually hardcoded five near-identical tab blocks
// instead of iterating it, so "add an entry here" didn't yet do anything.
// Fixed ContentManagerApp/app/admin/content/page.tsx to genuinely loop over
// this array — this is the concrete mechanism that makes a *simple* future
// page (hero banner only, no bespoke fields) show up in the Content Manager
// automatically, with zero admin-UI code to write. Pages needing more than
// eyebrow/title/description still need their own bespoke type + editor
// (see HomeContent/FooterContent/etc. above), same as always.
export const SIMPLE_PAGE_ENTRIES: { key: string; label: string; hasDescription: boolean; fallback: SimplePageContent }[] = [
  { key: "page_therapists", label: "Our Therapists", hasDescription: true, fallback: THERAPISTS_CONTENT_FALLBACK },
  { key: "page_support_groups", label: "Support Groups", hasDescription: true, fallback: SUPPORT_GROUPS_CONTENT_FALLBACK },
  { key: "page_find_your_therapist", label: "Find Your Therapist", hasDescription: true, fallback: FIND_YOUR_THERAPIST_CONTENT_FALLBACK },
  { key: "page_blog", label: "Blog (disabled)", hasDescription: true, fallback: BLOG_CONTENT_FALLBACK },
  { key: "page_faq", label: "FAQ", hasDescription: false, fallback: FAQ_CONTENT_FALLBACK },
  { key: "page_contact", label: "Contact", hasDescription: true, fallback: CONTACT_CONTENT_FALLBACK },
];
