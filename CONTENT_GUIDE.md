# Content Guide — keeping the Content Manager in sync with the site

This is a working convention, not a one-time cleanup. Read this before adding any new public-facing page,
section, or component that shows English copy to a visitor. Following it is what makes "everything on the
site is editable from the CRM, including whatever we build next" stay true over time, instead of being true
only on the day this document was written.

## The rule

**If a future page or component shows marketing copy, a heading, a button label, or similar visitor-facing
text, that text must be defined as a typed content shape with a fallback and read through `getPageContent()`
— not hardcoded as a string literal in the `.tsx` file.**

This mirrors the pattern already used for every page in the site (Home, About, Our Therapists, Support
Groups, Find Your Therapist, Intake, Blog, FAQ, Contact, the header, the footer, the crisis button, the
donate band, and the site's stats row). None of it is new machinery — it's the same three pieces every time:

1. **A type**, in `lib/content.ts`, describing the shape of that page/component's editable fields, plus a
   `published: boolean` field.
2. **A fallback constant** of that type — the literal text the page/component starts with the day it ships,
   before anyone touches the Content Manager. Colocate this with the component that renders it (see
   `HOME_CONTENT_FALLBACK` in `components/home/Paths.tsx`, `DONATE_BAND_CONTENT_FALLBACK` in
   `components/home/DonateBand.tsx`) unless the shape has no single natural home (in which case it lives in
   `lib/content.ts` itself, next to the type — see `ABOUT_SECTIONS_FALLBACK`).
3. **A read** via `getPageContent(key, fallback)` (a Server Component can call this directly; a Client
   Component needs it fetched one level up, in a Server Component ancestor, and passed down as a prop — see
   `app/layout.tsx` fetching `CrisisButtonContent` for the Client Component `CrisisButton`).

That's the whole contract. `getPageContent` already handles "the row doesn't exist yet," "the row is
missing a field a newer version of the shape added," and "the row is explicitly unpublished" — all three
fall back to the constant, so a page can never render blank just because nobody has edited it yet.

## Two ways a new page reaches the admin UI

**Case A — the page is just a banner (eyebrow / title / description), nothing else.** Use the existing
`SimplePageContent` type and add one entry to `SIMPLE_PAGE_ENTRIES` in `lib/content.ts`:

```ts
export const MY_NEW_PAGE_FALLBACK: SimplePageContent = {
  published: true,
  eyebrow: "...",
  title: "...",
  description: "...",
};

// in SIMPLE_PAGE_ENTRIES:
{ key: "page_my_new_page", label: "My New Page", hasDescription: true, fallback: MY_NEW_PAGE_FALLBACK },
```

That's the entire admin-side integration. `ContentManagerApp` (`components/admin/content/ContentManagerApp.tsx`)
loops over every entry in this registry that isn't already claimed by a composite tab (see
`COMPOSITE_SIMPLE_KEYS` at the top of that file) and renders it as its own tab automatically, using the
generic `SimplePageEditor`. You do not need to touch `ContentManagerApp.tsx` or write a new editor
component for this case — that is the concrete mechanism that makes a simple future page "automatically
captured."

**Case B — the page/component needs more than eyebrow/title/description** (a footer with a dozen labels, a
crisis button with four resource links, a stats row with numeric values). Define its own type in
`lib/content.ts`, and build an editor with `FlatFieldsEditor` (`components/admin/content/FlatFieldsEditor.tsx`)
— a generic form renderer for any flat string-field shape, used by every bespoke editor in the codebase
(`HeaderEditor`, `FooterEditor`, `DonateBandEditor`, `HomeStatsEditor`, `CrisisButtonEditor`,
`IntakeFlowEditor` are all just a `FlatFieldsEditor` with a field list — none of them hand-roll their own
`<input>`s). Only reach for a fully custom editor component if the shape has arrays/nested objects
(`AboutSectionsEditor` is the one example of this, for the founders list).

For Case B you do need to:
- Add the new prop to `ContentManagerAppProps` and a new tab entry (`FIXED_TABS`/`FIXED_TABS_END` in
  `ContentManagerApp.tsx`).
- Fetch it in `app/admin/content/page.tsx` and pass it down.
- Fetch it in whichever public page/layout actually renders that content, the same way every existing
  bespoke shape is fetched today.

**Case C — a Client Component with no single Server Component ancestor.** Case B's "fetch it one level up and
pass it down as a prop" assumes there's one ancestor to fetch it in. Some components don't have that:
`VolunteerApplicationModal` (`components/volunteer/VolunteerApplicationModal.tsx`) opens from
`VolunteerApplyButton`, which itself renders in 4+ unrelated places across the site (Footer, About page CTA,
Our Therapists sidebar, Donate band) — there's no single page or layout to thread a prop through without
touching every call site. For this shape, fetch client-side instead with `useSiteContent(key, fallback)`
(`lib/content-client.ts`), which applies the exact same fallback/`published` contract as `getPageContent()`
but runs in the browser — safe because `site_content`'s RLS is public-read regardless (it's marketing copy,
not sensitive data). Everything else about the type/fallback/admin-editor contract is identical to Case B;
only the read-side mechanism changes.

## What "content" means here (and what it deliberately doesn't)

In scope: headlines, subtitles, eyebrow labels, button/CTA text, banner copy, empty-state and informational
messages a visitor reads in the normal course of using a feature, footer/nav labels, hotline names and
links, stat values.

Out of scope, by deliberate earlier decision (see the GESA Platform Technical Specification, §10 and the
audit behind this document): individual therapist profile data (real records, not marketing copy), admin
CRM screen labels, and system/form-validation error messages (e.g. "Please choose a time.", "Passwords
don't match."). These stay in code. If a future phase decides any of these *should* become CMS-editable,
that's a deliberate scope change worth its own conversation, not something to creep in silently while adding
an unrelated feature.

## Known gaps intentionally left for a future pass

This document was written as part of a broader pass (August 2026) that wired up the highest-value gaps
found: the Donate Band (reused on 4 pages), the Home stats row, the site-wide Crisis Button, the Find Your
Therapist hero banner, the Footer's legal-column labels, and the Intake flow's path labels/hero titles/
crisis disclaimer. Two areas were deliberately left out of that pass, not overlooked:

- **The Find Your Therapist wizard's step-by-step microcopy** (`components/match/StepAssessment.tsx`,
  `StepPreferences.tsx`, `StepFormatLocation.tsx`, `StepMatches.tsx`) — headings, helper text, and empty/error
  states inside each step. Low risk individually, but there are many small strings across four files with
  real conditional logic (the gender-preference-not-honored banner, the no-matches state); wiring all of it
  correctly deserves its own focused phase rather than being folded into a broader content-audit pass.
- **Dynamic, interpolated copy in the booking modals** (`components/match/BookingModal.tsx`,
  `components/intake/IntakeBookingModal.tsx`) — e.g. "We've sent your request to {name}." These need a
  placeholder convention (how does an admin editing this in a plain text box know `{name}` gets substituted?)
  that doesn't exist yet anywhere else in the Content Manager. Worth designing deliberately rather than
  bolting on ad hoc.

If either of these becomes a priority, follow the same Case A/Case B decision above — the pattern doesn't
change, there's just more surface area to cover carefully.

## September 2026 follow-up pass

A second audit (Phase 103) re-checked the whole site against this guide's own scope and found four more
genuine gaps, now fixed: the Volunteer Application modal's heading/intro/submit/thank-you copy (new Case C
above — `component_volunteer_modal`), the Donate thank-you page's three payment-status states
(`page_donate_thank_you`), and the Footer's "Help us grow" inquiry card heading/subtitle/submit-state copy
(added to `FooterContent`). Also queried both Supabase projects' `site_content` table directly and confirmed
no stale-row bug exists today — every currently-read key's live row (where one exists) matches the current
code shape, and the newer keys (`component_home_stats`, `component_donate_band`, `page_donate`,
`component_crisis_button`, `component_intake_flow`, and this pass's new keys) simply don't have a row yet in
one or both Supabase projects, which is the safe, by-design "falls back to the code default" case, not a bug.

That same query also turned up six keys nothing in the current codebase reads at all —
`about_page`, `home_hero_media`, `intake_config`, `our_specialists`, `paths_section`, `preloader` (prod), plus
`about_page`/`paths_section` in dev. These look like rows from an earlier, since-replaced content-management
approach. They're harmless (nothing queries them), so this pass left them in place rather than deleting data
outside its own scope — flagged here for Roy to decide whether to clean them up.

Remaining lower-priority gaps identified but **not** fixed in this pass (still hardcoded, ordered roughly by
how much of the site they touch): the three trust badges in `components/Hero.tsx` (About page only — "Verified
Professionals" etc., no `HeroContent` fields for them yet); `app/therapists/[slug]/page.tsx`'s labels; the
"Showing X of Y therapists" string in `components/TherapistsDirectory.tsx` and `BookSessionButton.tsx`'s "Book
a Session" label; badges/messages in `components/SupportGroupsInteractive.tsx`; the empty-state message in
`app/intake/page.tsx` and the "Choose {firstName}" button in `components/intake/IntakeMatchFlow.tsx`; the
blog-link tooltip in `components/Footer.tsx`; and `app/messages/page.tsx` (which also has a separate, unrelated
stale-copy bug — its own text still says "Our Specialists" — worth a follow-up look). None of these are large
individually; grouping a few into one future phase is reasonable rather than doing them one at a time.
