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
