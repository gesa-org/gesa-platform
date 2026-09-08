# Maintaining crisis resources (CrisisButton's country selector)

This document explains how to add, update, or verify the country-specific
emergency and crisis-support data behind the "In crisis? Get help" button's
country selector (Phase 169). Read this before touching
`lib/crisisResources.ts`.

## Why this isn't just admin-editable text

Every other piece of copy on GESA's site goes through the CMS
(`site_content` rows, edited from `/admin/content`). This data intentionally
does not, for two reasons:

1. **It's structured, not prose** — a phone number, an SMS keyword, a
   source URL, and a verification date all need to travel together as one
   record, and the UI needs to reliably tell a "call this" resource from a
   "text this" resource from a "chat here" resource. A free-text CMS field
   can't guarantee that shape.
2. **A wrong entry here is a real-world safety issue**, not a typo. Adding a
   review/verification step in code (a pull request, reviewed like any other
   change) is a deliberate speed bump — nobody should be able to publish an
   unverified crisis number with the same casual "edit and save" flow used
   for a page's hero heading.

## The golden rule

**Never add or change a record in `CRISIS_RESOURCES` without a real,
current source you personally checked.** If you can't verify a number,
leave that country out entirely — the UI already has a safe fallback for
that ("We couldn't verify a local crisis line for this location," plus a
link to Befrienders Worldwide and a reminder to call local emergency
services). A missing country is a known gap. A wrong number is harm.

Acceptable sources, in order of preference:

1. The service's own official site (e.g. `988lifeline.org`, `samaritans.org`,
   `113.nl`, a national health ministry page).
2. A national/government emergency-services page.
3. A well-established aggregator (Befrienders Worldwide, Wikipedia's "List
   of suicide crisis lines") **only** as a starting point — confirm the
   actual number against a primary source before shipping it, especially for
   the crisis/suicide line itself (the one people are most likely to use in
   an acute moment).

## How to add or update a country

Edit `lib/crisisResources.ts`. Each entry is one `CrisisResource` object:

```ts
{
  countryCode: "NL",            // ISO 3166-1 alpha-2, uppercase
  countryName: "Netherlands",
  serviceName: "113 Zelfmoordpreventie",
  serviceType: "suicide_crisis", // see CrisisResourceType for the full list
  phone: "113",                  // display format; null if no phone option
  smsKeyword: null,              // e.g. "HOME" for a keyword+shortcode text line
  smsNumber: null,                // e.g. "741741"; null if not an SMS service
  url: "https://www.113.nl/",     // official page, chat, or info URL
  availability: "24/7",           // be specific if it isn't — "Mon–Fri 17:00–21:00" etc.
  languages: ["Dutch"],            // or null if not documented
  sourceUrl: "https://www.113.nl/heb-je-nu-hulp-nodig/hulplijn", // the page you actually checked
  verifiedDate: "2026-09-09",       // today's date, ISO format
  note: "optional short caveat, e.g. uncertain hours",
}
```

A country usually needs 1-4 records: one `emergency` (police/fire/ambulance),
one `suicide_crisis` (the primary national lifeline), and optionally a
`text_line` and/or `chat` if a genuine one exists — don't add a text/chat
entry just because the US has one; most countries don't have a text-based
crisis line, and inventing one is exactly the mistake this system exists to
prevent.

`getResourcesForCountry()` automatically sorts records emergency-first, so
you don't need to worry about ordering when adding entries — just group them
by country in the file for readability (existing convention: one comment
block per country).

## Re-verifying an existing entry

Numbers, hours, and URLs change. Periodically (recommended: every 6–12
months, or sooner if a visitor/QA reports something wrong):

1. Open each `sourceUrl` for the country you're re-checking and confirm the
   number/hours/URL still match.
2. If it still matches, just bump `verifiedDate` to today.
3. If it's changed, update the field(s) that changed, update `sourceUrl` if
   you used a different page, and bump `verifiedDate`.
4. If a resource has been discontinued and you can't find a replacement,
   delete that record — don't leave a stale one in place hoping it still
   works.

## Adding a brand-new country

1. Research using the source hierarchy above. Do not rely on memory/general
   knowledge for the actual numbers — always click through to a real,
   current page.
2. Add the country's records to `CRISIS_RESOURCES`, following the shape
   above.
3. It will automatically appear as a "verified" country the moment its ISO
   code has at least one entry (`hasVerifiedResources()`/
   `VERIFIED_COUNTRY_CODES` are derived from the array — nothing else to
   register).
4. If you're not confident in what you found, don't add it — the fallback
   state is the safe default for any country not yet in this file.

## Where the pieces live

- `lib/crisisResources.ts` — the data + `getResourcesForCountry()`,
  `hasVerifiedResources()`, `toTelHref()`, `toSmsHref()`.
- `lib/countries.ts` — `COUNTRY_OPTIONS` (ISO code, name, dial code, flag)
  used by the dropdown itself; unrelated to which countries have verified
  crisis data — this list includes every country in the world so the
  dropdown is always searchable, even for a country without resources yet
  (which then shows the fallback).
- `components/crisis/CountrySelector.tsx` — the searchable, keyboard-
  accessible country combobox.
- `components/crisis/CrisisResourceList.tsx` / `CrisisResourceCard.tsx` —
  render the resources (or the fallback) for whichever country is selected.
- `components/CrisisButton.tsx` — wires the above together inside the
  existing "You are not alone" modal; also where the universal "contact
  local emergency services now" notice and GESA's own CMS-editable
  disclaimer live.
- `tests/unit/CrisisResources.test.tsx` — automated coverage for the data
  layer and both components (see that file's header comment — it could not
  be executed in the sandbox this was built in; run it for real before
  merging).
