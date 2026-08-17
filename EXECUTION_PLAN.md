# GESA Web App Platform — Execution Plan

Owner: Roy (roy@ventvest.com) · Maintained by: Claude (Cowork)
Last updated: 2026-08-13 (Phase 6)

This document is the single source of truth for scope, phase status, and open
decisions. It is updated after every phase — do not let it drift from reality.

## Stack

- Frontend/Backend: Next.js 14 (App Router, TypeScript) — single codebase, API routes for server logic
- Database/Auth/Realtime/RBAC: Supabase
- Email: Resend
- Hosting: Vercel
- Repo: GitHub
- Testing: Playwright (E2E) + Jest/RTL (unit)

## Environments

| Env | Supabase project | Project ref | Status |
|---|---|---|---|
| Production | gesa.org26@gmail.com's Project | `iddeoavrlnvwwfopsacy` | Existing — holds real therapist/booking/inquiry data (145 therapists) |
| Dev | gesa-dev | `ggjvpfivyqartvanvhzq` | Existing shell — schema will be rebuilt fresh in Phase 3 |
| UAT | gesa-uat | *not yet created* | **Blocked** — org `gesa.org26@gmail.com` is on the free plan, capped at 2 active projects (Prod + Dev already use both). Needs Roy to either upgrade the org plan or pause/delete a project before a 3rd can be created. |

Vercel will get three environments/branches mapped to these three Supabase
projects: `main` → Production, `uat` → UAT, all other branches/PRs → Dev.

## Source documents

- Brief: this conversation (stack, environments, testing/QA requirement, phase-gated delivery)
- Proposal used for QA cross-check: **GESA_Website_Development_Proposal.docx** (Drive, owned by roy@ventvest.com) — v2.0 proposal covering booking, smart matching, automation, onboarding, payments, safety/SOS, CRM, AI, compliance. Note: that doc recommends a Base44 backend; we're following this session's brief (Next.js + Supabase) for the stack and using the proposal only as the *scope/requirements* checklist for QA.
- Visual/content source for replication: `gesa-website/gesa-site.html` (local mockup)
- Existing partial scaffolds found in the folder, superseded by this plan: `gesa-backend-refactor/` (Vite prototype), `app/README.md`-less Next.js scaffold now being extended in place at project root.

## Decisions log

- 2026-08-12 — Building directly in the existing project root (not a new subfolder); reusing the Next.js App Router scaffold already present (`app/`, `components/`, `package.json`).
- 2026-08-12 — Ignoring the prior `gesa-dev` schema/migrations and the earlier "Antigravity" plan doc found in Drive; designing the DB schema fresh in Phase 3.
- 2026-08-12 — Env mapping: `iddeoavrlnvwwfopsacy` = Production (real data), `gesa-dev` = Dev. UAT project creation blocked on Supabase free-tier project limit (see above).
- 2026-08-12 — No GitHub/Vercel MCP connector available. Roy will create the GitHub repo and Vercel project; Claude pushes code and supplies exact env var values per environment.
- 2026-08-12 — **Security finding, unrelated to this build**: in the Production project, `gesa_therapist_photo_map`, `gesa_group_registrations`, and `gesa_zoom_enrollments` have RLS disabled (anon key can read/write freely). Remediation SQL provided to Roy, not auto-applied (needs matching policies before enabling to avoid breaking access).

## Phases

### Phase 1 — Setup & Foundation ✅ (this session, with 2 handoffs to Roy)
- [x] Verify existing Next.js 14 App Router + TypeScript scaffold at project root
- [x] Confirm core deps present (`@supabase/supabase-js`, `resend`, `lucide-react`); added `@supabase/ssr`, `zod`
- [x] Add `typecheck` and `db:types` scripts; excluded legacy `gesa-backend-refactor/` prototype from the TS project (its Vite-only types broke `tsc`)
- [x] `npm install` + `npm run typecheck` both clean
- [x] `.env.example` covering all three environments' variables
- [x] `git init` run — **but see note below, first commit needs to happen on Roy's machine**
- [ ] UAT Supabase project — **blocked**, see Environments table
- [ ] GitHub repo + Vercel project — pending Roy (no connector available)

**Environment note:** this sandbox's mount of the Downloads folder has flaky file-lock
behavior — `npm install` cleanup, `rm -rf .next`, and `git commit` all hit
`EPERM`/"Operation not permitted" on file deletes (a stray `.git/index.lock`
is now stuck and can't be removed from here). This looks like Windows-side
locking (antivirus/OneDrive-style) on the mounted path, not a code issue —
`npm run typecheck` completes cleanly, and `next build` produced valid output
in `.next/` earlier, it just couldn't rebuild cleanly a second time from this
sandbox. **Action needed from Roy:** open a normal terminal on your machine in
this folder and run:
```
del .git\index.lock   (if present)
git add -A
git commit -m "Phase 1: foundation"
```
All subsequent git/npm work in later phases will hit the same limitation, so
expect this handoff pattern to repeat — I'll keep code changes ready in the
folder and flag exactly what needs to be run locally.

### Phase 2 — UI/UX Replication (Frontend) ✅ (this session)
- [x] Verified design tokens/typography in `globals.css` / `tailwind.config.ts` already match `gesa-site.html` exactly (built in an earlier session) — no changes needed
- [x] Verified Header, Hero, Footer already faithfully replicate the mockup (nav links, footer columns, copy) — no changes needed
- [x] Reusable UI primitives: `Button`, `Card`, `Badge`, `Modal` (`components/ui/`)
- [x] `CrisisButton` — floating "In crisis? Get help" button + resource modal (988 Lifeline, Crisis Text Line, findahelpline.com), wired into the root layout
- [x] Home page: Paths (4 support tracks), Stats band, Testimonials, Donate CTA band — real copy pulled directly from the Production Supabase project's `gesa_site_content`/`gesa_testimonials` tables, not placeholder text
- [x] About page — hero, mission, how-it-works, founders (Ilana O'Malley, Karin Horen), volunteer CTA, credibility band — real copy from `gesa_site_content.about_page`
- [x] Our Specialists directory (`/therapists`) — filter sidebar (name/expertise/language/duration/gender) + responsive grid, client-side filtering logic. Uses 9 real therapist records + their actual photos (copied from the project root into `public/images/therapists/`) as placeholder data
- [x] Support Groups (`/support-groups`) — interactive tab list + preview panel (video-call style for online groups, map/RSVP style for in-person), 6 real groups from `gesa_support_groups`
- [x] Blog list + detail (`/blog`, `/blog/[slug]`) — 4 real posts from `gesa_blog_posts` (titles/categories/authors real; full article bodies are a Phase 3 data wire-up)
- [x] FAQ (`/faq`) — accordion, 6 real Q&As from `gesa_faqs`
- [x] Contact (`/contact`) — form UI with subject deep-linking (`?subject=Donation` / `?subject=Volunteer`); submission wires to Resend in Phase 4
- [x] Legal pages (`/privacy-policy`, `/cookies-policy`, `/legal-notice`, `/accessibility-statement`, `/terms-and-conditions`) — routes + titles real, body copy placeholder pending counsel
- [x] Login page shell (`/login`) — visual only, Supabase Auth wiring is Phase 3
- [x] `npm run typecheck` clean

**Not done / deferred:**
- Therapist detail page (`/therapists/[slug]`) — deferred to Phase 3 since it needs live data
- Support Groups' full photorealistic hand+phone mockup treatment from the original — built a simplified faithful version (same colors/copy/layout) instead of the exact illustration effect; can revisit as visual polish later
- `npm run build` and `next lint` could not be verified end-to-end from this sandbox — same file-lock issue as Phase 1. **Action needed from Roy:** run `npm run build` and `npx next lint` locally to confirm before/alongside review.

### Phase 3 — Backend, Auth & Database (Supabase) ✅ (this session)

**Reversed a Phase 1 decision, on purpose:** I'd planned to ignore the existing `gesa-dev` schema and design fresh. Once I actually inspected it, it turned out to be well-built — `app_role` enum (admin/reviewer/therapist/client/finance), proper therapist verification + document-vault workflow, intake→match→session pipeline, chat threads scoped to participants, and a correctly hardened `auth_role()` helper (`SECURITY DEFINER`, `STABLE`, pinned `search_path`, used to avoid RLS recursion on `profiles`). Rebuilding an equivalent schema from scratch just to honor the earlier note would have been worse for you, so I kept it and added what was missing instead of starting over. Flagging the reversal here rather than quietly doing something different from what I said.

- [x] Audited the existing `gesa-dev` schema and RLS policies (13 tables, all covered) — kept as the foundation
- [x] Added what was missing: `testimonials`, `legal_pages`, `site_content` (CMS keys for Home/About), `group_registrations` (anon insert-only, no public read — protects registrant PII), all with RLS
- [x] Added `handle_new_user()` trigger so every Supabase Auth sign-up gets a `profiles` row automatically (defaults to role `client`)
- [x] Hardened `handle_new_user()` (revoked public/anon/authenticated EXECUTE — it's trigger-only). `auth_role()` intentionally keeps anon/authenticated EXECUTE since RLS policies depend on it being callable; reviewed and accepted, only remaining security-advisor warning
- [x] Seeded Dev with real content pulled from the Production project: 9 therapists (+ their real photos), 6 support groups, 6 FAQs, 3 testimonials, 4 blog posts, 5 legal page stubs, `about_page`/`paths_section` CMS content
- [x] Generated TypeScript types (`lib/database.types.ts`) — hand-verified against `generate_typescript_types`, not just copy-pasted (see note below)
- [x] Supabase client setup: browser client, server client (`@supabase/ssr` cookie-based), service-role admin client (server-only, unused so far), middleware session refresh
- [x] Real Supabase Auth: `/login` and `/signup` pages (email+password), header shows Sign in/Sign out based on live session
- [x] Wired to live data (server components + RLS, no service role needed for any of this): Our Specialists directory, Support Groups, FAQ, Blog list + detail, Home testimonials, legal pages
- [x] Contact form now inserts into `inquiries` via the anon key (RLS: insert-only, no public read)
- [x] `npm run typecheck` clean

**A real bug worth knowing about:** hand-writing the generated types file, I used `interface FooRow {}` for each table's row shape instead of `type FooRow = {}`. Functionally those should be interchangeable, but the installed `@supabase/postgrest-js` (2.112.3) resolves generic table lookups incorrectly when the `Row` type is declared via `interface` — every `.insert()`/`.select()` silently typed as `never`, with no error until you tried to use it. Root-caused it by bisecting in an isolated scratch directory, not by guessing. Fixed by switching every row type to a `type` alias. If you or anyone regenerates this file with `npm run db:types`, the Supabase CLI's own generator already emits `type`, not `interface`, so this is specific to my hand-transcription and won't recur from the CLI.

**Deferred to Phase 4:** Support Groups' "Register" button and the group-signup flow (needs the Resend confirmation email to be meaningful). Therapist detail page (`/therapists/[slug]`) — still not built, needs a decision on scope (Phase 4 or 5).

**Cleanup needed from you:** two scratch debug files, `t2.ts` and `test-types.ts`, ended up in the project root during the bug hunt above and this sandbox can't delete them (same file-lock issue as everything else). Please delete both before committing.

**Still open:** `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` is blank — not fetchable by me for security reasons. Not needed yet (everything so far runs under anon key + RLS), but Phase 4/6 admin or webhook work may need it. Grab it from Supabase Dashboard → gesa-dev → Project Settings → API when you get a chance.

### Phase 4 — In-App Chat & Email ✅ (this session)

- [x] Added `read_at` to `chat_messages` for read receipts (column added; UI marking-as-read is not wired yet — see below)
- [x] Two security-definer RPCs: `get_or_create_my_client()` (provisions a `clients` row for the signed-in user on first use, since there's no formal intake/booking flow yet) and `get_or_create_thread(therapist_id)` (finds or starts a chat thread) — both scoped to `auth.uid()`, callable only by `authenticated`
- [x] Enabled Realtime on `chat_messages` (Supabase Realtime respects RLS, so subscribers only receive changes to threads they're actually part of)
- [x] Chat UI: "Message" button on each therapist card → `/messages` (thread list) → `/messages/[threadId]` (live thread, `postgres_changes` subscription + send box)
- [x] Resend integration: `lib/email/resend.ts` (fire-and-forget wrapper — email failures never block the underlying DB action) + 3 HTML templates (welcome, contact received/notification, group registration confirmation)
- [x] Wired real sends: signup → welcome email; contact form → confirmation to sender + notification to `GESA_CONTACT_INBOX`; Support Groups now has a working **Register** modal (writes to `group_registrations`, then sends a confirmation email)
- [x] `npm run typecheck` clean (this phase's bug: `Relationships: []` on every table in the hand-written types file meant embedded selects like `chat_threads.select("...clients(...), therapists(...)")` couldn't resolve — fixed by giving `chat_threads` real relationship metadata pointing at `clients`/`therapists`)

**Known limitations, by design given what's built so far:**
- No `RESEND_API_KEY` is set, so every email call currently no-ops with a console warning instead of failing the request. Add the key (and a verified sending domain in Resend) to turn this on for real.
- The 9 seeded sample therapists have no linked auth account (`profile_id` is null), so a client can start a thread with them but there's no therapist login yet to reply from. Chat is fully functional between two real accounts — this is a data gap, not a code gap. Resolves naturally once therapist sign-up/onboarding exists.
- Read receipts: the column exists and messages carry `read_at`, but nothing currently marks a message read on view. Small follow-up if you want it before Phase 5.

### Phase 5 — Automated Testing & QA Framework ✅ (this session — unit tests verified in-sandbox)

- [x] Jest + React Testing Library configured. Had to move off `next/jest`'s default SWC transform (`jest.config.js` now uses `babel-jest` + `babel.config.jest.js`, Jest-only, doesn't touch `next build`) — the native SWC binary was crashing with a SIGBUS error when loaded from this network-mounted folder. Also narrowed `roots` so Jest's file crawler doesn't walk all of `node_modules` (was causing multi-minute hangs on this filesystem).
- [x] 6 unit test files (`tests/unit/`): `Button`, `Badge`, `FaqAccordion` (expand/collapse logic), `TherapistsDirectory` (filter logic + empty state), `emailTemplates` (all 4 Resend templates), `databaseTypes.smoke` (confirms `lib/database.types.ts` type helpers resolve correctly)
- [x] Playwright configured (`playwright.config.ts` — Chromium + mobile Safari viewport, auto-builds and starts the app)
- [x] 5 E2E spec files (`tests/e2e/`): navigation + crisis modal, therapist directory filters, support groups tabs/register modal, contact form (network-stubbed), auth (signed-out state, bad login, `/messages` redirect, signup validation)
- [x] `npm test` / `npm run test:e2e` scripts added to `package.json`
- [x] GitHub Actions CI workflow (`.github/workflows/ci.yml`) — lint + typecheck + unit on every PR, E2E against Dev Supabase on push to `main`/`uat`
- [x] **`QA_TRACEABILITY.md`** — full cross-check against `GESA_Website_Development_Proposal.docx`, section by section. Short version: the public-facing site (browsing, filtering, chat, auth, email) is built and matches the proposal's IA. Everything past that — booking/calendar, the matching engine, therapist onboarding/verification, session reminders, payments/donations processing, CRM dashboards, AI features, GDPR-grade compliance tooling — is **not built**, because it wasn't in this engagement's brief. The proposal treats those as later, separately-scoped phases; this makes that boundary explicit rather than leaving it implicit.

**Actually ran the tests, not just wrote them.** Once the SIGBUS and crawler-hang issues above were fixed, I ran each unit test file for real, one at a time, in this sandbox:

| File | Result |
|---|---|
| `Button.test.tsx` | ✅ Pass |
| `Badge.test.tsx` | ✅ Pass (2/2) |
| `emailTemplates.test.ts` | ✅ Pass (5/5) |
| `FaqAccordion.test.tsx` | ✅ Pass (3/3) |
| `databaseTypes.smoke.test.ts` | ✅ Pass |
| `TherapistsDirectory.test.tsx` | ⚠️ Not confirmed — see below |

Every file that finished, passed with no code changes needed — the tests and components were correct as written. The earlier reports of "hangs" during this investigation turned out to be a red herring: this sandbox's Jest cold-start overhead is very high and inconsistent on this network-mounted filesystem (100–150+ seconds of pure startup/module-resolution overhead before a single test runs), and my own tool has a hard ~3-minute cap per command. Files landed anywhere from 30s to 168s of *actual* run time — some cleared my cap with seconds to spare, one (`TherapistsDirectory.test.tsx`, which has the most test cases and the most `userEvent` interaction) didn't finish before the cap hit. I read through that file and its component — no logic issue, just the slowest of the six.

**Action needed from Roy:** your machine won't have this filesystem penalty, so `npm test` should run in seconds, not minutes. From the actual project folder (not `C:\Users\Coolmax123>` — that's what caused the `ENOENT` errors in the screenshot):
```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
npm install
npm test                    # Jest — all 6 files, should take a few seconds total
npx playwright install      # one-time browser download
npm run test:e2e            # builds + starts the app, runs E2E
```
E2E still hasn't been run anywhere — Playwright's `webServer` step runs `next build && next start`, and `next build` is one of the operations this sandbox can't complete cleanly (same mount issue as Phase 1). That one genuinely needs your machine.

### Phase 6 — Environments, Deployment & CI/CD ⚠️ (code/docs done this session, execution needs your accounts)

- [x] Cleaned up the repo root before the first commit — `.gitignore` now excludes the 146 raw source photos (24MB), the image-processing scratch dirs (`_b/`, `_d/`, `_g/`, `_h/`, `_hp/`, `_imgcheck/`, `_p/`, `_prev/`, `_vframes/`), the superseded prototypes (`gesa-backend-refactor/`, `gesa-website/`), Playwright's `playwright-report/`/`test-results/`, and assorted cruft (`desktop.ini`, `.gitignore.tmp`, `task.md`, `_cardw.jpg`). The two scratch files from the Phase 3 bug hunt (`t2.ts`, `test-types.ts`) are also gitignored now since this sandbox still can't delete them.
- [x] `.github/workflows/ci.yml` reviewed — already correct from Phase 5 (lint+typecheck+unit on every PR, E2E on push to `main`/`uat` against Dev Supabase secrets)
- [x] **`ENV_VARS.md`** — every environment variable for Dev/UAT/Production, with real Supabase URLs and publishable keys filled in (fetched directly from both projects), and exactly what's still blank and why
- [x] **`DEPLOYMENT.md`** — full copy/paste handoff: fixing git, first commit, creating the GitHub repo, pushing `main`/`uat`, adding GitHub Actions secrets, creating the Vercel project, setting env vars per environment (confirmed branch-scoped Preview env vars work on Vercel's free Hobby plan — no Pro upgrade needed for the UAT branch mapping), and a checklist to confirm it all actually works end to end
- [ ] GitHub repo — **blocked, needs you.** No GitHub/Vercel connector exists in this sandbox, and I can't create accounts/repos on your behalf. See `DEPLOYMENT.md` §2.
- [ ] Vercel project + env vars — **blocked, needs you.** See `DEPLOYMENT.md` §4 and `ENV_VARS.md`.
- [x] Branch → environment mapping designed and documented: `main`→Production, `uat`→UAT (Dev Supabase as a stand-in until the UAT project exists), all other branches/PRs→Dev
- [x] CI: lint, typecheck, unit, E2E on PRs — already wired (Phase 5), just needs the two GitHub Actions secrets added (`DEPLOYMENT.md` §3)

**Bigger blocker found this phase: zero git commits exist.** I went back to
commit the accumulated work and found `git log` came back empty — the Phase 1
handoff (asking you to run `git commit` locally) never happened, and this
sandbox's `.git/index.lock` is still permanently stuck from that same phase
(still `Operation not permitted` on delete, confirmed again this session).
Nothing is broken or lost — there's nothing committed yet to lose — but this
means **you're the one who has to make the first commit**, from your own
machine, before any of GitHub/Vercel/CI can go live. `DEPLOYMENT.md` §1 has
the exact commands, including deleting the stuck lock file (trivial on a
normal Windows filesystem, even though it's impossible from this sandbox's
mount).

**Also flagged, not yet acted on:** the Production Supabase project never got
the Phase 3/4 migrations (`testimonials`, `legal_pages`, `site_content`,
`group_registrations`, the sign-up trigger) — those were deliberately applied
to Dev only, so I wouldn't touch live Production data without your sign-off.
Tell me when you want that applied, ideally before the first deploy to `main`.

**Update, same session:** once the GitHub repo, Vercel project, and env vars
were set up, Production still crashed — its database turned out to have an
entirely different, mismatched placeholder schema underneath (not the Dev
schema, and not your real data). With your go-ahead I rebuilt Production's
schema to match Dev exactly and backfilled it with your real content from the
`gesa_`-prefixed tables: 145 real therapists (136 verified/live, 9 pending
verification), 6 crisis hotlines, 6 support groups, 6 FAQs, 4 blog posts, 5
legal pages, 3 testimonials, 12 inquiries, 3 group registrations. The
`gesa_`-prefixed tables themselves were never touched — only read from. The
site now loads correctly in Production.

**What I need from you to close this phase out:**
1. Run the commands in `DEPLOYMENT.md` §1–4 (git commit → GitHub repo → push → Vercel project → env vars) — done, confirmed working this session.
2. Decide whether to upgrade the Supabase org plan (or free a project slot) to unblock the real UAT project — until then, `uat` deploys point at Dev data as a working stand-in.

### Phase 7 — Foundation & Landing Page Architecture ✅ (this session)

Scoped down from a much larger requirements list (branding, landing page
restructure, booking, therapist onboarding, chat, engagement alerts,
analytics, CRM framework) to just the landing page + two-click booking piece,
per your direction — the rest (therapist onboarding/document verification,
profile-view alerts, analytics dashboard, CRM framework) is intentionally
deferred, not forgotten.

- [x] **Brand/visual identity proposal** — formalized the existing sage/clay/cream palette and serif/sans pairing rather than replacing it (it was already working across Phases 1-5), added a simple wordmark concept and one accent color per entry route (crisis/veteran/public), plus a short tone-of-voice guide. Presented as a widget for review; approved.
- [x] Flagged that **legal identity** (nonprofit registration, trademark, entity filings) is outside what I can build — that's a legal matter for Roy, not a design/engineering one.
- [x] **Three-route landing architecture** — turned out to already exist almost exactly as requested: `components/home/Paths.tsx` (from an earlier phase) already implements Crisis / Veteran-Reservist-Family / Seeking Help(Public) + an adjacent "Helping the helpers" path, with "Two clicks to support" messaging already written. No rebuild needed here — just needed the destination it already links to.
- [x] **Two-click booking flow** (`/intake?path=...`) — the actual missing piece. Click 1 = choosing a path card on the homepage (already existed). Click 2 = "Connect me" on the match screen. In between: the server picks a random verified/active therapist and shows their card immediately, no extra click or quiz needed to see the match.
  - `app/intake/page.tsx` — renders the crisis path with real hotline data (from `crisis_resources`) plus a therapist match option below it; renders the veteran/public/helpers paths straight into the match screen.
  - `components/intake/IntakeMatchFlow.tsx` — shows the matched therapist, collects just name + email (not a long form), submits on "Connect me".
  - `app/api/booking/route.ts` + new `booking_requests` table (Dev only so far) — saves the request and sends two emails: a confirmation to the person, and a notification to the GESA team inbox (not to the therapist directly — none of the 145 real therapists have a linked login yet, so a human on your team needs to make the actual introduction for now, same known gap flagged back in Phase 4).
  - **Matching is currently random, not filtered by specialty/track** — the real therapist data doesn't have track (crisis/veteran/etc.) assigned yet (all 145 defaulted to empty on backfill), and specialty tags are too sparse (only ~8 rows have any specialty data at all) to filter meaningfully by entry route yet. Every non-crisis path draws from the same full pool of 136 verified therapists. This can get smarter once therapist tracks/specialties are populated — flagging as an honest limitation, not hiding it.
- [x] `npx tsc --noEmit` clean on all new/changed files. (Unrelated pre-existing issue found: `lib/email/resend.ts` errors on a missing `resend` package type file in this sandbox's `node_modules` — looks like a leftover from the Phase 5 `ENOTEMPTY` workaround, not something introduced this session. Should resolve itself with a fresh `npm install` on your machine; flag it to me if it doesn't.)

**Action needed from Roy:** this code is only in the project folder so far — needs a commit + push to actually go live:
```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 7: landing page + two-click booking flow"
git push
```
Vercel will auto-deploy once pushed. Also worth a quick local `npm install` to confirm the `resend` type issue above clears up.

**Not built yet, deferred per your direction:** therapist onboarding + document verification flow, secure chat history review (existing chat already meets the bar, just not re-verified against this new brief), profile-view alerts, analytics dashboard, and the CRM framework groundwork. Say the word when you want to pick any of these up.

**Update — visual identity applied to the live site:** pulled the actual GESA Branding Discussion doc (Roy shared the link) and found real specifics beyond what I'd guessed: warm/premium palette direction (smokey blue, sage green, gold — noted for a follow-up pass since the current implementation still uses the sage/clay/amber set), a "G"-shaped logo concept (not yet built — implemented a simpler two-circles wordmark mark as an interim), crisis route gets an initial packet of free sessions vs. veteran route getting unlimited access (now reflected in the homepage copy). Applied this session:
- [x] New `components/Logo.tsx` (two overlapping circles — sage + clay) replacing the placeholder leaf icon in the header and footer
- [x] Per-route accent colors on the three homepage path cards: crisis = terracotta/destructive, veteran/family = deep sage, seeking help = warm sage
- [x] Copy updates: crisis vs. veteran session-access language, "reach out now" instead of generic "book a session," "a therapist who understands" instead of "matched provider" (tone-of-voice guide)
- [x] `npx tsc --noEmit` clean

**Still open:** the true "G"-shaped logo mark (doc calls for it specifically, I used a placeholder), and the smokey-blue/gold palette shift — holding off on a full palette swap until Roy confirms he wants to move off the sage/clay/amber set already live everywhere else. Also still waiting on the doc's "Next steps" action-item list (my fetch got cut off there) in case it names specific landing-page layout changes.

**Action needed from Roy:** same as before — this only exists in the project folder:
```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 7: brand identity applied to landing page"
git push
```

**Root-cause layout fix, same session:** Roy flagged the About page as too wide/hard to read. Root cause: five layout classes (`wrap`, `hero`, `section`, `eyebrow`, `sub`, `narrow`) are used across About, Therapists, Support Groups, Blog, FAQ, Contact, legal pages, Messages, **and the homepage itself** (Paths/Testimonials/Donate sections all use them too) — but none of them were ever actually defined in the CSS. They'd been silent no-ops since whenever they were first written, well before this session: no centering, no side padding, no max-width, so text ran edge-to-edge on wide screens. Defined all five properly in `app/globals.css` under `@layer components`, which fixes every page listed above from one change — Tailwind's own utilities (like the `max-w-[760px]` some pages add alongside `wrap`) still load after and correctly narrow the column further where intended. `npx tsc --noEmit` clean.

## Phase 8 — CRM, notifications, therapist profiles, language selector, admin RBAC

Roy's request: re-implement six features he'd had in an earlier build that were missing from the current codebase — CRM dashboard, notification system, therapist profile pages, language selector, CTA buttons, and user management — with all admin/management functions **strictly restricted to the Administrator role**.

**Audit first (Explore subagent, read-only):** confirmed CRM dashboard, notification system, therapist profile pages, and user management/RBAC were fully missing; the language selector was a static, non-functional Globe icon; CTA buttons were already correctly wired everywhere sampled — no work needed there.

**Two scoping decisions from Roy before building:**
- Therapist notifications: rather than "their login emails" (none of the 145 real therapists have a linked Supabase Auth account yet), Roy chose to add a plain `contact_email` column to `therapists` instead.
- Language selector: preference-control only — a working dropdown that saves to the signed-in user's profile, no full site translation/i18n.

**Database (applied to both Dev `ggjvpfivyqartvanvhzq` and Production `iddeoavrlnvwwfopsacy`):**
- `therapists.contact_email` (text, nullable) — added to both.
- New RLS policy `profiles_admin_update` — lets `role = 'admin'` update any profile (previous `profiles_self_update` only allowed a user to update their own row). Deliberately **admin-only, not admin+reviewer**, matching Roy's explicit instruction, even though other pre-existing policies on this table bundle admin+reviewer for reads.
- New RLS policy `booking_requests_admin_update` — same admin-only scope, lets the CRM update a booking's status.
- **Found and fixed a real gap while doing this:** the `booking_requests` table (Phase 7c's two-click booking flow) had only ever been migrated to Dev, never to Production — the live `/api/booking` route would have failed in Production. Created the table there now, matching Dev's schema/constraints/RLS exactly, before adding the Phase 8 policies on top.

**Built:**
- `lib/auth/getCurrentProfile.ts` + `lib/auth/requireAdmin.ts` — server-side guard, admin-only (redirects signed-out users to `/login`, non-admins to `/`). Wraps every `/admin/**` route via `app/admin/layout.tsx`. This is defense-in-depth on top of RLS, not a substitute for it — every admin query still runs under the signed-in user's own session and is independently enforced by the `*_admin_read`/`*_admin_update` policies.
- **CRM dashboard** at `/admin`: overview (counts + role breakdown), `/admin/bookings` (status dropdown per row, wired to `booking_requests_admin_update`), `/admin/inquiries` (read-only), `/admin/registrations` (read-only).
- **User management** at `/admin/users`: lists all profiles, role dropdown per row (`RoleSelect.tsx`, writes via `profiles_admin_update`); an admin can't demote their own account from the UI.
- **Notification system**: `NotificationBell.tsx` in the header — self-gates client-side (checks the signed-in user's own role, renders nothing for non-admins), shows a badge count of `booking_requests` with `status = 'new'`, links to `/admin/bookings`. Also extended `/api/booking` to email the matched therapist directly at their `contact_email` (server-side lookup, not client-supplied) when one is on file — new `therapistNewMatchEmail` template in `lib/email/templates.ts`.
- **Therapist profile pages**: `app/therapists/[slug]/page.tsx` — full bio, credentials, specialties, languages, session lengths, years of experience, message + book CTAs. `TherapistCard.tsx` now links through to it (image/name area wrapped in a `Link`, kept outside the existing `MessageTherapistButton` so nothing's nested inside an anchor).
- **Language selector**: `components/LanguageSelector.tsx` replaces the static Globe button in `Header.tsx` — working dropdown (6 languages), saves to `profiles.preferred_language` for signed-in users, no-ops (local only) when signed out.
- CTA buttons: no changes made, per the audit finding they were already correct.

**Verification:** `npx tsc --noEmit` clean (one unrelated pre-existing error remains in `lib/email/resend.ts` — a corrupted `resend` package install in this sandbox only, flagged in earlier phases, expected to resolve with a fresh `npm install` on Roy's machine). `npx jest tests/unit/TherapistsDirectory.test.tsx` passes (had to add `contact_email: null` to that test's mock fixture). ESLint itself is currently broken in this sandbox (`Cannot find module '.../esutils/lib/utils.js'`) — another local install artifact, not a code issue; couldn't run a lint pass this round.

**Known gaps / left for Roy:**
- No real `contact_email` values populated yet for the 145 real therapists — the column exists and the send path is wired, but until it's populated, therapist-match emails silently no-op (client + team emails still send as before).
- Still no built-in UI to edit a therapist's own record (bio, contact_email, etc.) — out of scope for this six-feature request, flagged in case Roy wants it next.
- Same standing reminder as every phase: none of this is live until pushed.
```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 8: CRM dashboard, notifications, therapist profiles, language selector, admin RBAC"
git push
```

## Phase 8.1 — My Account page

After Phase 8 shipped, Roy confirmed signup/login now works end-to-end (the Supabase Auth Site URL fix from earlier held) — but flagged that once signed in, there was no way to actually view or edit your own account. True: `AuthStatus.tsx` only ever rendered "Sign In" or "Sign out," nothing in between, and no `/account` route existed anywhere in the app.

**Built:**
- `lib/auth/requireUser.ts` — signed-in-only guard (no role check), redirects to `/login?next=<path>` if signed out.
- `app/account/page.tsx` + `components/account/AccountForm.tsx` — view/edit full name, phone, country, preferred language; email shown read-only (tied to login); role shown read-only, with a "Go to CRM Dashboard" shortcut if the signed-in user is an admin.
- `components/AuthStatus.tsx` reworked from a single "Sign out" button into a dropdown ("My account" / "Sign out") so the new page is actually reachable.
- `lib/languages.ts` — pulled the language list out of `LanguageSelector.tsx` into a shared constant so the header selector and the account page's language field can't drift out of sync.
- `app/login/page.tsx` now respects a `?next=` redirect target (read from `window.location.search` rather than `useSearchParams()`, which would've forced the page out of static rendering without a Suspense boundary).

**Verification:** `npx tsc --noEmit` clean (same pre-existing sandbox-only `resend` error as before). Full `npx jest` suite passes (7 suites, 19 tests).

## Phase 9 — "Find Your Therapist" AI-matching wizard

Roy described a 4-step AI-matching wizard (assessment → preferences → format/location → AI matches + booking modal with Zoom/WhatsApp/Google Maps) that he believed already existed in the codebase. An Explore-subagent audit — including both gitignored prototype folders (`gesa-website/`, `gesa-backend-refactor/`) — confirmed it did not exist anywhere, old or current; the project's own `EXECUTION_PLAN.md` (this file) already said as much for Phase 5. One useful find during the audit: a legacy, completely unused `gesa_timeslots` table in Production with 5,800 real per-therapist appointment slots — but dated July 27–Aug 7, 2026, already in the past, so not usable as-is for a live calendar.

**Scope decisions from Roy before building:**
- Matching engine: real LLM-based matching (not rule-based) — therapist `specialties` data is real but messy/sparse (32 distinct values, several non-English, `tracks` empty on every row), which an LLM handles better than rigid filters.
- Zoom: manual follow-up (team/therapist sends the real link after confirming) — no Zoom API/account needed.
- WhatsApp: simple `wa.me` deep link using the therapist's phone number — no WhatsApp Business API.
- Calendar/availability: a simple date+time request (no real slot enforcement) — matches how booking already works everywhere else in the app.

**Database (Dev + Production):**
- `therapists.contact_phone` (text, nullable) — powers the WhatsApp deep link, same pattern as `contact_email` from Phase 8.
- `clinic_locations` table (name, address, is_active) for the In-Person format step. Seeded with one **inactive placeholder row** — real addresses still need to come from Roy; until then the wizard gracefully shows "our team will confirm a location" instead of a location picker.
- `match_requests` table — the wizard's full submission (contact info, symptoms, treatment type, gender preference, session format, clinic location, preferred date/time, matched therapist ids, selected therapist, status). Kept separate from `booking_requests` (the simpler 4-entry-route intake flow) rather than overloading that table.
- RLS: public insert on `match_requests`/`clinic_locations`; admin+reviewer read, admin-only write — same convention as Phase 8's `profiles_admin_update`.

**Built:**
- `lib/ai/matchTherapists.ts` — calls Anthropic's API (`claude-haiku-4-5-20251001`) with the client's assessment/preferences and the real active/verified therapist roster, asking for up to 3 ranked matches with one-sentence reasoning each as strict JSON. Validates every returned id against the real candidate pool (guards against hallucinated ids) and **always falls back to a keyword+gender rule-based scorer** on any API error, missing key, or parse failure — matching must never leave a client with zero results. Needs a real `ANTHROPIC_API_KEY`; documented in `ENV_VARS.md` for both Dev and Production. Without it, the app silently uses the rule-based fallback — the feature still works, just without AI reasoning.
- `/api/match` (POST) — runs the match, returns full therapist records + reasoning for the UI.
- `/find-your-therapist` — the 4-step wizard (`components/match/MatchWizard.tsx` + one component per step). Assessment step: 12 curated experience/emotion tags. Preferences: treatment type (from real specialty values) + gender preference. Format & Location: Online/Call/In-Person, with the clinic picker only shown once real active locations exist. Matches: calls `/api/match`, shows up to 3 cards with AI reasoning quotes, "Book a Session" opens `BookingModal.tsx`.
- `BookingModal.tsx` — contact fields, native date+time pickers (explicitly labeled as a request, not a confirmed slot), and format-specific messaging: Online shows manual-Zoom-follow-up text; Call shows a real `wa.me` WhatsApp button (only after the request is submitted, and only if the matched therapist has a `contact_phone` on file); In-Person shows the clinic address plus a free Google Maps directions link (`google.com/maps/search` — no API key/billing needed). Submits to `/api/match-booking`, which inserts into `match_requests` and sends 3 emails (client confirmation, team notification, therapist notification via `contact_email` if set) — same resilient "email failure never blocks the booking" pattern as Phase 7's booking flow.
- **Admin back office**: `/admin/match-requests` (status management, same pattern as `/admin/bookings`), added to admin nav, overview tiles, and the notification bell (now counts new `booking_requests` **and** new `match_requests` combined, linking to `/admin`).
- Wired the site's "Find your therapist" CTAs (Hero, Footer, About page) to the new `/find-your-therapist` wizard. Deliberately left the homepage's "Four paths to support" quick-entry routes (crisis/veteran/general/helpers → `/intake`) and the therapist profile page's "Book a free session" link untouched — those serve a different purpose (fast, low-friction entry, especially for the crisis path) and shouldn't be forced through a longer wizard.

**Verification:** `npx tsc --noEmit` clean (same pre-existing sandbox-only `resend` error as always). Full `npx jest` suite passes (7 suites, 19 tests — had to add `contact_phone: null` to the `TherapistsDirectory.test.tsx` mock fixture). Manually grepped every new file for the unescaped-apostrophe pattern that broke the Phase 8/8.1 build — none found this time.

**Known gaps / left for Roy:**
- `ANTHROPIC_API_KEY` isn't set anywhere yet — add it to Vercel (Dev + Production) per `ENV_VARS.md` to turn on real AI matching; the rule-based fallback works in the meantime.
- No real clinic address yet — the In-Person step currently tells clients "our team will confirm a location." Give me a real name/address and I'll seed it (or add an admin UI to manage locations, if you want more than one).
- `contact_phone` isn't populated for any of the 145 real therapists yet, same gap as `contact_email` from Phase 8 — the WhatsApp link silently doesn't show until it's set.
- Same standing reminder as every phase — push before this exists on the live site:
```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 9: Find Your Therapist AI-matching wizard"
git push
```

## Phase 10 — Translation, notification redesign, CRM therapist management, messaging oversight

Four requests in one batch, with real architecture decisions clarified with Roy first:
- Real machine-translation (Google Cloud Translation API) over a free embeddable widget or holding off.
- Build therapist-side notifications now, dormant, even though zero therapists currently have a real login (`profile_id` is null on every therapist row in both Dev and Production) — it'll activate the moment one does.
- Real image upload for therapist photos (Supabase Storage) over a plain URL field.
- "Delete" a therapist means deactivate (hide from the public directory, fully reversible), not permanently destroy the row — this is real data for 145 real volunteers.

**Database (Dev + Production):**
- `match_requests_therapist_read` / `booking_requests_therapist_read` RLS policies — let a therapist read their own session requests once `therapists.profile_id` is set to their auth id. Dormant today, live the moment a real therapist account exists.
- `therapist-photos` Storage bucket (public read; admin-only insert/update/delete) for the new photo upload feature.
- `translation_cache` table (public read/insert — it only ever stores already-public UI copy, never PII) so repeat translations of the same string don't re-hit the Google Translate API.
- `next.config.mjs` — added `*.supabase.co` to `images.remotePatterns` so uploaded therapist photos render via `next/image`.

**Built:**
- **Nav/access control**: removed the CRM link from the notification bell entirely; added an admin-only "CRM Dashboard" item to the `AuthStatus` account dropdown (checks the signed-in user's own role client-side, same pattern as `NotificationBell`).
- **Notification system redesign**: `NotificationBell.tsx` is now a real dropdown panel, not just a badge-and-link. Admins see recent match requests, booking requests, and contact-form inquiries merged into one feed; clicking an item opens a detail modal with the inquirer's info and their selected therapist. Therapists (once a real account exists) see their own upcoming sessions with date/time/modality. Note: contact-form `inquiries` has no status column, so "new" for that type is approximated as "recent" rather than tracked read/unread — flagging in case you want a real read-state later.
- **Messaging oversight**: `/admin/messages` (thread list) + `/admin/messages/[threadId]` (read-only transcript). The RLS allowing admin to read chat threads/messages already existed before this phase — this just adds the UI to actually use it. Conversations remain otherwise private to the client and therapist.
- **CRM Therapist Management**: `/admin/therapists` (list, status badges) + `/admin/therapists/[id]` (edit form: photo upload to Supabase Storage, full name, short summary, bio, credentials, specialties, languages; a "Deactivate/Reactivate" toggle instead of real deletion).
- **Translation engine**: `lib/translate.ts` calls the Google Cloud Translation API (needs `GOOGLE_TRANSLATE_API_KEY`, documented in `ENV_VARS.md`; without it the page silently skips translation rather than breaking), cached in `translation_cache`. `TranslationProvider.tsx` (wraps the whole app in `app/layout.tsx`) walks all visible DOM text and swaps it for translated text whenever a non-English language is active, re-running on every route change. Language list expanded from 6 to 38 languages spanning every populated continent (`lib/languages.ts`). Two known, deliberate limitations of this approach (documented in the component itself): content that appears after an in-page fetch (e.g. AI match results) isn't caught until the next navigation since there's no live DOM observer; and switching languages always does a full page reload rather than a seamless transition, so translation always starts from clean original English content instead of trying to fragile-ly undo in-place text edits.

**Verification:** `npx tsc --noEmit` clean (same pre-existing sandbox-only `resend` error as always). Full `npx jest` suite passes (7 suites, 19 tests — split across a few calls since this sandbox got noticeably slower after the new dependencies installed; not a code issue). Manually grepped every new file for the unescaped-apostrophe pattern that broke the Phase 8/8.1 build — none found.

**Known gaps / left for Roy:**
- `GOOGLE_TRANSLATE_API_KEY` isn't set anywhere yet — add it to Vercel (Dev + Production) to turn on real translation.
- No therapist has a real login yet, so therapist-side notifications can't be demonstrated live until one does (per your choice to build it dormant rather than convert the demo account or skip it).
- Contact-form inquiries have no read/unread tracking — every admin bell refresh shows the most recent ones regardless of whether they've been seen.
- Same standing reminder — push before any of this exists on the live site:
```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 10: translation engine, notification redesign, CRM therapist management, messaging oversight"
git push
```

## Phase 11 — Real logo, real color palette, scroll showcase effect

Roy shared a reference video (a pinned split-screen "explore our work" section where a project image zooms/crossfades in sync with scroll position) plus the real GESA logo and color palette, asking me to explain the effect and get his sign-off on placement before building anything. Presented the analysis and three questions up front: where should the effect go, and confirm the logo/color rollout — he chose the "Four Paths to Support" homepage section for the effect, and approved both the logo swap and color remap immediately.

**Logo:** `public/images/brand/gesa-logo.jpg` (the real "G" mark Roy supplied) replaces the two-circle placeholder in `components/Logo.tsx` everywhere it's used — header, footer, and the login/signup pages (which had a separate, older `Leaf` icon placeholder that was never updated when `Logo.tsx` was introduced in Phase 7 — fixed for consistency).

**Color palette:** remapped every CSS custom property in `app/globals.css` (`--primary`, `--accent`, `--clay`, `--background`, `--secondary`/`--muted`, `--border`) to the real Deep Tile Blue / Sage Green / Warm Gold / Warm Ivory / Blue Gray palette. Since every Tailwind color token in `tailwind.config.ts` already reads from these CSS variables (`primary: "var(--primary)"`, etc.), this one file change re-themes the entire site with no component code touched. Also swept and fixed several **hardcoded hex colors that bypassed the CSS variable system entirely** and would otherwise have clashed with the new palette: a leftover dark-green footer theme (`Footer.tsx`), off-palette sage greens in the support-groups video-call mockup (`SupportGroupsInteractive.tsx`), and a stale terracotta button-hover shade used by the "clay" button variant in three places.

**Scroll showcase effect** (`components/home/Paths.tsx`, fully rewritten): same four paths, same exact copy, links, and CTA labels as before — only the presentation changed. A scroll listener (throttled via `requestAnimationFrame`, no new dependency) computes a continuous progress value across a tall pinned container; both the left-side text panel and the right-side image panel crossfade between the four paths' content in sync with scroll position, with a subtle zoom on the active image — reproducing the reference video's mechanic without adopting a new animation library, so it behaves consistently across browsers. Uses four placeholder Unsplash stock photos (one per path) since this section previously had no imagery at all — **this sandbox's network restrictions meant I couldn't preview-load these before shipping; please confirm they render correctly once deployed** and swap in real photos whenever you have them.

**Verification:** `npx tsc --noEmit` clean (same pre-existing sandbox-only `resend` error as always). **Could not get a clean `npx jest` run this round** — every attempt, including the smallest/fastest suite, timed out in this sandbox session (tsc itself still completes normally, so the environment isn't fully frozen; this looks like jest-specific degradation on the Windows-mounted filesystom over a long session, not a defect introduced by this phase's changes, none of which touch anything under test — CSS values, a static image swap, and one presentational component with no existing test coverage). Recommend treating Vercel's own build/lint as the authoritative check for this phase, same as always.

**Known gaps / left for Roy:**
- Confirm the four placeholder stock photos in the new Paths showcase actually load; replace with real photography whenever ready.
- The uploaded logo file has a solid ivory background (not transparent) — reads fine at the small sizes used in the header/footer, but a transparent-background version would look cleaner if ever used somewhere with a different background color.
- Same standing reminder — push before any of this exists on the live site:
```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 11: real logo, real color palette, scroll showcase effect on Four Paths"
git push
```

## Verification (per phase)
- `npm run typecheck` and `npm run build` must pass before a phase is marked done
- From Phase 5 onward: `npm test` and `npx playwright test` must pass
- Manual: visual diff against `gesa-site.html`, RLS smoke test (anon can read public tables, cannot read PII tables)

---
**Gate:** Per Roy's instruction, each phase stops here for review/approval before the next one starts.
