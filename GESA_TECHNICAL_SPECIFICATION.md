# GESA (Global Emotional Support Alliance) — Technical Specification

**Version:** covers build state through Phase 79 of `EXECUTION_PLAN.md`
**Audience:** developers onboarding to or maintaining this codebase
**Repository root:** `GESA Therapists Profile` (package name `gesa-app`)

---

## 1. Overview

GESA is a nonprofit web platform that connects people in emotional distress with verified volunteer therapists, free of charge. The site combines a public marketing/informational site, an AI-assisted therapist-matching flow, real conflict-free session booking, support-group registration, a client/therapist chat system, and an internal CRM (admin dashboard) for managing all of the above — all built on Next.js 14 with Supabase as the backing database, auth provider, and file storage.

The codebase also ships a full Content Management System: nearly every page's copy (headings, body text, CTA labels/links, images) is editable by an admin through `/admin/content` without a code deploy, backed by a single `site_content` JSONB table.

---

## 2. Tech Stack

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.2.3 |
| UI library | React / react-dom | ^18 |
| Language | TypeScript (strict mode) | ^5 |
| Styling | Tailwind CSS | ^3.4.1 |
| Database / Auth / Storage | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) | ^0.12.4 / ^2.42.0 |
| Animation | Framer Motion | ^11.18.2 |
| Icons | lucide-react | ^0.370.0 |
| Transactional email | Resend | ^3.2.0 |
| AI therapist matching | Anthropic SDK (Claude Haiku) | ^0.32.1 |
| Validation | zod | ^3.23.8 |
| Unit testing | Jest + jest-environment-jsdom + Testing Library (React/jest-dom/user-event) | ^29.7.0 / ^16.0.1 |
| E2E testing | Playwright | ^1.48.0 |
| Node engine | >= 20 | |

Key npm scripts: `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `test` (Jest), `test:e2e` (Playwright), `db:types` (regenerates `lib/database.types.ts` from the live Supabase schema).

`tsconfig.json`: `strict: true`, `moduleResolution: "bundler"`, path alias `@/*` → project root. Two unrelated legacy sub-projects (`gesa-backend-refactor/`, `gesa-website/`) live alongside this app in the same parent folder and are explicitly excluded from the TypeScript project — they are not part of the live site.

`tailwind.config.ts` extends the palette entirely through CSS custom properties (see §12) rather than hardcoded hex values, so the whole site's color scheme is swappable from `app/globals.css` alone.

---

## 3. Architecture & Directory Structure

```
app/                     Next.js App Router — pages + API routes
  admin/                 CRM (gated by requireAdmin())
  api/                   Route handlers (see §5)
  [public routes]/       See §4
  layout.tsx             Root layout: Header, SiteFooterSlot, CrisisButton, providers
  globals.css            Design tokens + component-level utility classes
components/
  admin/                 CRM widgets (tables, status selects, notification bell, scheduling calendar)
  admin/content/         Content Manager tabbed editors (one per site_content key/group)
  motion/                Scroll/reveal animation primitives (see §12)
  match/                 AI matching wizard (multi-step)
  intake/                Path-based quick intake + booking modal
  volunteer/             Volunteer therapist application entry points + modal
  home/                  Homepage sections (Paths, Stats, DonateBand)
  ui/                     Design-system primitives (Button, Card, Badge, Modal, PageHero, etc.)
  chat/                  Client↔therapist messaging UI
  footer/                Footer's "Help us grow" inline form
  layout/                Shared layout hooks (footer-reveal height measurement)
  [top-level]            Header, Footer, Hero, Logo, AuthStatus, CrisisButton, TherapistCard,
                          TherapistsDirectory, SupportGroupsInteractive, FaqAccordion,
                          LanguageSelector, FlagIcon, TranslationProvider
lib/
  supabase/              client.ts (browser), server.ts (SSR/cookie), admin.ts (service-role),
                          middleware.ts (session refresh)
  auth/                  requireAdmin.ts, requireUser.ts, getCurrentProfile.ts
  email/                 resend.ts (safe send wrapper), templates.ts (14 HTML templates)
  ai/                    matchTherapists.ts (Claude + rule-based fallback matcher)
  translations/          he.ts, translate.ts, languages.ts (EN/HE i18n)
  queries.ts             All public + admin Supabase read helpers (~30 functions)
  content.ts             CMS type definitions, fallback content objects, getPageContent()
  database.types.ts      Hand-authored Supabase schema types (source of truth for the app's view of the DB)
  adminSchedule.ts        Shared types/constants for the CRM scheduling calendar
  legal-pages.ts, sample-therapists.ts, sample-support-groups.ts, chat.ts
tests/
  unit/                  Jest + React Testing Library (~24 spec files)
  e2e/                   Playwright specs
middleware.ts             Root-level — refreshes the Supabase auth cookie on every request
EXECUTION_PLAN.md          Running build log — one dated, numbered "Phase" entry per unit of work,
                            each ending in a review "Gate." This is the closest thing the project has
                            to a changelog and design-decision record; consult it for the *why* behind
                            any non-obvious choice in the code.
ENV_VARS.md, .env.example  Environment variable reference (see §13)
```

---

## 4. Public Routes (`app/**/page.tsx`)

| Route | Purpose |
|---|---|
| `/` | Homepage — `Paths` (gold-band hero + 3 flip-card paths: crisis / veterans / general support), `Stats`, `DonateBand`. Content key `page_home`. |
| `/about` | Mission, "how GESA works," founders (alternating photo/text rows), volunteer CTA, legal/tax blurb. Content keys `page_about_hero` + `page_about_sections`. |
| `/therapists` | Public therapist directory with filters (language, duration, gender, specialty). Content keys `page_therapists` + `component_therapists_directory`. |
| `/therapists/[slug]` | Individual therapist profile page. |
| `/support-groups` | Support group listing + registration flow. Content keys `page_support_groups` + `component_support_groups_directory`. |
| `/find-your-therapist` | Full AI-assisted matching wizard (`MatchWizard`). |
| `/intake` | Path-based quick intake (`?path=crisis\|veteran\|general\|helpers`), also AI-matched. |
| `/contact` | General contact form → `inquiries` table. |
| `/faq` | FAQ accordion (DB-driven questions, CMS-driven banner). |
| `/blog`, `/blog/[slug]` | Blog listing/detail — currently disabled/unused (no published content yet). |
| `/login`, `/signup` | Supabase Auth email/password sign-in and account creation. |
| `/forgot-password`, `/reset-password` | Password recovery flow (Phase 78) — request a reset email, then set a new password via the emailed recovery link. |
| `/account` | Signed-in user's account details form. |
| `/messages`, `/messages/[threadId]` | Client ↔ therapist chat. |
| `/[slug]` | Catch-all — renders a `legal_pages` row (Privacy Policy, Terms, etc.) by slug. |

---

## 5. Admin Routes (`app/admin/**`)

All routes under `/admin` are gated by `requireAdmin()` (redirects signed-out users to `/login?next=/admin`; redirects any signed-in non-admin, including the `reviewer` role, back to `/`). The admin layout applies a static gold-gradient background (`.admin-gold-bg`) and a persistent side nav.

| Route | Purpose |
|---|---|
| `/admin` | Dashboard overview — KPI tiles (sessions, match requests, volunteer applicants, etc.), a 6-month activity trend chart, a scrollable recent-activity feed, the unified Scheduling Overview calendar, and a live email-delivery health-check banner (warns if `RESEND_API_KEY`/`GESA_CONTACT_INBOX` aren't configured). |
| `/admin/sessions` | Real, conflict-free confirmed session bookings (`session_bookings`). |
| `/admin/match-requests` | "Find Your Therapist" AI match requests, with inline conflict-warning badges against real session bookings and other pending requests for the same therapist/slot. |
| `/admin/bookings` | Legacy "preferred time" booking requests (`booking_requests`) — a softer, non-guaranteed precursor to the real session-booking system. |
| `/admin/volunteer-applications` | Volunteer therapist applications (`therapist_applications`) with bulk activate/deactivate. |
| `/admin/inquiries` | Contact-form submissions, including the footer's "Help us grow" mini-form (tagged distinctly by `type`). |
| `/admin/registrations` | Support group registrations. |
| `/admin/messages`, `/admin/messages/[threadId]` | Admin monitoring of client/therapist chat threads. |
| `/admin/therapists`, `/admin/therapists/[id]` | Therapist roster CRUD, with bulk activate/deactivate. |
| `/admin/users` | User/profile role management. |
| `/admin/content` | The Content Manager — tabbed editor over every `site_content` key (see §7). |

The `NotificationBell` component (visible across all admin pages) polls every 60 seconds and surfaces new submissions across every type — match requests, bookings, inquiries, session bookings, volunteer applications, and group registrations — with a detail modal per item type.

---

## 6. API Routes (`app/api/**/route.ts`)

| Route | Method | Purpose |
|---|---|---|
| `/api/match` | POST | Runs `matchTherapists()` against active therapists and returns ranked matches. No DB write. |
| `/api/match-booking` | POST | Persists a `match_requests` row and sends confirmation + team + therapist notification emails. |
| `/api/booking` | POST | Legacy match/booking flow — inserts `booking_requests`, looks up the matched therapist's contact email server-side, sends 3 emails. |
| `/api/intake-booking` | POST | The real, conflict-free session-booking endpoint. Validates age ≥ 18 (from `birthYear`) and required consent flags, re-checks slot freshness via the `get_booked_slots` RPC immediately before insert, relies on a DB `UNIQUE(therapist_id, session_date, session_time)` constraint as the final race-condition guard (catches Postgres error code `23505`), then sends 3 emails. |
| `/api/therapist-availability` | GET | `?therapistId=&date=` — computes open 60-minute slots from `therapist_weekly_hours` minus already-booked slots. |
| `/api/translate` | POST | Batches up to 200 strings through Google Cloud Translation for the EN/HE language switch. |
| `/api/email/welcome` | POST | Post-signup welcome email. |
| `/api/email/contact` | POST | Contact-form confirmation + admin team notification. |
| `/api/email/group-registration` | POST | Support-group registration confirmation. |
| `/api/email/volunteer-application` | POST | Volunteer application confirmation + team notification. |

---

## 7. Database Schema

Source of truth for the app's view of the schema: `lib/database.types.ts` (hand-maintained; regenerate via `npm run db:types`). Verified live against the production Supabase project — all tables below exist there. (The production project also contains a number of `gesa_*`-prefixed and other extra tables — `matches`, `sessions`, `payments`, `intake_requests`, `therapist_documents`, etc. — left over from earlier/parallel iterations of this project; they are not referenced by the current app code and are out of scope of this spec.)

### Enums
`AppRole` (`admin` | `reviewer` | `therapist` | `client` | `finance`), `DocumentStatus`, `DocumentType`, `GenderType`, `SessionDuration` (`30`|`45`|`60`|`90`), `TrackType` (`war_terror`|`antisemitism_diaspora`|`helping_helpers`|`group_support`), `GenderPreference`, `SessionFormat` (`online`|`call`|`in_person`), `ContactChannel` (`email`|`whatsapp`|`zoom`), `BookingStatus` (`confirmed`|`cancelled`), `MeetingDurationChoice`.

### Tables

| Table | Key columns |
|---|---|
| `profiles` | id, email, full_name, phone, country, preferred_language, role (`AppRole`), created_at, updated_at |
| `clients` | id, profile_id, full_name, email, phone, country, track, is_minor, guardian_consent_at, is_soldier_or_crisis, free_sessions_total, free_sessions_used, no_show_count |
| `therapists` | id, profile_id, slug, full_name, bio, short_summary, credentials, gender, languages[], specialties[], tracks[], session_lengths[], years_experience, contact_email, contact_phone, time_zone, photo_url, is_active, is_verified, verified_at, verified_by |
| `therapist_weekly_hours` | id, therapist_id (FK), day_of_week (0–6), start_time, end_time |
| `therapist_applications` | id, full_name, email, phone, credentials_proof, specialties[], languages[], meeting_duration, bio, status, notes, reviewed_at, reviewed_by (FK profiles) |
| `clinic_locations` | id, name, address, is_active |
| `match_requests` | id, name, email, phone, symptoms[], treatment_type, gender_preference, session_format, clinic_location_id (FK), preferred_date, preferred_time, selected_therapist_id (FK), matched_therapist_ids[], ai_reasoning (jsonb), status |
| `booking_requests` | id, entry_route, name, email, matched_therapist_id (FK), status |
| `session_bookings` | id, therapist_id (FK), client_name/email/phone/city, client_birth_year, agreed_terms_at, agreed_privacy_at, session_date, session_time, contact_channel, path, status. **`UNIQUE(therapist_id, session_date, session_time)`** — the actual double-booking guard. |
| `support_groups` | id, title, description, format, schedule, location, capacity, facilitator_name, register_url |
| `group_registrations` | id, group_id, name, email, phone |
| `inquiries` | id, name, email, phone, type, message |
| `chat_threads` | id, client_id (FK clients), therapist_id (FK therapists) |
| `chat_messages` | id, thread_id (FK), sender_id, body, read_at |
| `blog_posts` | id, slug, title, subtitle, author, category, body, status, published_at |
| `faqs` | id, question, answer, sort |
| `testimonials` | id, author, role, quote, sort — currently unused (homepage section removed) |
| `legal_pages` | id, slug, title, body, updated_at |
| `site_content` | id, key, value (jsonb), updated_at — the CMS backing table |
| `crisis_resources` | id, region, hotline, hours, language, notes |
| `translation_cache` | id, source_hash, source_text, target_lang, translated_text |

### Database functions
- `auth_role()` → `AppRole`
- `get_or_create_my_client()`
- `get_or_create_thread(p_therapist_id)`
- `get_booked_slots(p_therapist_id, p_date)` → `{session_time}[]`

### RLS pattern
Every table has public-read where content is non-sensitive (`site_content`, `faqs`, `testimonials`, `legal_pages`) or gated on `is_active` (`therapists` — note: intentionally *not* also gated on `is_verified`, which has no admin UI to manage it). Admin-only reads use `*_admin_read`-style policies restricted to `role = 'admin'`. User-submitted tables (`inquiries`, `booking_requests`, `match_requests`, `session_bookings`, `group_registrations`, `therapist_applications`) follow a public-insert + admin-read + admin-update pattern. All server-side app queries run under the signed-in user's session via the anon key — never the service-role key — so RLS is the real enforcement layer; `requireAdmin()`/`requireUser()` in application code are defense-in-depth, not the sole gate. `lib/supabase/admin.ts` (service-role, bypasses RLS) is explicitly documented as server-only, with callers responsible for their own authorization checks.

---

## 8. Content Management System

**Contract:** every editable page/section is one row in `site_content` (`key text`, `value jsonb`). `getPageContent<T>(key, fallback)` (`lib/content.ts`) fetches the row; if the row is missing, the fetch throws, or `value.published === false`, it returns the hardcoded fallback object — shallow-merged over the defaults so a new field added to the type doesn't break old published rows. **Pages never render blank or broken even if the CMS is misconfigured or a row hasn't been published yet.**

### Known `site_content` keys

| Key | Controls | Editor component |
|---|---|---|
| `page_home` | Hero eyebrow/title/subtitle, 3 trust badges, footer caption, 3 path cards (title/description/CTA label+link each) | `HomeEditor.tsx` |
| `page_about_hero` | Shared `Hero` component's eyebrow/title/highlight/subtitle/CTAs/background image | `HeroEditor.tsx` |
| `page_about_sections` | Mission section, "how it works" points, founders (name/role/email/bio/photo), volunteer CTA band, legal/tax blurb | `AboutSectionsEditor.tsx` |
| `page_footer` | Tagline, nav column labels, social links, trusted-partners row, copyright/made-with lines | `FooterEditor.tsx` |
| `site_header` | Nav labels, Donate label/href | `HeaderEditor.tsx` |
| `page_therapists`, `page_support_groups`, `page_blog`, `page_faq`, `page_contact` | Simple eyebrow/title/description banners | `SimplePageEditor.tsx` (shared) |
| `component_therapists_directory` | Filter sidebar labels (search, definitions, empty state) | `TherapistsDirectoryEditor.tsx` |
| `component_support_groups_directory` | Registration flow strings | `SupportGroupsDirectoryEditor.tsx` |

FAQ questions/answers and legal page bodies are DB-table-driven (`faqs`, `legal_pages`) rather than `site_content`, managed via `FaqManager.tsx` and `LegalPagesManager.tsx` respectively.

`app/admin/content/page.tsx` bulk-fetches every key via `getSiteContentMap()` and renders `ContentManagerApp.tsx`, a tabbed editor (Home / About Hero / About Sections / Footer / Header / Therapists / Support Groups / Blog / FAQ / Contact / Legal Pages / FAQ Manager).

---

## 9. Authentication & Roles

| File | Role |
|---|---|
| `lib/supabase/client.ts` | Browser client (`createBrowserClient`, anon key) |
| `lib/supabase/server.ts` | Server Component / Route Handler client (`createServerClient`, cookie-based session) |
| `lib/supabase/admin.ts` | Service-role client — bypasses RLS, server-only, no session persistence |
| `lib/auth/getCurrentProfile.ts` | `auth.getUser()` + joined `profiles` row |
| `lib/auth/requireUser.ts` | Redirects signed-out visitors to `/login?next=<path>` |
| `lib/auth/requireAdmin.ts` | Redirects signed-out to `/login?next=/admin`; redirects any signed-in non-`admin` (including `reviewer`) back to `/` |

Roles: `admin`, `reviewer`, `therapist`, `client`, `finance`. Password recovery (Phase 78) uses Supabase's built-in `resetPasswordForEmail` / `updateUser` flow — no custom `/auth/callback` route was needed since `@supabase/ssr`'s browser client automatically exchanges the recovery code in the URL for a session on load.

Root `middleware.ts` calls `updateSession()` (`lib/supabase/middleware.ts`) on every request except static assets, refreshing the auth cookie so server-rendered pages always see current session state.

---

## 10. Key Features & Flows

**AI therapist matching** (`lib/ai/matchTherapists.ts`): hard-filters candidates by `gender_preference` (falls back to the unfiltered pool + a `genderPreferenceHonored: false` flag if no therapist of that gender exists); calls Claude Haiku with a strict JSON-array-only prompt weighting treatment-type matches heavily. On a missing `ANTHROPIC_API_KEY` or any failure/parse error, silently falls back to `ruleBasedMatch()` (keyword-overlap scoring + an exact-specialty bonus). Returns up to 3 matches with one-sentence reasoning each. Used by `/api/match`, the `/find-your-therapist` wizard (`MatchWizard` → `StepPreferences` → `StepAssessment` → `StepFormatLocation` → `StepMatches` → `BookingModal`), and `/intake`.

**Volunteer therapist application:** `VolunteerApplicationModal.tsx` inserts directly into `therapist_applications`, then `/api/email/volunteer-application` sends confirmation + team-notification emails. Reviewed at `/admin/volunteer-applications`, with bulk activate/deactivate.

**Real session booking** (the conflict-free system): `IntakeBookingModal.tsx` / `BookSessionButton.tsx` → `GET /api/therapist-availability` (weekly hours minus already-booked slots) → `POST /api/intake-booking` (age/consent validation, a slot-freshness re-check, and the DB-level unique constraint as the final guard against a race between two people booking the same slot at once). This is distinct from the older, non-guaranteed `match_requests`/`booking_requests` "preferred time" flows, which only record a *preference* and rely on an admin to actually schedule it (with conflict-warning badges surfaced in `/admin/match-requests` to help catch collisions before they're confirmed).

**Support groups:** `SupportGroupsInteractive.tsx` → registration inserts into `group_registrations` → `/api/email/group-registration`.

**Admin CRM highlights:**
- Dashboard KPIs, 6-month trend chart, and a unified Scheduling Overview calendar merging sessions, match requests, bookings, inquiries, registrations, and volunteer applications by date.
- `NotificationBell` polls every 60s; admins see every submission type, a therapist account sees only their own matched sessions. "Unread" state is tracked client-side via a `localStorage` timestamp, not a DB column.
- Per-table bulk status-select components (`BookingStatusSelect`, `MatchRequestStatusSelect`, `SessionBookingStatusSelect`, `VolunteerApplicationStatusSelect`, `RoleSelect`) and bulk activate/deactivate on the Therapists table.
- A live email-delivery health-check banner on the dashboard, warning if `RESEND_API_KEY`/`GESA_CONTACT_INBOX` are unset in the current deploy.

**Client ↔ therapist chat:** `ChatWindow.tsx`, backed by `chat_threads`/`chat_messages`, with an admin monitoring view at `/admin/messages`.

**Footer "Help us grow" form:** an inline lead-capture mini-form (name/phone/email/subject/consent) embedded in the site footer, saving into the same `inquiries` table as the main Contact page but tagged with a distinct `type` so admins can tell the two apart.

**Zoom:** referenced as a `ContactChannel` option (`email`|`whatsapp`|`zoom`) a client can request for a session, but there is no automated Zoom API integration — meetings on that channel are arranged manually by an admin/therapist after booking. This is a deliberate, previously-confirmed decision, not a gap.

**i18n:** English/Hebrew toggle (`LanguageSelector.tsx`, `TranslationProvider.tsx`), RTL layout support (including an icon-mirroring CSS rule for directional lucide icons), and a `translation_cache` table backing `/api/translate` (Google Cloud Translation) so repeated strings aren't re-translated on every request.

---

## 11. Email System

`lib/email/resend.ts` wraps the Resend SDK. `sendEmailSafely()` **never throws** — if `RESEND_API_KEY` is unset it logs a warning and no-ops, so no user-facing action (booking, application, registration) is ever blocked by email delivery being down or unconfigured.

`lib/email/templates.ts` exports 14 inline-HTML templates, all sharing a common `shell()` wrapper (sage/gold/cream palette matching the site's own design tokens): `welcomeEmail`, `contactReceivedEmail`, `contactNotificationEmail`, `volunteerApplicationReceivedEmail`, `volunteerApplicationNotificationEmail`, `bookingConfirmationEmail`, `bookingTeamNotificationEmail`, `therapistNewMatchEmail`, `matchConfirmationEmail`, `matchTeamNotificationEmail`, `sessionBookingConfirmationEmail`, `sessionBookingTeamNotificationEmail`, `sessionBookingTherapistNotificationEmail`, `groupRegistrationEmail`.

---

## 12. Design System & Motion

### Color tokens (`app/globals.css`)
Powder-Ivory / Deep-Slate base (`--background: #eef1f6`, `--foreground`/`--primary: #2b3140`), a sage-green accent family (`--accent: #9ba283`, `--accent-soft`), a muted-gold family used for fine borders and eyebrow labels (`--clay: #bfa046`, `--clay-soft`), a deeper bronze-gold for higher-contrast accents (`--amber: #8c6f1f`, `--amber-soft`), `--sage-soft` (introduced for the About legal blurb + Home Stats sections), `--espresso` (deep-contrast surface used by the Footer), `--destructive: #bb5138`, `--radius: 22px`. Typography: `Cormorant Garamond` (serif, headings) + `Nunito Sans` (sans, body).

### Notable component classes
- `.gold-banner` — an animated, slow diagonal light-sheen gradient used for hero bands (Home, About, Our Therapists, Support Groups), opt-in via a `gold` prop on shared components.
- `.admin-gold-bg` — a static (non-animated) version of the same gold gradient, used for the CRM so it doesn't distract from dense data screens admins read daily.
- `.gold-card-hover` — a one-shot diagonal light-sweep hover effect used on the homepage's path cards.
- `.charcoal-marble` — the dark card surface used on Support Groups.
- `.reveal-page__*` — the fixed-layer "footer reveal" effect (Home/About/Therapists/Support Groups only): the Footer sits in a layer fixed to the viewport bottom, covered by the page's own content until the visitor scrolls past a reserved margin. Disabled below 760px width and under `prefers-reduced-motion`.
- `.wrap` / `.narrow` / `.section` / `.hero` / `.eyebrow` — shared layout utility classes used throughout.

### Motion primitives (`components/motion/`)
`config.ts` centralizes shared timing/easing (`micro: 0.2s`, `reveal: 0.65s`, `large: 0.9s`, `stagger: 0.12s`, a no-bounce ease curve, and a distance scale of `sm/md/lg` pixels), plus `REVEAL_VIEWPORT` (trigger once, with a `-10%` viewport margin). `Reveal.tsx` is the general-purpose "animate in on scroll" primitive (`fade | fade-up | fade-scale | horizontal | horizontal-right | image` variants), and — like every motion primitive on the site — fully respects `prefers-reduced-motion` by dropping to a plain, near-instant opacity fade. `StaggerReveal` (grouped staggered entrances), `ParallaxLayer`/`ParallaxMedia` (subtle scroll-linked depth), `ScrollText` (subtle headline drift), `SmoothScroll` (native CSS smooth scrolling — deliberately not scroll-hijacking JS, to avoid conflicting with the fixed footer-reveal layer), `AnimatedCounter`. `HorizontalScroll.tsx` and `NewsTicker.tsx` are built and functional but currently unused on any live page (kept rather than deleted, per this project's standing rule against removing files without explicit confirmation).

---

## 13. Environment Variables

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Per-environment Supabase project (Dev project id `ggjvpfivyqartvanvhzq`; Production project id `iddeoavrlnvwwfopsacy`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only, never `NEXT_PUBLIC_`-prefixed |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (default `GESA <no-reply@gesa.org>`), `GESA_CONTACT_INBOX` (default `hello@gesa.org`) | Blank key ⇒ all transactional emails silently no-op, never blocking the underlying action |
| `ANTHROPIC_API_KEY` | Powers AI therapist matching; blank ⇒ silent rule-based fallback |
| `GOOGLE_TRANSLATE_API_KEY` | Powers the EN/HE translation toggle; blank ⇒ language preference and RTL layout still work, but text stays English |
| `NEXT_PUBLIC_SITE_URL` | Used for absolute links in emails and auth redirect URLs (e.g. the password-reset link) |
| `NEXT_PUBLIC_APP_ENV` | `development` \| `production` |

Full reference with example values: `ENV_VARS.md` and `.env.example`.

---

## 14. Testing

**Unit (Jest + React Testing Library):** `jest.config.js` uses Babel (not Next's SWC transform) specifically to avoid a SIGBUS crash observed on network-mounted project directories; `testEnvironment: "jsdom"`. `jest.setup.ts` stubs `IntersectionObserver` and `ResizeObserver` (neither exists in jsdom, and both are required by the motion/reveal system and the footer-reveal height measurement respectively). Roughly two dozen spec files under `tests/unit/` cover pages, components, and pure logic (`matchTherapists`, email templates, a `database.types.ts` smoke test).

**E2E (Playwright):** `playwright.config.ts` builds and serves the app, then runs against two projects (Desktop Chromium, Mobile Safari/iPhone 13), with trace-on-first-retry and screenshot-on-failure. Specs cover navigation, auth, contact, support groups, and the therapist directory.

**Verification standard used throughout this project's history:** a scoped `tsc --noEmit` (via a temporary tsconfig with a narrow `include` list) plus real, passing Jest tests for every change — never a type-check alone.

---

## 15. Notes for Future Work

- Production's Supabase project should be checked against Dev for any migrations that haven't yet been applied (this has been an active gap flagged in `ENV_VARS.md` at various points in the project's history — always verify current state before assuming parity).
- `testimonials`, `NewsTicker`, and `HorizontalScroll` are fully built but currently unused on any live page.
- Zoom is intentionally manual-only; there is no Zoom API integration and none is currently planned.
- `therapists.is_verified` has no admin UI to set it, even though `is_active` (which does have one) is the actual public-visibility gate today.
- `EXECUTION_PLAN.md` is the authoritative, chronological record of *why* each part of the system looks the way it does — consult it before assuming something is a bug rather than a deliberate, previously-discussed decision.
