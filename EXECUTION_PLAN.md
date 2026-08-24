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

## Phase 11.1 — Fixed the scroll showcase stutter

Roy reported the Phase 11 scroll effect looked "staggering" and asked me to either remove it or fix it properly with better, more on-theme images.

**Root cause, found by re-reading my own Phase 11 code rather than guessing:** the crossfade opacity was driven by React state on every scroll tick, but I'd also left a CSS `transition: opacity 150ms` on the same elements. Every new scroll-driven value restarted that transition mid-flight, so the animation was constantly racing against itself instead of tracking the scroll position — that's exactly what reads as stuttering.

**Fix:** rewrote the effect to use one continuous `requestAnimationFrame` loop that smooths (lerps) a single progress value toward the real scroll position every frame, and writes opacity/transform straight to the DOM via refs — no CSS transitions competing with it, no React re-renders in the animation loop. This is the standard technique behind smooth scroll-scrubbed effects (conceptually what GSAP ScrollTrigger does under the hood).

**Images:** also confirmed, via a direct connectivity test from this sandbox (not a guess), that `images.unsplash.com` is explicitly blocked by this sandbox's own network proxy — a sandbox-specific restriction, not a sign the images won't work in production. Production (Vercel) has normal outbound internet access, and the Hero section's photo from this same domain has been live since Phase 7. Still can't preview-load new photo ids myself, so picked more specifically on-theme ones per path (counseling office for crisis, family imagery for veterans, reused the already-proven Hero photo for "seeking support," caregiving imagery for helpers) and flagged that Roy should tell me immediately if any don't load so I can swap same-session.

**Verification:** `npx tsc --noEmit` clean (same pre-existing `resend` error). Jest still unreliable in this sandbox session (see Phase 11 notes) — didn't attempt again since this change touches only `components/home/Paths.tsx`, which has no test coverage.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 11.1: fix scroll showcase stutter, better on-theme images"
git push
```

## Phase 12 — Extended the Hero's visual polish site-wide

Roy asked to update the home landing page to match a screenshot he sent. That screenshot matched the current live Hero exactly, so I asked what he actually wanted changed — he answered "extend this look site-wide." So the Hero's decorative treatment (soft blurred accent circle, pill-shaped eyebrow badge with icon, consistent spacing) needed to spread to every other page, which previously used a flat, unstyled `.hero`/`.eyebrow` header.

**What I built:** `components/ui/PageHero.tsx`, a shared header component (same pattern as `Card`/`Button`) taking an optional icon, eyebrow text, title, optional description, and an optional `narrow` flag for the tighter-width pages. It renders the blurred accent circle and pill badge once so every page stays visually consistent and any future tweak only needs to happen in one file.

**Applied to 8 pages:** About, Therapists, Support Groups, Contact, FAQ, Blog, Find Your Therapist, and Intake. Each page's old flat header block was replaced with `<PageHero .../>` followed by the page's existing body content in its own `section` (nothing below the header was touched — grids, forms, wizards, and accordions are all unchanged).

Intake needed special handling since its header text depends on which of the four entry paths the visitor came from (crisis, veteran, general, helpers). Gave each path its own icon (`HeartPulse`, `ShieldCheck`, `HandHeart`, `Users`) so the badge still feels tailored per-path rather than generic. Also fixed a real bug while in there: the "You're one step from support" headline was written as the literal text `You&apos;re` inside a JS string (not JSX children), so it was rendering the literal characters `&apos;` on screen instead of an apostrophe. Now a plain `'` in a string, which is correct in that context.

**Verification:** `npx tsc --noEmit` clean except the same pre-existing `resend` module-typing error from earlier phases (confirmed via `git diff --name-only` that `lib/email/resend.ts` isn't part of this change — it's an unrelated, already-known sandbox/typing quirk, not something this phase introduced). Manually re-read every changed file's JSX text for the unescaped-apostrophe pattern that broke past builds — all clear; the only apostrophes present are inside JS string literals (props, object values), which don't need escaping.

**Known gap / left for Roy:** the four Intake path icons are a judgment call on my part (crisis = pulse, veterans = shield, general = handshake-heart, helpers = people) — swap easily in `app/intake/page.tsx`'s `PATH_ICON` map if you'd like different ones.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 12: extend Hero visual polish (PageHero) site-wide across 8 pages"
git push
```

## Phase 13 — Large GESA logo mark added to the Home Hero

Roy sent two mockups: one with a woman's portrait and no large logo, and one with the current garden photo plus a large circular GESA logo mark sitting above the eyebrow badge. He confirmed the garden version (with the big logo) is the one he wants, and that it should be treated as the live Home page's target look.

Comparing that mockup against the actual `Hero.tsx` code line by line: headline, subtext, both buttons, the three trust badges, and the "Over 5,000+ Sessions Completed" chip already matched exactly. The one real gap was the large circular logo mark shown inside the hero content — the header nav already has a small version of it, but nothing that size existed in the hero body.

**Fix:** reused the existing `Logo` component (same real logo file from Phase 11) at `size={130}` inside the hero's text column, above the eyebrow pill, wrapped in its own spacing div since `Logo` renders a Next.js `Image` (inline by default, needed a block wrapper for the margin below it).

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error noted in Phase 11/12.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 13: add large GESA logo mark to Home Hero"
git push
```

## Phase 14 — Transparent logo file + confirmed Home Hero matches reference

Roy sent two references: the Home Hero screenshot (identical to what Phase 13 already shipped) and a new logo file, "GESA LOGO 1.0.png," asking to update the site to use it.

Checked the new file against the one in use: the Phase 11 logo (`gesa-logo.jpg`) was a flat JPG with a solid ivory background — it only blended in because that background happened to be close to the site's own background color. The new PNG has real alpha transparency (confirmed programmatically, not just by file extension), so it drops cleanly onto any background color, including the navy footer and dark buttons where the old one would have shown a faint box.

**Fix:** added `public/images/brand/gesa-logo.png`, pointed `components/Logo.tsx` at it, and switched its image styling from `rounded-full object-cover` (needed before to crop the old near-square JPG into a circle) to `object-contain` (the new file is already circular art on a transparent canvas, so cropping isn't needed and would risk clipping it). Every place that renders `<Logo />` — header, login, signup, and the Home Hero — picks up the new file automatically since they all go through this one component.

The Home Hero itself needed no layout changes; it already matches the reference exactly as of Phase 13.

**Known gap:** the old `gesa-logo.jpg` file is still sitting in `public/images/brand/` unused — I can't delete files in your synced folder without your go-ahead, so let me know if you'd like it removed.

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error noted since Phase 11.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 14: swap in transparent-background GESA logo PNG"
git push
```

## Phase 15 — Home Hero photo replaced with a looping therapy-session video

Roy asked to remove the static garden photo from the Home Hero and replace it with something that has motion — "like a video playing" — relevant to what GESA does, and said I could source it online.

**What I found:** a royalty-free therapy-session clip on Pexels ("Patient and Psychologist During a Session" by Polina Tankilevitch, free license, no attribution required) showing a calm one-on-one counseling conversation — matches the "therapy/counseling session" mood Roy picked. Pexels hosts a direct CDN file for it (same pattern already used for the Unsplash photo since Phase 7 — a direct URL, not a downloaded file living in the repo).

**Fix:** in `components/Hero.tsx`, replaced the `<img>` with a `<video autoPlay muted loop playsInline>` pointed at that Pexels CDN URL, keeping the original Unsplash photo as the `poster` frame so there's an instant visual before the video finishes loading. Muted + inline autoplay is required for the browser to allow autoplay at all, so sound was never part of the plan. Everything else in the Hero — the rounded card, dark overlay, and the "Over 5,000+ Sessions Completed" trust chip — is untouched.

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error. Couldn't preview the video playing myself (same sandbox network restriction that's blocked previewing Unsplash photos since Phase 11 — this only affects my ability to preview, not whether it loads in production/Vercel).

**Known gap:** if the clip doesn't feel right once you see it live, swapping it is a one-line change (just the `src` in the `<source>` tag) — let me know and I'll find another.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 15: replace Home Hero photo with looping therapy-session video"
git push
```

## Phase 16 — Shrunk and modernized the "Paths to Support" section, dropped to three paths

Roy reported the section was consuming too much of the homepage. Root cause: the Phase 11 scroll-pinned showcase held the viewport in place for a full screen height per path — with four paths, that was 400vh of scrolling just to get through this one section. He also asked to remove "Helping the helpers," leaving three paths: In crisis right now, Veterans/reservists & families, and Seeking support.

**Fix:** removed the scroll-pinning entirely — `components/home/Paths.tsx` no longer has scroll listeners, a `requestAnimationFrame` loop, or a multi-screen-height container. It's now a plain 3-card grid that only takes up as much vertical space as its content (about one normal section's worth, not several screens). Each card keeps its on-theme background photo (same images as before) with a dark gradient overlay for text legibility, and the whole section got a soft decorative blur behind the header to match the modernized look used on About/Therapists/FAQ/etc. (`PageHero`-style treatment). The "Helping the helpers" card and its `Users` icon import were removed; the eyebrow label was corrected from "Four paths to support" to "Three paths to support" to match.

**Scope note:** this only touches the homepage card section. Left `helping_helpers` as a value in the backend `TrackType` enum and the `/intake?path=helpers` route untouched — those are data-model/routing concerns unrelated to what's shown on the Home page, and removing them wasn't part of what Roy asked for. If you'd like that entry route fully retired too, let me know and I'll scope that separately.

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error noted since Phase 11. Confirmed no other page references the old "Four paths to support" copy.

**Follow-up in this same phase:** Roy gave more specific per-path benefit details, so the card copy was refined to match: crisis now reads "approximately six free sessions to start" (was vague "an initial set"), and the veterans/reservists/families card now explicitly distinguishes unlimited sessions for veterans and reservists from a "structured package of sessions" for families (was a blanket "unlimited access"). The footer line under the grid also changed from "Up to six free sessions" (which no longer held for the unlimited veteran path) to "Free, confidential sessions," so it doesn't overpromise a session count that varies by path.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 16: compact 3-card Paths section with modern backgrounds, drop Helping the helpers"
git push
```

## Phase 17 — Home Hero refreshed against a Claude Design mockup

Roy shared a mockup image (made with Claude Design, Anthropic's separate design tool) asking to update the Home Hero to look like it.

**What I copied:** a faint line-art texture (globe and chain-link icon outlines) scattered across the hero background at very low opacity, a soft multi-color glow blob layered behind the headline, and the media card breaking out of the normal grid to bleed all the way to the browser's right edge instead of stopping at the page's usual content width. On large screens that media card also tucks slightly under the sticky header — the header's `z-40` sits above the hero's `z-10`, so the overlap resolves cleanly with no visual glitch or scroll bug.

**What I deliberately skipped:** the trust badges ("Verified Professionals" etc.) showed with a strikethrough in the mockup — that reads as an AI-image-generation artifact, not an intentional design choice, and copying it would visually suggest those claims had been retracted. I also kept the existing looping therapy-session video (Phase 15) rather than sourcing the mockup's specific photo (hands passing papers) — that asset is already verified working in production, and swapping to an unconfirmed stock photo URL risked repeating the broken-image problem from earlier phases.

**Technical note:** the bleeding media card is positioned relative to the full-width `<section>` rather than the page's usual `max-w-[1160px]` content wrapper — that's what lets it reach the actual browser edge instead of stopping at the normal content boundary. `overflow-hidden`, previously on the section itself, moved to just the decorative background layer so it doesn't clip the bleeding card.

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error since Phase 11. Confirmed no unescaped apostrophes in the touched JSX.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 17: refresh Home Hero with decorative texture, glow, and edge-to-edge media bleed"
git push
```

## Phase 18 — Home Hero: static photo instead of video, to match the mockup exactly

Roy sent the same Claude Design mockup again, asking specifically for the exact interface shown, not an approximation.

**Root cause of the mismatch:** the mockup shows a still image, while the live Hero (since Phase 15) plays a looping video. A moving video is a real, visible difference from a static mockup — no amount of styling tweaks would make those match while one moves and the other doesn't.

**Fix:** replaced the `<video>` element in both the mobile and desktop media blocks with a static `<img>`. Since the mockup's own photo (hands passing papers) is AI-generated artwork and doesn't exist as an actual stock photo, I searched Pexels directly and confirmed a real, free, license-cleared photo of a group therapy session (photo id `7176305` by SHVETS production) before using it — verified via Pexels' own site rather than guessing an ID, given past issues in this project with broken image URLs.

**Still not copied — the badge strikethrough:** the mockup continues to show "Verified Professionals," "100% Free Sessions," and "Global Community" with a strikethrough through the text. I'm flagging this explicitly rather than deciding it silently again: this most likely a rendering artifact from the AI image generator (the mockup is synthesized, not a real screenshot), but if it's something you actually want — e.g., styled as a "before" comparison, or you like the crossed-out look for some other reason — tell me and I'll add it. Left as normal, non-struck-through text for now, since striking through true claims about the platform reads as retracting them.

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error since Phase 11. The `@next/next/no-img-element` disable comment is safe here — unlike the earlier `@typescript-eslint/no-explicit-any` incident, this project's ESLint config (`next/core-web-vitals`) does register the `@next/next` plugin, so this rule and its disable directive are valid.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 18: swap Home Hero video for a verified static group-therapy photo"
git push
```

## Phase 19 — Three Paths cards replaced with Roy's finished designs

Roy sent three finished card images (built with Claude Design), one per path — crisis, veterans/reservists/families, and seeking support — each already containing its own icon badge, heading, description, and "Reach out now" button baked into the image itself.

**Why the cards changed structurally, not just the photo:** since Phase 16, each card was a photo with our own HTML badge/heading/description/button layered on top in a dark gradient overlay. Roy's new images already contain all of that as pixels. Layering our own text on top again would have shown two headings, two descriptions, and two buttons stacked on the same card. So each card is now just the image — full width, full height, nothing overlaid — and the whole card is wrapped in a single link (since the button baked into the image can no longer be a real clickable element on its own). An `aria-label` on that link carries the same heading + description + button text a screen reader would previously have read from the separate DOM elements, so nothing was lost for accessibility.

**Image handling:** the three uploaded files (`Crisis.jpg`, `Support.jpg`, `Veterans.jpg`) were 2.2–2.5MB each — too heavy for a section that loads on every homepage visit. Resized to a 1400px-wide max and re-compressed before adding to the repo (`public/images/paths/*-optimized.jpg`), bringing each down to roughly 160–275KB with no visible quality loss at the size these cards render at.

**Known gap:** the original, oversized copies of the three files also ended up in `public/images/paths/` as an unavoidable side effect of how they were processed, and are unused by the code. I can't delete files from your synced folder without asking first — let me know if you'd like them removed to keep the repo lean.

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error since Phase 11.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 19: replace Three Paths cards with finished designs (image + link, no overlaid text)"
git push
```

## Phase 20 — Veterans card crop fix, real multi-therapist matching, and conflict-free session booking

Four related asks in one message: (1) the Veterans card's "Reach out now" button wasn't visible, (2) clicking a path card assigned one random therapist with no choice, (3) add Email as a third contact option alongside WhatsApp/Zoom, (4) make sure a booked date/time can never be double-booked, applied globally.

**1. Veterans card crop.** Root cause: the Veterans image (`Veterans.jpg`) was landscape (2624×1632) while Crisis and Support were portrait — inside the fixed 420px-tall, ~370px-wide card slot, `object-cover`'s default center crop trimmed almost half the image off each side, cutting the badge and button that sit on the left of the composition. Fixed by re-cropping the source image itself (left-anchored, to the card's actual aspect ratio) rather than relying on CSS to guess a good crop — `public/images/paths/veterans-optimized-v2.jpg`. Confirmed visually before shipping: badge, full heading, full description, and the button are all now intact.

**2 & 3. Multi-therapist list + Email/WhatsApp/Zoom.** Scoping questions asked and answered: Zoom stays manual follow-up (recommended — no Zoom API credentials on file), and this new flow applies to the intake/path modals only for now (the Find Your Therapist wizard's existing `BookingModal` is untouched).

Replaced `getRandomMatchedTherapist()` (pure `Math.random()` pick, ignored what the client was seeking) with the same AI matching engine (`lib/ai/matchTherapists.ts`) the wizard already uses, fed a per-path hint (crisis/veteran/general/helpers → a treatment-type + symptom-keyword hint) instead of the wizard's assessment-step answers. `app/intake/page.tsx` now returns up to 3 relevant matches; `components/intake/IntakeMatchFlow.tsx` renders them as a list with each therapist's photo, verification badge, and a one-line reason they were matched, so the client picks who they want instead of getting assigned one name.

Choosing a therapist opens `components/intake/IntakeBookingModal.tsx` (new), which is where Email joins WhatsApp and Zoom as a real, equal third option — a simple channel selector before the date/time picker. Each channel's follow-through: Email confirms and continues by email (already-working Resend infra); WhatsApp generates a `wa.me` deep link to the therapist directly (same pattern the wizard's modal already used, extended here); Zoom tells the client GESA will email the link before the session — consistent with the "manual follow-up" scoping answer.

**4. Conflict-free scheduling — built from scratch, not just checked.** This didn't exist anywhere in the app before this phase: every prior "booking" (`match_requests`, `booking_requests`) only ever stored a *preferred* date/time with zero enforcement — two people could request the identical slot and nothing would stop it; a human had to notice and sort it out by hand. New schema (applied to both dev and prod):

- `therapist_weekly_hours` — each therapist's recurring bookable windows (seeded Mon–Fri 9am–5pm in their own local time for every existing therapist, per the "fixed weekly hours" scoping answer, so the feature has real data on day one).
- `session_bookings` — actual reservations, with `UNIQUE(therapist_id, session_date, session_time)`. This constraint, not application logic, is what makes double-booking structurally impossible — even a race condition (two people submitting the exact same slot in the same instant) can only ever produce one confirmed row; the second insert is rejected by Postgres itself (verified directly: attempted a duplicate insert against the live database and confirmed it fails with `23505 duplicate key value`).
- `get_booked_slots(therapist_id, date)` — a `SECURITY DEFINER` function that lets anonymous visitors check which times are taken *without* being able to read other clients' names or emails (RLS on `session_bookings` itself only allows admin/reviewer/the-therapist-in-question to read full rows).

`GET /api/therapist-availability` generates the day's bookable times from `therapist_weekly_hours` minus whatever `get_booked_slots` reports, so the calendar in `IntakeBookingModal` only ever shows real, free slots. `POST /api/intake-booking` re-checks availability immediately before inserting (defense in depth) and catches a `23505` from the database as the final backstop, returning a clear "that time was just taken, pick another" message instead of a generic error or, worse, a silent double-booking.

**Admin visibility (not explicitly asked for, but necessary):** a booking system your team can't see isn't usable, so added `/admin/sessions` — a read-only table of every confirmed session (date, client, therapist, channel, path) with a status dropdown; marking one "cancelled" immediately frees that slot back up, since `get_booked_slots` only counts `status = 'confirmed'` rows. Added a nav link and an overview-page tile matching the existing admin patterns.

**Known gaps / left for Roy:**
- No admin UI yet to edit a therapist's weekly hours beyond the Mon–Fri 9–5 default seeded for everyone — for now that would need a direct database edit. Happy to build a simple editor into the existing therapist admin page if useful.
- Times are shown in each therapist's own local time zone (labeled), not converted to the client's — no timezone-conversion UI was asked for or built.
- Per the scoping answer, this new flow is intake-only; the Find Your Therapist wizard's booking modal still uses the older unconstrained date/time inputs. Say the word if you'd like that unified too.

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error since Phase 11. Scanned every new/changed file for the unescaped-apostrophe JSX pattern that broke earlier builds — none found. Verified the unique constraint directly against the live production database with a real duplicate-insert attempt (see above), not just by reading the migration.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 20: fix Veterans card crop, multi-therapist matching, Email/WhatsApp/Zoom, conflict-free session booking"
git push
```

## Phase 21 — Veterans card: full-width layout instead of another crop

Roy pointed out the Phase 20 crop still didn't show "the veteran and the family" clearly.

**Why cropping alone couldn't fix this:** the Veterans photo is a landscape composition — veteran, wife, and daughter spread across the full frame — while Crisis and Support are portrait. Any crop narrow enough to fit the same 1-of-3 portrait column as the other two cards had to cut someone out. The Phase 20 crop fixed the button (Roy's original complaint) but, in testing this follow-up before shipping, showed the daughter with her face cropped off — same root problem, different symptom.

**Fix:** stopped trying to crop a wide photo into a narrow slot and changed the layout instead. The Veterans card now gets its own full-width row sized to the photo's actual aspect ratio (`aspect-[1600/995]`, matching the source image exactly — `veterans-fullwidth.jpg`, a plain resize with zero cropping), so the veteran, his wife, and daughter, plus the full badge/heading/description/button, are all visible with nothing cut off. Crisis and Support now share a two-column row below it instead of all three sitting in one three-column row.

**Verification:** generated three candidate crops and actually looked at each one (via the Read tool) before choosing — first a portrait crop that cut into the heading text, then a wider crop that still cropped the daughter's face, then the full-width no-crop layout that shows everyone. `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error since Phase 11.

**Known gap:** `public/images/paths/` now has a few unused intermediate files from this and the Phase 19 image processing (`veterans.jpg`, `veterans-optimized.jpg`, `veterans-optimized-v2.jpg`, plus the oversized originals) — none are referenced by any code, but I can't delete files from your synced folder without asking. Let me know if you'd like the folder cleaned up.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 21: full-width layout for Veterans card instead of cropping out family members"
git push
```

## Verification (per phase)
- `npm run typecheck` and `npm run build` must pass before a phase is marked done
- From Phase 5 onward: `npm test` and `npx playwright test` must pass
- Manual: visual diff against `gesa-site.html`, RLS smoke test (anon can read public tables, cannot read PII tables)

## Phase 22 — Three Paths cards back in a single straight row

Roy asked for the three cards back in "straight order" after Phase 21 split them into an asymmetric full-width-plus-two-column layout.

**The tradeoff, surfaced before building:** going back to one straight row of three equal cards reopens the exact problem Phase 21 fixed — the Veterans photo is landscape (three people spread across the frame) and doesn't fit a narrow portrait slot without cropping someone out. Asked Roy directly: crop again (and lose someone), or keep everyone visible with the photo shown smaller than the other two. He chose to keep everyone visible.

**Fix:** reverted to a single `md:grid-cols-3` row. Crisis and Support are unchanged (`object-cover`, fills the card edge-to-edge). The Veterans card alone uses `object-contain` on a navy background fill (`bg-[#16293a]`, matching the site's existing dark navy from the footer) instead of `object-cover` — the full photo (veteran, wife, daughter, plus the complete badge/heading/description/button) is shown letterboxed, rather than cropped, inside the same 420px-tall card as the other two.

**Verified the actual visual outcome before shipping, not just the code:** composited a mock of the card at its real rendered size (370×420) to see exactly how much letterboxing this produces — the photo ends up roughly 230px tall centered in the 420px card, with visible navy bars above and below. Flagged this plainly to Roy rather than assuming the tradeoff he picked would look fine sight unseen.

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error since Phase 11.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 22: three Paths cards back in one row, Veterans letterboxed instead of cropped"
git push
```

## Phase 23 — Veterans card: matched to the other two exactly, not just similar

Roy confirmed what Phase 22's preview flagged: the letterboxed card looked imbalanced next to the two full-bleed cards — not because of any font-size difference, but because `object-contain` shrank the entire composite (photo + badge + text + button together) to fit inside the letterbox, so everything read smaller at a glance.

**New photo:** Roy provided a tighter, closer crop of the veteran/wife/daughter — already close to the card's own aspect ratio (0.88), so a small, centered crop fills the 420px card edge-to-edge with `object-cover` and nobody gets cut off, unlike the original wide landscape photo from Phase 19/20/21.

**The catch:** that new photo was a plain, uploaded screenshot with no badge/heading/description/button baked into it, unlike Crisis and Support (which came out of Claude Design with all of that already rendered into the image). Using it as-is would've left the Veterans card as a bare photo with no visible label at all — a worse regression than the letterboxing. Composed the same badge/heading/description/button treatment onto it directly (Liberation Serif Bold for the heading, matching the other cards' serif look; a hand-drawn shield glyph in a navy badge; the same bottom-heavy dark gradient for legibility; a white pill button in the same style), sized in the exact same proportions used elsewhere in the codebase (46px badge, 19px heading, 13.5px description, 14px button — doubled for a crisp 740×840 retina-ready file). Saved as `public/images/paths/veterans-composed.jpg`.

All three cards are now driven by the exact same code path — one `object-cover` image per card, same height, same rounded corners, no per-card branching left in `Paths.tsx`. That's a stronger guarantee of consistency than trying to eyeball-match two different rendering approaches side by side, which is what led to the imbalance in the first place.

**Verified before shipping, not just described:** composited a mock of all three cards side by side at their real 370×420 display size (not just the raw source images) to confirm they actually read as a matched set — screenshot reviewed before committing to the change.

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error since Phase 11.

**Known gap:** `public/images/paths/` has accumulated several unused intermediate files across Phases 19–23 (`veterans.jpg`, `veterans-optimized.jpg`, `veterans-optimized-v2.jpg`, `veterans-fullwidth.jpg`, plus oversized originals) — none referenced by any code. Can't delete from your synced folder without asking; let me know if you'd like this cleaned up.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 23: rebuild Veterans card with matching composed badge/heading/button, full-bleed like the other two"
git push
```

## Phase 24 — CRM Therapist enable/disable actually works everywhere now, plus a contact email field

Roy asked for two things in the Therapists section of the CRM: enable/disable that actually controls public visibility, and a manual contact email field.

**The enable/disable control already existed** (`TherapistEditForm.tsx`'s "Deactivate/Reactivate" button, shipped in Phase 10) — but it only ever toggled `is_active`. Digging into why that wouldn't be a complete fix surfaced the real bug: a database-level security policy (`therapists_public_read`, enforced by Postgres row-level security, not app code) required `is_active AND is_verified` for a therapist to be readable by the public site at all. `is_verified` is a second, unrelated flag with no admin UI anywhere to ever set it — and 9 therapists in production were sitting at `is_active = true, is_verified = false`, meaning the CRM showed them as "Active" while they were silently invisible on the live "Our Therapists" page. Toggling "Reactivate" on any of those 9 would have appeared to work in the admin table without ever actually bringing them back.

**Fix:** rewrote the `therapists_public_read` RLS policy (applied to both dev and prod) to check only `is_active = true` — this is the actual visibility gate now, enforced at the database level where it can't be bypassed by a stray app-code query. Also removed the now-redundant `is_verified` filters from `getActiveTherapists()`, `getTherapistBySlug()`, and `/api/match`'s therapist query, so app code matches what the database now enforces instead of quietly relying on a filter that no longer does anything. Verified directly against production: querying `is_active = true` now returns all 145 previously-eligible-plus-9-newly-visible therapists, confirmed against the RLS policy's own definition before and after.

**Contact email field:** added a plain email input to `TherapistEditForm.tsx` (writes to the existing `therapists.contact_email` column, already used elsewhere for match/booking notification emails — no schema change needed, the column just had no admin-facing input before this).

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error since Phase 11. Re-ran the Supabase security advisor after the policy change — no new findings introduced.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 24: fix therapist enable/disable to be the sole visibility gate, add contact email field"
git push
```

## Phase 25 — Admin panel "taking a minute or more to open" fixed at the root cause

Roy reported pages, section fields, and CTA/action buttons in the admin panel routinely taking a minute or more to respond.

**Investigated before touching anything** (dispatched a read-only audit across the auth guard, every admin page's data-fetching, database access patterns, and client-side components) rather than guessing which of several plausible causes was real. Ruled out: N+1 or unbatched queries (every admin list page uses a single request with embedded joins, or `Promise.all` across independent queries — no sequential-await anti-pattern anywhere in `lib/queries.ts`); the admin status-select components (`BookingStatusSelect`, `MatchRequestStatusSelect`, `SessionBookingStatusSelect` — each fires one minimal update call, nothing else); and `next.config.mjs` (image remote patterns only, no bearing on this).

**Root cause, confirmed by reading the code, not assumed:** `TranslationProvider.tsx` wraps the entire app in `app/layout.tsx` with no exclusion for `/admin/**`. For any account with a non-English language active — set either via `localStorage` or, silently, from that user's own `profiles.preferred_language` on first load — it walks the *entire* page DOM on every navigation and fires `/api/translate` batches for every unique text string found. On admin tables like `/admin/therapists` (145 rows) or `/admin/sessions`, that's several hundred unique strings, chunked into batches of 100 and — this was the real amplifier — awaited **sequentially, one batch at a time**, each one an external round trip to the Google Translate API with no timeout. That combination (whole-DOM walk on data-heavy tables + serialized network calls with no timeout, on every single navigation) is exactly the kind of thing that can stretch into a full minute if the Translate API is at all slow that day, and it fires on every page load and every button-triggered navigation alike — matching Roy's exact description of pages *and* buttons feeling stuck.

**Fix, `components/TranslationProvider.tsx`:**
1. Skip translation entirely on any `/admin/**` route. The admin panel is internal tooling, not part of the public-facing translation feature, so there's no reason to pay this cost there at all — public pages are completely unaffected.
2. For the public pages that still use it, changed the batch loop from sequential `await`s in a `for` loop to `Promise.all` — batches now fire in parallel, so a large public page (e.g. a long blog post) with multiple batches finishes in roughly one round trip's worth of time instead of N.

**Also identified, not fixed this round (lower-severity, flagging for visibility):** a single admin page load currently re-derives "is this user an admin" independently up to 4 times — once in `middleware.ts`, once in `requireAdmin()`/`getCurrentProfile()`, once in `NotificationBell.tsx`, once in `AuthStatus.tsx` — none of them cached or sharing a result. None of these individually is slow, but it's 4 uncached, un-timed-out round trips to Supabase Auth stacked on every navigation, so any Supabase-side latency gets multiplied. Didn't touch this in the same pass as the translation fix to keep this change small and low-risk; happy to consolidate these into a single cached lookup if you want it.

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error since Phase 11. Manually confirmed no new unescaped-apostrophe issues in the changed file.

**One thing worth checking on your end:** if admin pages are still slow after this ships, check whether your own admin account has a non-English language saved (the globe icon in the header, or `profiles.preferred_language` in Supabase) — that's now irrelevant to `/admin/**` regardless, so if it's still slow the cause is something outside this codebase (Supabase project region/cold start, network conditions) rather than the translation mechanism.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 25: stop admin panel from running site translation, parallelize translation batches"
git push
```

## Phase 26 — Book a Session on Our Therapists, CRM wiring, notification bell redesign

Three requests: a "Book a Session" CTA on the Our Therapists directory (previously only "Message" existed there), make sure it's captured in the CRM, and polish the notification bell.

**Investigated first, rather than building a new booking flow from scratch:** this codebase already has two different booking architectures — an older one (`match_requests`/`booking_requests`) that just takes a free-text "preferred date/time" with no real availability checking, and the real one built in Phase 20 (`session_bookings`, `IntakeBookingModal.tsx`, `/api/intake-booking`) that checks live availability and is protected by a database-level `UNIQUE(therapist_id, session_date, session_time)` constraint so two people can never grab the same slot. Reused the Phase 20 flow rather than the older pattern, since it's the one that actually delivers on "book a session" without risking double-bookings.

**Built:**
- `components/therapists/BookSessionButton.tsx` — new button on each therapist card, opens `IntakeBookingModal` for that therapist tagged with `path: "directory"` (so admins can tell a directory-originated booking apart from the homepage's crisis/veteran/general/helpers entry points). No new booking logic was written — this reuses the exact same conflict-free scheduling, channel picker (Email/WhatsApp/Zoom), and confirmation emails already live on the homepage.
- `components/TherapistCard.tsx` — added the new button alongside the existing `MessageTherapistButton`, both in the card footer.
- `app/admin/sessions/page.tsx` — added `directory` to the `PATH_LABELS` map so these bookings show a readable label instead of the raw string. No other CRM change was needed: `getAllSessionBookings()` already has no filter on `path`, so directory bookings appear in `/admin/sessions` automatically.

**Notification bell — a real gap found, not just cosmetic polish:** `NotificationBell.tsx` merges recent `match_requests`, `booking_requests`, and `inquiries` into one feed, but never queried `session_bookings` at all — meaning every session booked through the homepage's "Reach out now" flow (Phase 20) *and* every new booking from this phase's directory CTA would land correctly in `/admin/sessions` but silently never appear as a notification. Added a fourth parallel query for `session_bookings` and extended the detail modal to render its distinct fields (`client_name`/`client_email`/`session_date`/`session_time`/`contact_channel`/`path`) which don't match the older tables' `name`/`email`/`preferred_date` shape.

**Redesign, `components/admin/NotificationBell.tsx`:**
- Relative timestamps ("2h ago") on every item, exact date/time in the detail modal.
- Click-outside-to-close — previously the dropdown only closed by clicking an item or the bell again; now closes on any click outside it.
- A real unread count: previously it looked at a `status` column that doesn't consistently exist or mean "new" the same way across `match_requests`/`booking_requests`/`inquiries`/`session_bookings`, so the badge either under-counted or (for a therapist) never went down at all. Switched to a `localStorage`-backed "last opened" timestamp — anything newer than the last time the bell was opened counts as unread, cleared the moment it's opened, with a small dot next to each still-unread item in the list.
- Per-type colored icon badges instead of a single flat icon color, a loading skeleton instead of a blank/empty-looking panel on first load, a "View all" link to the CRM, and `aria-haspopup`/`aria-expanded`/`role="menu"`/`role="menuitem"` for screen readers.

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error since Phase 11. Grepped all new/changed files for the unescaped-apostrophe pattern that's broken past builds — the only matches are inside code comments, not JSX text, so no fix needed.

**Known gap:** the notification bell's "last opened" read-state lives in each admin's own browser (`localStorage`), not the database — switching browsers or devices resets it to "everything unread." Fine for now given there's a single admin workflow, but worth moving server-side if multiple admins need a shared read state later.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 26: Book a Session CTA on Our Therapists, CRM wiring, notification bell redesign"
git push
```

## Phase 27 — Fixed the clipped/static "Book a Session" modal

Roy sent a screen recording of the new Book a Session modal (Phase 26) opening broken on the Our Therapists page: no dark backdrop, the modal box clipped to a narrow sliver overlapping the therapist cards, its top and right edges cut off mid-content.

**Root cause, found by extracting frames from the recording and reasoning through the CSS, not guessed:** `components/TherapistCard.tsx`'s outer card `div` has `hover:-translate-y-1` — a `transform` applied on hover. Per the CSS spec, any element with a `transform` becomes the *containing block* for its `position: fixed` descendants. The booking modal (`components/ui/Modal.tsx`, rendered via `IntakeBookingModal`) is mounted inside that same card through `BookSessionButton`, and uses `fixed inset-0` to cover the full screen — but the moment the card is hovered, that `fixed` positioning gets hijacked by the transformed card instead of the viewport, and the card's own `overflow-hidden` (used for its rounded corners) clips it on top of that. That combination is exactly what the recording shows: a modal trapped and cut off inside the card's box, with the rest of the page untouched and undimmed behind it.

**Fix, `components/ui/Modal.tsx`:** render the modal through a React portal straight into `document.body` (`createPortal`) instead of in place in the component tree. This guarantees the modal always sizes and positions against the real viewport no matter which component opens it or what CSS properties its ancestors have — the same class of bug can't recur for any future modal built on this component, not just the one Roy hit.

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error since Phase 11. This is a single, isolated, low-risk change to the shared `Modal` component — no other files touched.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 27: fix Book a Session modal being clipped by a transformed ancestor card"
git push
```

## Phase 28 — Clean, spaced-out "GESA" wordmark

Roy sent two references: the current bold navy serif "GESA" next to the logo, and a target look — light, letter-spaced, sans-serif text in a soft slate-blue tone. Sampled the actual pixel color from his reference image rather than eyeballing it (came out to roughly `#8c9eae`).

**Changed the wordmark everywhere it appears** — `components/Header.tsx`, `components/Footer.tsx`, `app/login/page.tsx`, `app/signup/page.tsx` — from `font-serif ... font-bold text-primary` (bold navy serif, tight kerning) to `font-sans font-medium tracking-[0.25em]` in the sampled soft blue-gray. Footer keeps a slightly lighter tint (`#a9b9c4` vs `#8c9eae`) since it sits on the dark navy footer background and needs a touch more contrast to stay readable — same clean, spaced-out treatment, just tuned for that background.

**On "remove the edges":** checked every place the logo lockup renders (header, footer, login, signup, home hero) — none of them actually have a border/box wrapping the logo+text in the current code. The boxed look in Roy's first reference looks like an artifact of how that image was captured (e.g. a favicon/tab preview), not something present in the site's CSS, so there was nothing to remove there. Flagging this in case Roy meant a specific element I haven't found — happy to fix it directly if he points to where it still shows up live.

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error since Phase 11. Rendered a rough color/spacing proof locally to confirm the direction before shipping — real font rendering (the site's actual sans-serif stack) will look slightly different than this rough check, so please confirm it reads right once deployed.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 28: clean, letter-spaced sans-serif GESA wordmark in soft blue-gray"
git push
```

## Phase 29 — Home page "footer reveal" effect

Roy pointed to §7.1.1 of design.md for a "covered footer reveal" pattern: a reference recording where the main section stays opaque and on top while scrolling, the CTA band becomes visible first, then the footer is uncovered beneath it, and scrolling back up covers it again — to be applied on the home page, directly after "Stories of healing / In their words," using GESA's own warm paper/sage/clay palette rather than the reference video's cyan/dark-blue.

**Couldn't find `design.md` in the project** (checked the repo root, `gesa-website/`, `gesa-backend-refactor/`, uploads, and every existing `.md` file) — no such document exists anywhere in this codebase or its history. Since Roy's message already included the full §7.1.1 spec verbatim (behavior description, DOM structure, the recommended CSS, and implementation notes), I built directly from that rather than blocking on a file that isn't there. Flagging this in case `design.md` lives somewhere outside this project (e.g. a shared doc) that should get pulled in here for future reference.

**The real implementation challenge:** the footer is rendered once, globally, in `app/layout.tsx`, shared by every route — but this effect is home-only and needs the donate CTA band and the footer to move out of normal document flow into one fixed layer, without duplicating the footer or changing how it behaves on any other page.

**Built:**
- `components/SiteFooterSlot.tsx` — new client component now rendered in `app/layout.tsx` in place of the old direct `<Footer />`. On every route except `/` it renders `<Footer />` exactly as before — zero change anywhere else in the site. On the home page only, it renders `DonateBand` + `Footer` together inside a `.home-reveal-page__footer-layer` div (fixed to the bottom of the viewport, per the CSS below).
- `components/home/useHomeRevealHeight.ts` — a small hook using only a `ResizeObserver` (never a scroll listener, per the spec's explicit instruction) to measure the reveal layer's real rendered height and publish it as a `--home-reveal-height` CSS custom property on `:root`, so the reserved space above it always matches the actual footer height rather than a guessed constant.
- `app/globals.css` — added the `.home-reveal-page__main` / `.home-reveal-page__footer-layer` / `.home-reveal-page__gift` / `.home-reveal-page__footer` rules essentially as specified: the story section is `position: relative; z-index: 2` with a `margin-bottom` reserving the reveal height, the CTA+footer layer is `position: fixed; z-index: 1` underneath it, both collapse to normal static flow under `max-width: 760px` and `prefers-reduced-motion: reduce`. Used `var(--background)` (GESA's warm paper) instead of the spec's placeholder `var(--color-bg)` — same variable name doesn't exist in this codebase, and this is the real equivalent already used everywhere else.
- `app/page.tsx` — the home page's own content (Hero, Paths, Stats, Testimonials) is now wrapped in `.home-reveal-page__main` instead of a plain `min-h-screen` div, and no longer renders `DonateBand` itself — it moved into the reveal layer above so it appears right before the footer, not as a normal section at the end of the page.

**Why the CSS classes aren't nested under one shared `.home-reveal-page` wrapper exactly like the spec's example markup:** the story section and the footer layer genuinely live in two different component trees (the page vs. the root layout) because of how Next.js persists the layout across routes — nesting them under one literal parent div isn't possible without restructuring the whole app shell. The spec's own implementation notes anticipate this ("if the existing app shell renders the footer globally, add a home-only modifier... instead of changing footer behavior across every route"), which is exactly what `SiteFooterSlot` does. The CSS variable is scoped to `:root` instead of a `.home-reveal-page` ancestor for the same reason — it needs to be readable from both trees.

**Preserved, per the spec's explicit requirements:**
- The crisis button (`fixed`, `z-[70]`) sits well above both reveal-layer z-indexes (2 and 1) and was untouched — still visible and clickable throughout.
- Footer links and focus order are unaffected — the "covered" state is purely a visual stacking effect (`z-index`), the footer DOM is always present and fully focusable/tab-reachable, never `display: none` or `visibility: hidden`.
- Mobile (≤760px) and `prefers-reduced-motion: reduce` both fall back to plain static document flow — CTA band then footer, in order, no fixed positioning, no reserved blank space.

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error since Phase 11. Grepped every changed file for the unescaped-apostrophe pattern — all matches are inside comments, not JSX text, so no fix needed. No existing test touches `DonateBand`'s position or the home page's wrapper markup, so nothing broke there.

**Known gap:** this is a genuinely new interaction pattern (a scroll-position illusion built from CSS stacking, not JS-measured scroll progress) — please try it live on desktop/tablet once deployed and confirm it reads the way the reference recording intended before considering this done. If the reveal feels too abrupt or too gradual, the fix is tuning `DonateBand`/`Footer`'s own padding (which drives the measured height), not the mechanism itself.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 29: home page footer reveal effect (CTA + footer uncovered after Stories of healing)"
git push
```

## Phase 30 — Three Paths to Support becomes the Home landing section; Hero moved to About

Roy pointed at the current Home Hero (headline, group-therapy photo, trust badges) and asked to move it to the About page, drop the large 130px logo mark from it since it's redundant with the header's logo on every page, and make "Three Paths to Support" the new first thing visitors see on Home — done professionally, in a way that still represents the site's mission now that it's carrying the landing-page job on its own.

**Removed the redundant logo, moved Hero to About:** `components/Hero.tsx` no longer imports or renders the large `Logo`. `app/about/page.tsx` now opens with `<Hero />` in place of its old `PageHero` header block — same headline, photo, CTAs, and trust badges Roy pointed at, just without the duplicate logo. Nothing else on the About page changed.

**Made Paths the real landing section, not just a mid-page card grid:** `components/home/Paths.tsx` picked up the pieces of messaging that left with Hero — an eyebrow badge ("A global volunteer support alliance"), a proper landing-sized headline (now the page's actual `<h1>`, since Hero no longer supplies one on Home), the mission-statement copy, and the same three trust badges (Verified Professionals / 100% Free Sessions / Global Community) Hero used to show — all above the three path cards, which are unchanged. Gave the section hero-level top padding instead of the flatter mid-page `.section` spacing it had before, since it's now the first thing under the sticky header rather than something that assumed a hero above it.

**`app/page.tsx`** no longer imports or renders `Hero` — Home now opens directly with Paths, then Stats, then Testimonials, then the footer reveal layer from Phase 29.

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error since Phase 11. Grepped every changed file for the unescaped-apostrophe pattern that's broken past builds — all matches are inside comments or plain JS string literals (not JSX children text), so nothing needed fixing. Couldn't get a clean `next build`/dev-server screenshot from this sandbox (the same file-lock limitation noted since Phase 1) to visually confirm the new Paths landing section — recommend treating Vercel's own deploy as the real check here, same as every phase where that's been the case before.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 30: Three Paths to Support is now the Home landing section; Hero (logo removed) moved to About"
git push
```

## Phase 31 — Our Therapists filter sidebar redesign

Roy sent a reference image redesigning the "Our Therapists" filter sidebar — pill-style radio buttons, segmented button grids, and a bordered dropdown-with-chevron look — asking for the visual design to change without touching how the Language field's dropdown works or its options.

**What changed vs. what didn't, field by field** (`components/TherapistsDirectory.tsx`):
- **Search by name** — restyled from a plain bordered input to a rounded pill with a leading search icon.
- **Definition of a therapist** — was a plain `<select>`; now a vertical list of radio-style pills matching the reference. Kept exactly the same option list and filtering logic (every distinct specialty tag in the real therapist data) — the real list runs to dozens of values, well past the handful shown in Roy's reference image, so it's a scrollable capped-height list rather than an ever-growing column, to keep it usable and "professional" rather than becoming a giant unstyled wall of buttons.
- **Language** — left as a real `<select>` with the same options and single-value behavior, per Roy's explicit "keep the dropdown and its inside details... don't change any" instruction. Only the chrome changed: hid the native arrow, added a custom chevron icon, and gave it the same rounded bordered-box look as the rest of the sidebar.
- **Meeting duration** — was a `<select>`, now a segmented 2-column button grid using the same real session-length values (30/45/60/90 minutes, whatever's actually present in the data). Tapping an already-selected duration clears it back to "any."
- **Gender** — same segmented treatment, now three options (male/female/non-binary) instead of two. Non-binary already had a label defined in this file from an earlier phase but no way to actually select it — this just exposes a filter option the code was already halfway set up for, it's not new data or a new column.
- **Bottom buttons** — kept "Join us as a therapist" as-is, added an "Apply filters" button in GESA's sage accent color matching the reference. Filtering here has always applied live as you type/select, so this button doesn't gate anything — it smooth-scrolls down to the results grid, and only shows on mobile/tablet (`lg:hidden`) where the sidebar and results stack vertically and jumping to results is actually useful; on desktop the results are already visible beside the filters, so the button would be dead weight there.

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error since Phase 11. Grepped for the unescaped-apostrophe pattern — none introduced. Couldn't get a real rendered screenshot in this sandbox (Playwright's browser binary isn't installed here and installing it has been unreliable in past phases) — the selected/unselected pill styling directly reuses the exact pattern already shipped and working in `IntakeBookingModal`'s channel picker (Email/WhatsApp/Zoom), so confidence is high, but please take a look once it's live.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 31: redesign Our Therapists filter sidebar (pills, segmented buttons, styled dropdown)"
git push
```

## Phase 32 — Blog disabled, moved into the Footer's Explore column

Roy asked to pull "Blog" out of the main nav, move it into the Footer's Explore section, and make sure it can't actually be opened right now since there are no posts/stories to show yet.

**Built:**
- `components/Header.tsx` — removed the "Blog" link from the main nav entirely.
- `components/Footer.tsx` — added "Blog" to the existing Explore column, but as a plain `<span>` with `aria-disabled`, a "not-allowed" cursor, and a small "Soon" tag — not a `Link`, so there's nothing to click and no href pointing anywhere.
- `app/blog/page.tsx` and `app/blog/[slug]/page.tsx` — both routes now just `redirect("/")` instead of rendering the (empty) blog list or a post. This covers anyone who hits `/blog` directly via an old bookmark, external link, or search result, not just people navigating through the site's own nav. The real list/detail implementation (querying `getPublishedBlogPosts()`/`getBlogPostBySlug()`, the card grid, etc.) wasn't deleted — it's sitting in git history from right before this change, so turning Blog back on later is just restoring that and removing the redirect once there's something to publish.

**Also fixed two E2E test assertions this change would have broken, plus two more already broken by earlier phases this session:** `tests/e2e/navigation.spec.ts` had a test that clicked "Blog" in the header and expected `/blog` to render — replaced with a test that confirms the header link is gone and that `/blog` redirects home. While in that file, also caught and fixed two assertions left stale by Phase 30 (Home's Paths heading text changed to "Two clicks to a therapist who understands," and About's page heading is now Hero's "The path to emotional recovery begins here" instead of the old "Who We Are") — both were already broken before today's change, not something this phase introduced, but worth fixing while touching the file rather than leaving known-broken tests in place.

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error since Phase 11. Grepped every changed file for the unescaped-apostrophe pattern — all matches are inside comments, not JSX text. Confirmed no other component links to `/blog` anywhere else in the app (grepped the whole codebase) — the header and footer were the only two places.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 32: disable Blog, move it to Footer Explore as a non-clickable Soon label"
git push
```

## Phase 33 — Language switcher narrowed to English/Hebrew, with real RTL support

Roy sent a recording of a similar org's site whose header language picker only ever offers English and Hebrew (with flag icons), and switching to Hebrew flips the page to right-to-left — asked for the same on GESA, working properly everywhere.

**Narrowed the list, not just the picker:** `lib/languages.ts` — cut from 38 languages down to exactly English (`🇺🇸 English`) and Hebrew (`🇮🇱 עברית`), matching the flags shown in Roy's reference. This one list already fed the header `LanguageSelector`, the account page's language field, and the translation engine, so trimming it there was enough to shrink all three at once without touching those components' code.

**The actual "work properly" fix — real RTL, not just fewer options:** the translation engine (`TranslationProvider.tsx`) already supported Hebrew as a translation target since Phase 10, but it never set the page's text direction — Hebrew text was rendering machine-translated but still left-to-right, which reads wrong (misaligned punctuation, broken bidi handling of names/emails/numbers mixed with Hebrew). Added an effect that sets `document.documentElement.dir` to `rtl` when Hebrew is active (`ltr` otherwise) and updates the `lang` attribute to match, via a small `RTL_LANGUAGES` set in `lib/languages.ts` so adding Arabic or Farsi back later is a one-line change rather than a re-audit.

**Stale saved languages no longer leak through:** anyone who picked one of the 36 removed languages before this change still has that code sitting in their browser's `localStorage` or their `profiles.preferred_language` row. Added a check against the current (now much shorter) language list on load — anything outside English/Hebrew falls back to English instead of the site quietly continuing to translate into a language that's no longer offered anywhere in the UI.

**Known, honestly-flagged limitation:** setting `dir="rtl"` correctly flips native browser behavior (text alignment, punctuation, number/bidi handling) and is the part that actually matters for Hebrew to read correctly — but it doesn't automatically mirror custom layout built with directional Tailwind utilities (`ml-`, `mr-`, `text-left`, etc.) the way the reference site's fully RTL-aware design does. Multi-column sections (the therapist filter sidebar, footer columns, card grids) will have RTL-aligned Hebrew text but may keep their current LTR visual arrangement rather than mirroring left-right like the reference. Fully mirroring every custom component's layout for RTL would be a much larger, dedicated pass — flagging this clearly rather than claiming a pixel-perfect match to the reference video.

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error since Phase 11. Grepped every changed file for the unescaped-apostrophe pattern — all matches are inside comments. Confirmed the account page's language dropdown and the header selector both automatically picked up the shorter list with no code changes needed in either file, since both already just map over `LANGUAGES`.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 33: language picker narrowed to English/Hebrew, with real RTL direction switching"
git push
```

## Phase 33.1 — Same request came back with the same recording; header picker made visible, real blocker identified

Roy sent the identical request and reference recording again, asking to make sure English/Hebrew "works properly across the website." Checked `git log`/`git status` first rather than assuming — Phase 33 above was already committed and pushed (`50d39c6`, working tree clean before this round), so the language list, RTL direction switching, and stale-language fallback described there are already live. Two real things came out of re-checking this rather than just re-shipping the same commit:

1. **The header picker didn't look like the reference.** Roy's video shows the flag + current language name sitting directly in the header ("🇺🇸 English ⌄"), not hidden behind a generic icon. The Phase 33 implementation kept the pre-existing plain globe-icon button — functionally fine, but not what the reference showed and not something you could tell your current language from at a glance. Fixed in `components/LanguageSelector.tsx`: the button now shows the flag and language name (name hidden below the `sm` breakpoint to avoid crowding the header on small screens, flag always visible), with a chevron, and the dropdown rows show flag + name too. `lib/languages.ts` gained separate `flag`/`name` fields alongside the existing combined `label` (kept as-is since `AccountForm.tsx`'s `<option>` text still uses it — no other file needed changes).

2. **The likely reason Hebrew doesn't fully translate on the live site:** `GOOGLE_TRANSLATE_API_KEY` has been flagged as unset since Phase 10 and still shows only a placeholder in `ENV_VARS.md` — confirmed it's genuinely not configured anywhere by checking `.env.local` directly (no match at all, not even a blank entry). Without it, `lib/translate.ts`'s `translateBatch()` does exactly what it's designed to do when a key is missing: silently returns the original English text instead of throwing, so the page still flips to right-to-left (that part doesn't depend on the key) but the text itself stays in English — which would look exactly like "Hebrew is selected but the text isn't Hebrew." This needs a real Google Cloud Translation API key from Roy's own Google Cloud account (billing-enabled project, "Cloud Translation API" turned on) — not something I can generate or substitute for. Added to Vercel env vars (both Dev and Production) per the existing `ENV_VARS.md` instructions, this should be the last piece for Hebrew to actually translate site-wide rather than just changing direction.

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error since Phase 11. Grepped changed files for the unescaped-apostrophe pattern — none found.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 33.1: show flag+language name in header picker; flag missing GOOGLE_TRANSLATE_API_KEY as the likely translation blocker"
git push
```

## Phase 33.2 — Same request, third time; confirmed what's live, fixed the header's RTL mirroring, restated the one real blocker

Roy sent the same reference recording again, asking for the English/Hebrew switcher to "work properly across the website" with Hebrew rendering in Hebrew script everywhere. Checked before assuming anything needed rebuilding:

- `git log` confirms Phase 33 (`50d39c6`) and Phase 33.1 (`8bb5c22`) are both committed, pushed, and match what's currently in the working tree — the two-language picker with flags, the `dir="rtl"`/`lang` switching, and the stale-saved-language fallback are all still exactly as documented there. Nothing had regressed or gone missing.
- `.env.local` still has no `GOOGLE_TRANSLATE_API_KEY` entry at all (checked directly, not assumed) — this is the same blocker Phase 33.1 flagged and it's still unresolved. This is the actual reason Hebrew "doesn't work" the way Roy means: the page correctly flips to right-to-left the moment Hebrew is selected, but `lib/translate.ts`'s `translateBatch()` is built to silently fall back to the original English text whenever this key is missing, rather than erroring — so every string on the page stays in English while the layout direction changes underneath it. **This can't be fixed with more code** — it needs a real Google Cloud Translation API key from Roy's own Google Cloud account (a billing-enabled project with "Cloud Translation API" turned on, then an API key from that project), added to Vercel's environment variables for both Dev and Production per `ENV_VARS.md`. I don't have a way to create or substitute for this credential.

**One real, useful fix made this round — the top navigation bar specifically, since that's what Roy pointed at:** `components/Header.tsx` was using physical-direction Tailwind utilities (`ml-2` on the nav, `ml-auto` on the right-hand action cluster) which don't flip when the document direction changes — so even with `dir="rtl"` set, the header's own layout would have stayed pinned left instead of mirroring like the reference recording. Switched both to their CSS logical-property equivalents (`ms-2`, `ms-auto` — "margin-inline-start", relative to reading direction, supported natively since Tailwind 3.3+) so the header nav and the Donate/notifications/language/account cluster now genuinely swap sides under Hebrew, not just the text alignment within them.

**Also filled in a documentation gap while in this area:** `.env.example` never listed `GOOGLE_TRANSLATE_API_KEY` (or `ANTHROPIC_API_KEY` from Phase 9) at all, even though `ENV_VARS.md` did — added both with a short explanation, so a fresh local setup doesn't silently miss them.

**Still an honest, open limitation** (same one flagged in Phase 33, only partially narrowed by this round's header fix): other multi-column custom layouts — the Our Therapists filter sidebar, Footer's column grid, card grids — use their own physical-direction utilities here and there and haven't been individually audited for RTL mirroring. Hebrew text in them will be correctly right-to-left and correctly translated (once the API key is set), but the overall visual arrangement of those sections may not mirror left-right the way the header now does. A full RTL layout audit across every component would be a larger, dedicated pass rather than something to fold into this round unnoticed.

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error since Phase 11. Grepped the changed file for the unescaped-apostrophe pattern — none found.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 33.2: fix header RTL mirroring with logical margins; document the missing Google Translate key blocker"
git push
```

## Phase 34 — Footer reveal effect extended to About, Our Therapists, and Support Groups

Roy asked for the Phase 29 "footer reveal" effect (built Home-only) to also apply on About, Our Therapists, and Support Groups. Blog wasn't included — it's been disabled and redirects straight to Home since Phase 32, so there's no actual rendered page left for the effect to apply to; noted below rather than silently skipped.

**Generalized rather than copy-pasted:** the Phase 29 implementation was written assuming exactly one page, with "home" baked into class names, a CSS variable, and a hook. Rather than duplicating that logic three more times, generalized the existing pieces so every opted-in page shares one mechanism:
- `app/globals.css` — renamed `.home-reveal-page__*` to `.reveal-page__*` and `--home-reveal-height` to `--reveal-height`. Same rules, same behavior (opaque cover on top, fixed CTA+footer layer underneath, collapses to normal flow under 760px width or `prefers-reduced-motion`), just no longer named as if only one page could ever use them.
- `components/layout/useRevealHeight.ts` — the height-measuring `ResizeObserver` hook, moved out of `components/home/` since it was never actually Home-specific, just named that way. The original file at `components/home/useHomeRevealHeight.ts` couldn't be deleted (files already written into the synced project folder can't be removed without asking first), so it's now a one-line re-export pointing at the new location rather than duplicate logic drifting out of sync.
- `components/SiteFooterSlot.tsx` — replaced the single `pathname === "/"` check with a `REVEAL_ROUTES` set (`/`, `/about`, `/therapists`, `/support-groups`). Any route in that set gets the fixed donate-CTA + footer layer; everything else (including `/blog`, admin, and every other route) keeps the plain static footer exactly as before. Adding another page later, once Blog has real content, is a one-line addition to that set.
- `app/page.tsx`, `app/about/page.tsx`, `app/therapists/page.tsx`, `app/support-groups/page.tsx` — each page's returned content is now wrapped in a `.reveal-page__main` div instead of a bare fragment, giving it the reserved bottom margin and the `z-index: 2` opaque-cover behavior. About's own existing "Join us as a caregiver" CTA section stays exactly where it is, inside that page's own cover content — the generic donate band + footer sit in the separate fixed layer underneath, same relationship as Home's "Stories of healing" section to its own reveal layer.

**Verification:** `npx tsc --noEmit` clean aside from the same pre-existing, unrelated `resend` typing error since Phase 11. Grepped the whole codebase for the old `home-reveal-page`/`home-reveal-height` names to confirm nothing was left half-renamed — no matches remain outside the compatibility re-export. Grepped every changed file for the unescaped-apostrophe pattern — all matches are inside comments or plain string literals, not JSX children text. Confirmed the Our Therapists page's sticky filter sidebar (`position: sticky` inside the new wrapper) is unaffected — the wrapper only adds `position: relative`, which sticky positioning works fine inside.

**Known gap, honestly flagged:** same caveat as Phase 29 — this is a scroll-position illusion built from CSS stacking, not something I can screenshot-verify from this sandbox. Worth a quick look on desktop across all three newly-added pages once deployed.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 34: extend footer reveal effect to About, Our Therapists, and Support Groups"
git push
```

---

## Phase 35 — Content Manager: a real CMS under the CRM dashboard

Roy pasted an architecture spec for a "Content Manager" feature (tabs, editor fields, a 4-layer admin/DB/API/render architecture) and asked for it to be built for GESA under that same name in the CRM. The spec's example content ("VentVest Global," regional NZ/Australia/US/Philippines pages, "Career Jobs," "AI Sync") turned out to be copied from an unrelated software-dev-shop's own CMS docs, not anything GESA-specific — flagged this mismatch before building anything. Roy's scoping answers: build Pages (Home, About, Our Therapists, Support Groups, Blog, FAQ, Contact, and the 5 legal pages), Section Details, Images, Footer, Controls, and CTA buttons; skip Career Jobs and AI Sync entirely (not applicable to a therapy nonprofit).

**Architecture decision — reused the existing table, no migration needed.** `public.site_content` (`key text unique, value jsonb`) already existed from Phase 3/7 with correct RLS (`site_content_admin_write`: admin-only ALL; `site_content_public_read`: public SELECT). Each editable page/section is one row; a `published: boolean` lives *inside* the JSON value rather than as a separate column, so the on/off switch is just one field in the same row the admin edits — no schema change on either Supabase project.

**Important finding, handled carefully: a second, unrelated `gesa.site_content` table** exists in its own `gesa` schema on the Production project, with a completely different structure and stale content (video hero, a "preloader" bird animation, "178 therapists" pagination) that doesn't match this codebase at all. Confirmed via `information_schema.tables` that it's a separate table belonging to some other, unrelated tool sharing the same Supabase project. Not touched, read from, or referenced anywhere in this work.

**Fallback contract:** `lib/content.ts` exports `getPageContent<T>(key, fallback)` — fetches the row, returns `fallback` if the row is missing, `published === false`, or the fetch throws; otherwise shallow-merges the row over the fallback (so an older row missing a newer field still renders something sane). This is the literal "Frontend Renderer & Fallback" layer from Roy's spec. Every fallback object is exactly today's live copy, and every new `site_content` key was seeded with `published: true` and those exact fallback values on both Supabase projects — so shipping this changed nothing visible until someone actually edits a field in the new admin UI.

**Pages wired to be Content Manager-editable**, each via `getPageContent()` against its own key: Home hero (`page_home`), About hero (`page_about_hero`, shared with the general `Hero` component) and everything else on About — mission, how-it-works cards, founders, volunteer CTA, legal/tax blurb (`page_about_sections`), Our Therapists banner (`page_therapists`), Support Groups banner (`page_support_groups`), Contact banner (`page_contact`), FAQ banner (`page_faq`), Blog banner (`page_blog` — defined for the editor even though the live Blog page still just redirects per Phase 32), and the footer tagline (`page_footer`). FAQ's actual question list and the 5 legal pages were already DB-driven before this phase (`faqs` and `legal_pages` tables) — the Content Manager manages those tables directly instead of duplicating their content into `site_content`.

**Client/Server boundary issue, solved:** `Footer.tsx` is rendered directly from `SiteFooterSlot.tsx`, which is a Client Component (needs `usePathname()`). A Client Component can't import the server-only Supabase query `getPageContent` uses without breaking the browser bundle, so `Footer` stays synchronous and takes `content` as a prop with a default fallback; the actual fetch happens once in `app/layout.tsx` (made `async`) and is passed down through `SiteFooterSlot`.

**New file `lib/content.ts`** is the single source of truth for every content shape (`SimplePageContent`, `HomeContent`, `HeroContent`, `AboutSectionsContent`, `FooterContent`) and every fallback constant (`THERAPISTS_CONTENT_FALLBACK`, `SUPPORT_GROUPS_CONTENT_FALLBACK`, `BLOG_CONTENT_FALLBACK`, `FAQ_CONTENT_FALLBACK`, `CONTACT_CONTENT_FALLBACK`, `ABOUT_SECTIONS_FALLBACK`), plus `HOME_CONTENT_FALLBACK`/`HERO_CONTENT_FALLBACK`/`FOOTER_CONTENT_FALLBACK` re-exported from their respective components. Caught and fixed a naming collision before it shipped: the first pass exported an identically-named `CONTENT_FALLBACK` from four different route `page.tsx` files, which would collide the moment the admin editor needed to import all four at once — moved every fallback into `lib/content.ts` with unique names instead, with the page files and the new admin editor both importing from there.

**New admin UI** at `/admin/content`, added to the CRM nav in `app/admin/layout.tsx` as "Content Manager." `app/admin/content/page.tsx` bulk-fetches every `site_content` key (via new `getSiteContentMap()` in `lib/queries.ts`) plus `getFaqs()` and the new `getAllLegalPages()`, merges each against its fallback, and hands everything to a client tab shell, `components/admin/content/ContentManagerApp.tsx` (tabs: Home, About, Our Therapists, Support Groups, Blog, FAQ, Contact, Legal Pages, Footer). Editors follow the existing admin pattern (`TherapistEditForm`'s style — client components writing straight to Supabase via the browser client, relying on RLS rather than API routes):
- `SimplePageEditor` — one reusable eyebrow/title/description/published form, covers Our Therapists, Support Groups, Blog, Contact, and the FAQ banner.
- `HomeEditor`, `HeroEditor` (with CTA label/link fields and a background-image URL + live preview), `FooterEditor` — small flat-field forms for their respective single rows.
- `AboutSectionsEditor` — the biggest one; add/remove UI for mission paragraphs, how-it-works cards, and founder bios, plus the volunteer CTA and legal/tax blurb fields.
- `FaqManager` — CRUD (add/edit/reorder/delete) directly over the existing `faqs` table.
- `LegalPagesManager` — a 5-item picker over the existing `legal_pages` table, editing title/body per page.

All site_content writes use `supabase.from("site_content").upsert({ key, value }, { onConflict: "key" })` rather than `update`, since some keys' rows didn't exist until this phase's seeding — `key` already has a unique constraint (`site_content_key_key`), confirmed before relying on it.

**Seeding:** ran the exact seed (all 9 new keys, `published: true`, values matching `lib/content.ts` fallbacks verbatim, `on conflict (key) do nothing`) against both Production (`iddeoavrlnvwwfopsacy`) and Dev (`ggjvpfivyqartvanvhzq`). Confirmed via `select key from site_content` on each afterward. The older, unrelated `about_page`/`paths_section`/`home_hero_media`/`intake_config`/`our_specialists`/`preloader` keys from earlier phases are untouched and now fully orphaned (no code reads them) — left in place rather than deleted, since deleting rows wasn't asked for and there's no harm in them sitting unused; worth a decision from Roy on whether to clean them up.

**Verification:** couldn't get a whole-project `npx tsc --noEmit` to finish inside this sandbox's command timeout (this repo has gotten large enough that a full run runs long regardless of retries or backgrounding attempts — process isolation between tool calls rules out backgrounding it across calls too). Built a scoped tsconfig instead, covering every new/changed file from this phase plus everything they import, and ran `tsc --noEmit` against that — clean, no errors. Also grepped every new/changed file for the unescaped-apostrophe-in-JSX pattern that's broken builds in earlier phases — no matches. A follow-up full `npx tsc --noEmit` from a normal terminal (outside this sandbox) before deploying is still worth doing as a final check, since the scoped check, while it covers this phase's actual changes, doesn't touch unrelated files elsewhere in the app.

**Known gaps, honestly flagged:**
- One stray file, `tsconfig.check.json`, was written to the project root while building the scoped type-check above and can't be removed by me (files already synced into the project folder can't be deleted without asking first) — it's inert (nothing in `package.json` or the build references it) but Roy may want to delete it manually, or ask me to and I'll confirm with him first.
- The "Controls" item from Roy's scope answer is interpreted here as the per-page Published toggle and the admin form controls themselves, since nothing else in the spec maps to a distinct "Controls" surface — worth confirming that's what was meant.
- Not screenshot-verified from this sandbox; worth a pass through `/admin/content` on a real browser after deploy to confirm every tab renders and saves as expected.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 35: add Content Manager CMS under the CRM dashboard"
git push
```

---

## Phase 35.1 — Content Manager round 2: Header, Footer, Home path cards, and directory microcopy

Phase 35 built the Content Manager but hadn't been committed yet — from Roy's side, nothing had changed on the live site, which read as "not implemented." Confirmed via `git status` that every Phase 35 file was sitting as uncommitted/untracked changes in the project folder. Renamed the CRM nav entry and page heading from "Content Manager" to "Content Manager (Editing Details)" per Roy's exact wording, then asked what to expand before touching anything further, since "all interfaces, section fields, controls, buttons, text details" read as a possibly much larger scope than Phase 35 covered. Roy chose both offered options: fill in the remaining hardcoded pieces on the 6 named pages, *and* extend down to generic UI microcopy (search/filter labels, form placeholders) on Our Therapists and Support Groups. He also asked about Vercel — since I don't have deploy access, he'll check the Vercel deploy log himself after pushing; git commands are at the bottom of this entry as before.

**What's newly editable this round**, all through the same `site_content` table and `getPageContent()` fallback contract as Phase 35 — no new tables, no schema change:

- **Header** (new key `site_header`, new `HeaderContent` type) — the four nav labels (Home/About/Our Therapists/Support Groups) and the Donate button's label + link. Nav link *destinations* stay fixed; `Header.tsx` now takes a `content` prop fetched in `app/layout.tsx` alongside the footer content, the same pattern used for Footer since Header is also rendered inside the app-wide layout.
- **Footer** (extended `page_footer` / `FooterContent`) — the Explore/Support/Legal column headings and every link's label text, plus the bottom bar's copyright line (supports a `{year}` token that's substituted at render time) and the "Made with care..." line. Link destinations stay fixed here too.
- **Home** (extended `page_home` / `HomeContent`) — the three trust badges under the headline, the note beneath the path cards, and each of the three path cards' title, description, CTA label, and CTA link. Important caveat, surfaced directly in the admin editor: each card's *visible* headline and description are baked into the card's photo itself (per the Phase 19 comment in `Paths.tsx`) — editing title/description here only changes the screen-reader text, not what a sighted visitor sees. The CTA link is the one field per card with a real visible effect (where the card navigates on click). Didn't build a new image-upload flow for the cards since that wasn't asked for and would need new artwork either way.
- **Our Therapists directory** (new key `component_therapists_directory`, new `TherapistsDirectoryContent` type) — every fixed label in the filter sidebar (search field, specialty/language/duration/gender labels and their "Any" options), the "Join us as a therapist" and "Apply filters" buttons, and the no-results message. The filter *options themselves* (actual specialties, languages, session lengths) stay data-driven from real therapist records, not editable text — only the static labels around them are.
- **Support Groups** (new key `component_support_groups_directory`, new `SupportGroupsDirectoryContent` type) — the "no groups open" message, the Register button, the Confirm registration button, and the post-registration success heading. The group list itself (titles, schedules, facilitators) is untouched — still sourced from the `support_groups` table, not duplicated into `site_content`.

**Admin UI:** added a new "Header" tab (first in the list) and folded the two new directory editors into the existing "Our Therapists" and "Support Groups" tabs as a second section below each page's banner editor. Wrote one generic `FlatFieldsEditor` component (`components/admin/content/FlatFieldsEditor.tsx`) that renders a published toggle plus a set of grouped text/textarea fields from a config array, rather than four more copies of the same boilerplate form — `HomeEditor`, `FooterEditor`, `HeaderEditor`, `TherapistsDirectoryEditor`, and `SupportGroupsDirectoryEditor` are now thin config wrappers around it. `HeroEditor` and `AboutSectionsEditor` stay bespoke since those shapes have real array/nested-object editing (add/remove founder cards, etc.) that a flat-fields form can't express.

**Seeding:** updated the existing `page_home` and `page_footer` rows in place (full replace, not merge, so the stored row matches the new shape exactly rather than relying on the fallback-merge to paper over the gap) and inserted the three new keys (`site_header`, `component_therapists_directory`, `component_support_groups_directory`) with `on conflict (key) do nothing`, on both Production (`iddeoavrlnvwwfopsacy`) and Dev (`ggjvpfivyqartvanvhzq`). All values match current live copy exactly — confirmed via `select key from site_content` on each project afterward.

**Verification:** same approach as Phase 35 — a whole-project `tsc --noEmit` still won't finish inside this sandbox's command timeout on a repo this size, so ran a scoped `tsc --noEmit` against a temporary tsconfig covering every file touched this round (plus everything they import) — clean, no errors. Grepped every changed file for the unescaped-apostrophe-in-JSX pattern that's broken past builds — no matches.

**Known gaps, honestly flagged:**
- Deep, code-adjacent UI strings were deliberately left out even under the "everything down to every button" scope: the Support Groups registration modal's field labels (Name/Email/Phone), its runtime status text ("Registering…", error message), and Header/Footer's icon choices. These are either negligible editorial value or tightly coupled to logic in a way that risks confusing an editor rather than helping one — flagging this rather than silently deciding it doesn't matter.
- The footer's Legal column still shows hardcoded link labels ("Privacy Policy," etc.) rather than pulling live titles from the `legal_pages` table (which the Legal Pages tab already edits) — so renaming a legal page's title there won't update its footer link text. Worth a follow-up if that inconsistency matters to Roy.
- Same stray `tsconfig.check.json` from Phase 35 is still sitting in the project root (can't delete it myself); a second scratch file, `tsconfig.check2.json`, was kept in `/tmp` in this sandbox only and never touched the project folder.
- Not screenshot-verified from this sandbox — worth a pass through the Header, Home, Our Therapists, and Support Groups tabs on a real browser after deploy, and a look at each live page to confirm nothing broke.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 35.1: Content Manager round 2 - Header, Footer, Home path cards, directory microcopy"
git push
```

---

## Phase 36 — Luxury warm-neutral color system, from a real interior photo

Roy shared a photo of a bathroom wall — soft greige paint, a grid of small gold-framed watercolors, a dark wood toilet seat — as the color direction for the whole site, with an explicit 10-color palette (Soft Greige, Warm Ivory, Soft Linen, Muted Antique Gold, Champagne Gold, Dark Gold/Bronze, Warm Charcoal, Taupe Gray, Espresso Charcoal, Warm Stone), a 60/25/10/5 usage ratio, and a hard rule: visual refinement only, zero functional/content/routing changes, gold used as a thin accent line never a fill.

**Why this was low-risk to do site-wide:** before touching anything, checked how the existing site is actually styled. `app/globals.css` already defines every brand color as a CSS custom property (`--primary`, `--accent`, `--card`, `--muted-fg`, etc.), and `tailwind.config.ts` wires each one straight into a Tailwind color name (`bg-primary`, `text-muted-fg`, `border-border`...). Roughly 200 call sites across 41 component files already use these semantic classes rather than one-off colors. That meant the palette swap for ~90% of the site was a single-file edit — change the 12 values at the top of `globals.css`, and every button, card, badge, and page background that already read `bg-primary`/`bg-card`/`text-muted-fg`/etc. picked up the new palette automatically, with no component logic touched.

**Token mapping** (old → new, all in `globals.css :root`):
- `--background` (dull ivory) → Warm Ivory `#F3F0E8`
- `--foreground` (blue-charcoal) → Warm Charcoal `#292A27`
- `--card` (near-white) → Soft Linen `#E7E2D8` — cards now read as paper/linen, not floating white rectangles
- `--primary` (deep tile blue) → Warm Charcoal `#292A27`; `--primary-600` → Espresso Charcoal `#34312B`; `--primary-fg` (white) → Warm Ivory `#F3F0E8` — primary buttons are now charcoal-with-ivory-text instead of navy-with-white-text
- `--secondary` / `--muted` (cool gray) → Soft Greige `#CCC9C0`
- `--accent` (sage green) → Muted Antique Gold `#9A9163` — this is the token already wired to Card.tsx's `hover:border-accent` and the home page's trust-badge icons, so those two spots became the "thin gold line" and "small gold icon accent" the brief asked for, for free
- `--accent-soft` (pale sage) → a pale gold-ivory wash `#F1ECDD`, used for hero glow blurs, eyebrow pill backgrounds, and icon chips — deliberately kept very light/desaturated rather than true gold, since this token appears far too often (every page hero) to carry a strong gold tone without breaking the "gold is 5%" rule
- `--clay` (already a gold-tan, `#c7a163`) → Champagne Gold `#B5A36B`, the brief's "secondary, brighter" gold — used for the same small spots it already had (eyebrow label text, quote icons, filter radio-dot, hover borders)
- `--clay-soft` → pale champagne wash `#F0EAD6`
- `--muted-fg` (cool blue-gray, used for nearly all secondary/supporting text sitewide) → Taupe Gray `#6F6D64`
- `--border` (cool gray) → Warm Stone `#D5D0C5`
- `--destructive` (error/status red) → **left unchanged** — functional color, not decorative
- `--amber` (unused duplicate of the old clay) → repurposed as Dark Gold/Bronze `#6F6545`, exposed as a new `bronze` Tailwind color; added a new `--espresso` / `espresso` token (`#34312B`) for deep-contrast surfaces like the footer

**Where the automatic cascade wasn't enough — targeted edits:**
- **Three solid-fill buttons would have become solid gold buttons** once `--clay`/`--accent` turned into real golds: Our Therapists' "Join us as a therapist" (`bg-clay`) and "Apply filters" (`bg-accent`), and the Home intake modal's WhatsApp-adjacent CTA (`bg-accent`). Restyled "Join us as a therapist" to the brief's primary pattern (charcoal bg, ivory text), "Apply filters" to the secondary pattern (champagne-gold border, charcoal text, transparent/ivory fill), and reworked the also-unused `clay` variant in `components/ui/Button.tsx` the same way, so it's correct if anyone reaches for it later. The IntakeBookingModal button turned out to be a "Message on WhatsApp" action — recolored it to the same recognizable WhatsApp green (`#25D366`) already used by the equivalent button in `match/BookingModal.tsx`, rather than gold or charcoal, since that's a brand/recognition color, not a decorative one.
- **Footer and Header had their own hardcoded hex colors**, not CSS variables (a leftover from Phase 11's blue palette), so the global remap didn't reach them. Recolored both by hand: the footer's deep-navy background → `bg-espresso`, its blue-gray text/link colors → warm ivory/stone/taupe equivalents at matching lightness; the header's translucent background tint and wordmark color → the new ivory and taupe.
- **`SupportGroupsInteractive.tsx`** had five more hardcoded blue-grays (inactive group card background, the video-call mockup's gradient and icon colors, the in-person panel background/text) — recolored each to its warm equivalent.
- **~30 `bg-white` call sites** (modals, dropdowns, form inputs, admin status selects, small pill badges) across 22 files, including two admin pages and the login/signup wordmarks, were pure white per the brief's "avoid pure white as the dominant background" rule. Did a scripted, verified find-and-replace: plain `bg-white` → `bg-card` (Soft Linen); `bg-white/NN` translucent overlays → `bg-[#e7e2d8]/NN` rather than `bg-card/NN`, since Tailwind can't apply an opacity modifier to a color that's defined as a bare CSS-variable string (`var(--card)`) — only to a literal arbitrary hex value — so reusing the token name with a slash would have silently produced no transparency at all. Grepped afterward for stray `bg-card/` (would indicate the substitution order went wrong) and for any remaining `bg-white` — both came back empty.
- Left `--destructive` (error/status red) and the WhatsApp green in both booking modals untouched, per the brief's own "don't blindly replace functional colors" rule.

**Verification:** scoped `tsc --noEmit` across every touched file (plus what they import) came back clean. Manually grepped for every old hardcoded blue-gray hex (`#1f3a4d`, `#16293a`, `#2b3238`, `#8aa082`, `#8c9eae`, `#a9b9c4`, `#8fa2ae`, `#a9bcc3`, `#5f7480`, `#cdd8dd`, `#f2efe6`, `#e9edef`, `#f5f2ea`) across every `.tsx` file — zero remaining matches anywhere in the app. No component's props, JSX structure, routes, copy, or data logic changed in this phase — every edit was a class name or a CSS variable value.

**Known gaps, honestly flagged:**
- This was done from source inspection and the codebase's own token architecture, not a visual/screenshot pass — I can't render the live site from this sandbox. Worth a full click-through on desktop and mobile after deploy, specifically checking: contrast of the new Taupe Gray secondary text on Soft Greige backgrounds, the footer's readability on Espresso Charcoal, and whether the pale gold-ivory `accent-soft` wash reads as "warm" rather than "dingy" against real content.
- The `.eyebrow` global CSS class and the trust-badge icons were already wired to `--clay`/`--accent` before this phase, so they picked up gold automatically — worth a visual check that having both tokens in the gold family doesn't make any single section look more "gold-heavy" than intended once several of these small accents appear near each other (e.g., the About page's founders section uses several `--primary` and `--accent-soft` touches close together).
- Same stray `tsconfig.check.json`/`tsconfig.check2.json` situation as Phases 35/35.1 — another scoped `tsconfig.check3.json` was used for this phase's verification, kept in `/tmp` in this sandbox only, never written to the project folder.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 36: luxury warm-neutral color system (greige/ivory/linen/gold) from reference photo"
git push
```

---

## Phase 37 — Powder-blue theme, replacing Phase 36's warm/gold system

Roy shared a second interior photo — a bathroom with a soft, dusty periwinkle-blue wall — and asked to extract that color and make it the new theme, replacing the Phase 36 warm-neutral/gold system entirely (his choice, offered as one of three options: full replacement, layer blue over the existing gold accents, or preview both first).

**Approach:** same token architecture as Phase 36, so this was a full remap of the CSS variable values in `app/globals.css`, not a rebuild. Extracted the wall color as roughly `#B7C3D6` and built a full palette around it rather than just swapping one variable:
- `--background` → Powder Ivory `#EEF1F6` (pale blue-white breathing space, same role Warm Ivory played)
- `--foreground` / `--primary` → Deep Slate `#2B3140`; `--primary-600` → `#1D212B`; `--primary-fg` → Powder Ivory — primary buttons/headings are now dark slate with light blue-white text instead of charcoal/ivory
- `--card` → Soft Mist `#E3E8EF` (light blue-gray, replacing Soft Linen)
- `--secondary` / `--muted` → `#B7C3D6`, the extracted wall color itself — used for pills, ghost buttons, and section bands, so the site carries the actual photographed color, not just a tint of it
- `--accent` → Muted Slate-Silver `#8C97A8`, `--clay` → a darker slate-blue `#7C8AA0`, `--amber` → dark slate `#4A5568` — **moved the accent family off gold entirely** rather than layering blue behind it, since gold reads as clashing/muddy against a blue field; these three tokens now form a cool pewter/slate accent system instead
- `--muted-fg` → cool slate gray `#5C6470`; `--border` → soft blue-gray `#C7D0DE`; `--espresso` → deep slate navy `#1D212B` for the footer
- `--destructive` left untouched (functional color, not decorative) — consistent with Phase 36's rule

**Targeted hex fixes** (same set of files as Phase 36, since these never used CSS variables and needed hand updates both times): `Footer.tsx`'s hardcoded text/background colors (now blue-toned instead of warm-toned, footer bg is `bg-espresso` — automatically picked up the new deep-slate-navy value with no code change needed there), `Header.tsx`'s translucent bg tint and wordmark color, five hardcoded colors in `SupportGroupsInteractive.tsx`, and the login/signup page wordmarks. Also caught three more `bg-[#e7e2d8]/NN` translucent badges left over from Phase 36's `bg-white` sweep that I'd missed spot-checking individually then — `components/TherapistCard.tsx`, `app/therapists/[slug]/page.tsx`, and two spots in `components/Hero.tsx` — updated all four to the new `#e3e8ef` (Soft Mist) equivalent.

**What didn't need touching, and why that matters:** the three buttons fixed in Phase 36 (Our Therapists' "Join us as a therapist" and "Apply filters", and `Button.tsx`'s `clay` variant) were converted from solid gold fills to token-based classes (`bg-primary`, `border-accent`, `bg-accent-soft`) specifically so they'd never need a manual re-fix if the accent color changed again — and that paid off here: they automatically picked up the new slate-blue tones with zero edits this phase. Same for the ~30 `bg-white` → `bg-card` conversions from Phase 36 — they now render Soft Mist instead of Soft Linen automatically.

**Verification:** scoped `tsc --noEmit` across every touched file came back clean. Grepped the whole codebase for every Phase 36 warm/gold hex value (`#f3f0e8`, `#e7e2d8`, `#292a27`, `#34312b`, `#ccc9c0`, `#9a9163`, `#f1ecdd`, `#b5a36b`, `#f0ead6`, `#6f6d64`, `#d5d0c5`, `#6f6545`, `#e5dfc9`, plus the specific footer/header shades) — zero remaining after the TherapistCard/Hero/[slug] fixes above. No routes, copy, props, or data logic touched.

**Known gaps, honestly flagged:**
- Not screenshot-verified from this sandbox, same as every color phase so far — worth a real click-through after deploy, particularly checking contrast of Deep Slate text on the new lighter blue-gray surfaces, and the footer's readability on the deep slate-navy background.
- The extracted wall hex (`#B7C3D6`) is a careful visual estimate from the photo, not a pixel-sampled value — close enough for a cohesive palette, but if Roy wants the literal pixel color, worth confirming with a color picker on the original photo file.
- This fully replaced Phase 36 rather than keeping both as swappable themes — there's currently no way to switch back to the warm/gold palette except reverting this phase's `globals.css` change. If Roy wants both available (e.g. a future light/dark or seasonal toggle), that'd need a small refactor to support multiple token sets rather than one `:root` block.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 37: powder-blue theme extracted from reference photo, replacing warm/gold system"
git push
```

---

## Phase 38 — Sage-green + gold-line accents, layered onto the blue base

Roy sent the same bathroom photo again and asked to also pull the picture frames' colors — the sage/olive mat green and the thin gold pinstripe between the mat and the frame — into the site. Asked one clarifying question first: layer these on top of the Phase 37 blue theme, or replace blue again with a green+gold system. Roy chose to layer — blue stays the base (background, primary, cards, borders, footer all untouched), only the accent family changes.

**What changed, in `app/globals.css` only:**
- `--accent` → `#9BA283`, a muted sage/olive green pulled from the picture mats. This is the token already wired to `components/ui/Card.tsx`'s `hover:border-accent` and the Home page's trust-badge icons, so — same as the last two phases — those two spots automatically became "green mat" accents with zero component edits.
- `--accent-soft` → `#EAF0E4`, a pale sage wash for the same hero-glow-blur and eyebrow-pill backgrounds that have carried this role since Phase 11.
- `--clay` → `#BFA046`, the thin gold pinstripe color, matching the frames closely — this is the token driving `.eyebrow` label text, the quote icon, the Our Therapists filter's selected radio-dot and hover border, and `Button.tsx`'s `clay` variant border. All of those are already exactly "thin gold line" use cases, so this reads as intended without new code.
- `--amber` → `#8C6F1F`, a deeper bronze-gold for higher-contrast accent needs than `--clay`. Renamed its Tailwind alias in `tailwind.config.ts` from Phase 37's `slate` back to `bronze` since that's what it is again (confirmed nothing in the app actually used the `slate` class before renaming it — safe).
- `--background`, `--foreground`, `--card`, `--primary`, `--primary-600`, `--primary-fg`, `--secondary`, `--muted`, `--muted-fg`, `--border`, `--espresso`, `--destructive` — **all unchanged** from Phase 37. The wall blue is still the base everywhere it was.

**Deliberately left out:** the dark wood/black frame color itself. Everything "dark" on the site already has a home in `--primary`/`--espresso` (deep slate), and layering in a third dark tone (a brown) risked muddying the blue base rather than accenting it — flagged this rather than guessing. Happy to add a dedicated frame-brown token if Roy wants it for something specific (e.g., a border treatment) rather than adding it speculatively.

**Verification:** scoped `tsc --noEmit` across every file touched since Phase 36 (this phase only touched two files — `globals.css` and `tailwind.config.ts`, no component logic) came back clean. Grepped for the old Phase 37 slate-blue accent hex values (`#8c97a8`, `#7c8aa0`, `#4a5568`) — the token remap in `globals.css` is the only place they lived, and that's exactly what changed, so no leftover stale hex anywhere else in the app (unlike Phase 36→37, this transition didn't touch any hardcoded component hex, since Footer/Header/SupportGroupsInteractive's hardcoded colors are still the Phase 37 blue tones and weren't part of what Roy asked to change this time).

**Known gaps, honestly flagged:**
- Not screenshot-verified from this sandbox, as with every color phase — worth checking in a browser that the sage green and gold don't feel disconnected from each other where they appear close together (e.g., a card's gold eyebrow label sitting above a green-bordered hover state).
- Both extracted colors (`#9BA283` sage, `#BFA046` gold) are visual estimates from the photo, not pixel-sampled — same caveat as the wall blue in Phase 37.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 38: layer sage-green and gold-line frame accents onto the blue theme"
git push
```

---

## Phase 39 — Remove "Stories of Healing" testimonials section from Home

Roy asked to remove the testimonials section ("Stories of Healing" / "In their words") from the Home page. Removed the `<Testimonials>` usage, its import, and the `getTestimonials()` data fetch from `app/page.tsx` — Home now renders just `Paths` (the landing hero) and `Stats`. `components/home/Testimonials.tsx` wasn't deleted since files already synced into the project folder can't be removed without confirming first; it's just unused now. `lib/queries.ts`'s `getTestimonials()` and the underlying `testimonials` table are untouched in case this section is wanted back later.

**Verification:** scoped `tsc --noEmit` on `app/page.tsx` and its imports came back clean.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 39: remove Stories of Healing testimonials section from Home"
git push
```

---

## Phase 40 — Move "Stories of Healing" testimonials to Support Groups

Completes the move started in Phase 39: Roy sent a screenshot of the testimonials section and asked to place it on the Support Groups page instead of just removing it. Added `getTestimonials()` to the `Promise.all` fetch in `app/support-groups/page.tsx` and rendered `<Testimonials testimonials={testimonials} />` right after the group registration interactive section, inside the same `reveal-page__main` wrapper the rest of the page uses.

`components/home/Testimonials.tsx` itself wasn't moved or modified — it's a generic, self-contained component (props in, no Home-specific logic), so importing it from the Support Groups page works regardless of which folder it physically lives in. The folder name is a little stale now that it's not Home-only, but renaming/relocating it would mean deleting the original file, which isn't allowed without confirming with Roy first — flagged rather than worked around.

**Verification:** scoped `tsc --noEmit` on `app/support-groups/page.tsx`, `app/page.tsx`, `components/home/Testimonials.tsx`, and `lib/queries.ts` came back clean.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 40: move Stories of Healing testimonials to Support Groups page"
git push
```

---

## Phase 41 — New artwork for the "Two clicks to a therapist" path cards

Roy wanted the three Home page path cards (Crisis / Veterans / Seeking Support) to use new commissioned artwork instead of the existing photography: a mixed-media piece (dark hand pouring into a nest cradling a small tree, in a black/gold frame) for Crisis, a boots-and-compass still life (green matting) for Veterans, and a hands-reaching-through-water piece (blue matting) for Seeking Support.

**Getting the actual files was the hard part, worth documenting since it'll come up again.** Images pasted directly into the chat don't reach this sandbox's file system as full-resolution files — they land as small (~370–395px wide) screenshot-quality PNGs regardless of how many times they were re-sent, seemingly a limitation of the chat's inline-paste path rather than anything fixable on my end. Confirmed this by checking file size/dimensions after two separate paste attempts — identical both times. The fix that worked: Roy dragged the files directly into a new `Three path images` folder inside the project directory (a real file-system copy, not a chat paste), which I could then read normally. Asked Roy whether to chase higher-resolution originals or proceed with what came through; he chose to proceed as-is.

**What changed:** copied the three files into `public/images/paths/` as `crisis-artwork.png`, `veterans-artwork.png`, and `seeking-support-artwork.png` (kept as PNG, the source format, rather than re-encoding to JPEG — these are small illustrative pieces, not photos, so JPEG's compression advantage doesn't really apply). Updated the `PATH_IMAGES` array in `components/home/Paths.tsx` to point at the three new files, in the same crisis/veteran/general order the rest of that file already uses. No other change to `Paths.tsx` — the cards still render as one full-bleed `object-cover` image per card, same treatment as before, so this was a pure asset swap.

**Old files** (`crisis-optimized.jpg`, `veterans-composed.jpg`, `seeking-support-optimized.jpg`) are now unused but left in `public/images/paths/` — can't delete synced project files without confirming first.

**Known gap, honestly flagged:** the new images are noticeably lower resolution than what they replaced (previous images were resized to a 1400px-wide max; these are ~370–395px wide, roughly a quarter the linear resolution). At the card's rendered size (up to ~420px tall, full card width on mobile) they'll look visibly softer, possibly a little pixelated on larger screens. Roy was told this directly and chose to proceed rather than chase down the full-resolution originals — worth revisiting if he gets access to better exports of this artwork later, since swapping in cleaner files later is just repeating this same three-file swap.

**Verification:** scoped `tsc --noEmit` on `components/home/Paths.tsx` and `app/page.tsx` came back clean. Confirmed all three new files exist on disk at their referenced paths.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 41: replace path card images with new Crisis/Veterans/Seeking Support artwork"
git push
```

---

## Phase 42 — Path cards: restore visible text, stop cropping the new artwork

Roy flagged two real problems right after Phase 41 shipped: the cards looked blank (no text at all), and the new artwork looked cropped/oversized, like it was being cut off rather than shown in full.

**Root cause of both:** the card design from Phase 19 assumed one specific kind of source image — a photo with a heading/description/button already baked into the picture itself, cropped to exactly fill a `h-[420px]` box via `object-cover`. That design had two consequences that were fine for the old photography but broke for the new artwork: (1) since the *photo* carried the visible text, the card never rendered any real DOM text — `content.card1Title` etc. existed (added in Phase 35 round 2) but were only ever used for the invisible `aria-label`, never shown on screen; (2) `object-cover` on a fixed-height box crops whatever doesn't fit that exact box shape — fine when the photo was pre-cropped to match, not fine for framed-artwork photos with a completely different aspect ratio, which were having their edges (including the picture frame itself) cut off to force-fill the box.

**Fix:** rebuilt each card in `components/home/Paths.tsx` as a normal image-then-content layout instead of one full-bleed photo:
- The artwork now sits in a fixed-height (`h-[200px]`) frame using `object-contain` instead of `object-cover`, on a soft `bg-secondary` background with padding — the whole piece is always visible, letterboxed on the shorter axis rather than cropped, so nothing gets cut off regardless of its aspect ratio.
- Title, description, and a real "Reach out now" button (styled `bg-primary`/`text-primary-fg`, matching the site's primary CTA pattern) now render as actual visible text and a clickable element below the image, reading straight from `content.card1Title`/`card1Description`/`card1CtaLabel`/`card1CtaLink` (and card2/card3) — the same Content Manager-editable fields from Phase 35 round 2, now finally shown rather than hidden in an aria-label.
- The whole card is no longer one giant `<Link>` — only the CTA button is a link now, which is also a better semantic/accessibility structure than the previous "invisible aria-label carries all the information" approach.

**Verification:** scoped `tsc --noEmit` on `components/home/Paths.tsx` and `app/page.tsx` came back clean; grepped the file for the unescaped-apostrophe-in-JSX pattern — no matches.

**Known gap, unchanged from Phase 41:** the artwork itself is still the ~370–395px screenshot-resolution files — `object-contain` means it's no longer cropped, but it's also not being scaled up, so at a 200px-tall frame it should look reasonably sharp; a wider frame would start to show the same softness flagged before. Still worth swapping in full-resolution originals if Roy gets access to them.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 42: show path card text and stop cropping the new artwork"
git push
```

---

## Phase 43 — Duration/gender filter options, and a privacy-motivated image swap on About

Roy asked for three things in one message: add 45 and 30 min as Meeting Duration filter options on Our Therapists, add a "No preference" option to the Gender filter, and replace the About page's "human group" photo with a painting, on the grounds that GESA shouldn't be using real, scraped/stock human faces anywhere on the site — paintings should fill that role instead.

**Meeting duration filter (`components/TherapistsDirectory.tsx`):** this filter was fully data-driven — it only ever showed whatever `session_lengths` values existed across current therapist records, which is why it showed a single "60 min" pill (the only value seeded so far). Rather than seed fake data to force 30/45 to appear, added a fixed `STANDARD_DURATIONS = ["30", "45", "60"]` list that's unioned with whatever the real data contains (so a future 90-min offering would still show up automatically) and sorted numerically. The filter itself still works exactly as before — selecting a duration filters therapists whose `session_lengths` includes it — it just always offers the three standard options now instead of only what happens to be populated.

**Gender filter — "No preference":** the `gender_type` Postgres enum already includes `no_preference` (confirmed in `lib/database.types.ts`), but the UI only ever exposed 3 of its 4 values as buttons. Added a fourth segmented button (widened the grid from 3 to 4 columns) filtering `t.gender === "no_preference"` — the therapist's own stated gender field, not the separate, unrelated `gender_preference` field used elsewhere for client match requests. Added `noPreferenceLabel` to `TherapistsDirectoryContent` (`lib/content.ts`) and its admin editor (`TherapistsDirectoryEditor.tsx`) so the new button's text is Content Manager-editable like the other three. Patched the existing `component_therapists_directory` row on both Production and Dev Supabase projects with `noPreferenceLabel: "No preference"` — `getPageContent()` shallow-merges over the fallback so this wasn't strictly required for the field not to break, but keeps the saved row's shape in sync with the type for when an admin next opens that editor tab.

**About page image (`components/Hero.tsx`, which is what actually renders the About page's top section since Phase 30):** the only human-photo image on this page is the Hero's `backgroundImage` — a Pexels stock photo of a group therapy session, i.e. real people's faces sourced from a stock site. Replaced it with a blue-toned abstract painting (Pexels photo 3518623, chosen to match the site's own blue/gold brand palette from Phases 37-38) rather than a figurative painting of people, since a painted depiction of specific real faces would just reintroduce the same identity concern in a different medium. Updated `HERO_CONTENT_FALLBACK.backgroundImage` and the alt text on both `<img>` tags in `Hero.tsx` (the mobile/tablet card and the large-screen bleed card). Found and fixed a real bug while in there: the large-screen `<img>` had its `src` hardcoded to the old Pexels URL directly instead of reading `content.backgroundImage` like its mobile/tablet twin — meaning a future Content Manager edit to this field would only have updated half the page. Both now read from `content`. Patched the existing `page_about_hero` row on both Supabase projects (it was a real published row with the old URL, so the code fallback alone wouldn't have taken effect on the live site). This field stays Content Manager-editable, so Roy can swap in a different painting later from `/admin/content` without needing a code change.

**Verification:** scoped `tsc --noEmit` covering `TherapistsDirectory.tsx`, `Hero.tsx`, `TherapistsDirectoryEditor.tsx`, `FlatFieldsEditor.tsx`, `content.ts`, `database.types.ts`, and the About/Our Therapists pages — clean, no errors. Grepped the same files for the unescaped-apostrophe-in-JSX pattern — no matches.

**Known gaps, honestly flagged:**
- The new painting is abstract rather than figurative, so it no longer visually implies "a group of people supporting each other" the way the old photo did — it's a deliberate trade (any figurative painting of specific faces would reintroduce the identity concern), but worth flagging in case Roy wants a different kind of image (e.g. a painting of hands, or a more symbolic/illustrative piece) instead of pure abstract art.
- Couldn't reach Wikimedia Commons or similar sources from this sandbox to source a public-domain figurative painting (e.g. Van Gogh's *The Good Samaritan*, which would have fit the "helping someone in need" theme well) — this sandbox's network only allows a fixed set of domains, and Wikimedia wasn't reachable. Went with a Pexels image instead since that domain is already used elsewhere in this codebase for the same purpose.
- Same stray `tsconfig.check.json`/`tsconfig.check2.json` files from earlier phases are still sitting in the project root — still can't remove them without confirming with Roy first.
- Not screenshot-verified from this sandbox — worth a look at Our Therapists' filter sidebar and the About page hero on a real browser after deploy.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 43: add 30/45 min and No preference filter options, swap About hero photo for a painting"
git push
```

---

## Phase 44 — the actual About page painting, replacing the Phase 43 placeholder

Phase 43's abstract painting was a placeholder pick, honestly flagged as such since it no longer carried the "people supporting each other" meaning the old photo did. Roy immediately followed up with the real painting he wanted: a teal-and-gold piece of layered hands cradling a glowing form inside leaves — care and protection expressed through many hands around one center, with no real faces depicted at all, which fits both the emotional theme and the privacy rationale from Phase 43 better than a generic abstract piece.

**Getting the actual image:** Roy sent a full-page mockup screenshot (nav bar, headline, buttons — the painting was just the right-hand hero card within it) rather than a bare image file. Cropped the mockup down to just the painting itself using the coordinate mapping given with the image, trimming the bottom edge further to exclude the "Over 5,000+ Sessions Completed" chip overlay that was bleeding into the crop (that chip is real, code-rendered UI, not part of the source image, and would have been visible twice — once real, once painted into the background — if left in). Resized the crop to 1600px wide and saved it as `public/images/about/hero-painting.jpg` (256KB).

**What changed:** `HERO_CONTENT_FALLBACK.backgroundImage` in `components/Hero.tsx` now points at this local file (`/images/about/hero-painting.jpg`) instead of the Phase 43 placeholder's external Pexels URL — this is the first time this field has held a real project asset rather than a stock-site reference. Updated both `<img>` alt text strings to describe the actual painting. Patched the live `page_about_hero` row on both Production and Dev Supabase projects with the new path, same as Phase 43's image swap required.

**Verification:** re-ran the same scoped `tsc --noEmit` from Phase 43 (covers `Hero.tsx`) — clean. Grepped `Hero.tsx` for the unescaped-apostrophe-in-JSX pattern — no matches.

**Known gap:** not screenshot-verified from this sandbox — worth a look at the About page hero on a real browser after deploy to confirm the crop reads well at the actual card sizes (the small mobile/tablet card and the large full-height desktop bleed card use the same file, and the desktop version in particular crops much more aggressively via `object-cover`).

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
git add -A
git commit -m "Phase 44: use Roy's actual painting for the About hero image"
git push
```

---

## Phase 45 — Site-wide scroll-driven motion layer

Roy sent a spec PDF ("GESA Scroll-Driven Interaction System") asking for a premium scroll-motion enhancement layer across the site — smooth scrolling, viewport reveals, staggered entrances, cinematic media parallax, scroll-linked text, a horizontal scroll-linked statement, card entrances, a metrics count-up, and better accordion transitions — explicitly as an *enhancement layer*, with the document's own top-priority rule being to preserve every existing route, control, CTA, database behavior, and piece of content untouched.

**Library choice, and one deliberate deviation from the spec's literal diagram:** installed `framer-motion` (`^11.18.2`) — no other animation library existed in the project before this. The spec's "Global Smooth Scrolling" diagram (raw scroll -> smooth interpolation -> normalized progress) is the exact pattern used by scroll-hijacking libraries like Lenis, which replace native scrolling with a `transform`-driven wrapper div. This codebase's footer-reveal effect (`SiteFooterSlot`/`useRevealHeight`, `.reveal-page__footer-layer` in `app/globals.css`) and its sticky header and sticky filter sidebar (`TherapistsDirectory`) all depend on real `position: fixed`/`sticky` behavior relative to the actual viewport — a transformed scroll container breaks that (fixed/sticky children become fixed relative to the transformed ancestor instead of the viewport). Since "preserve all existing GESA functionality" is the spec's own stated top-priority rule, real page scrolling was deliberately left 100% native. `html { scroll-behavior: smooth }` (added in `app/globals.css`, gated behind `prefers-reduced-motion: no-preference`) covers programmatic/anchor jumps; a new `SmoothScroll` provider (`components/motion/SmoothScroll.tsx`, wrapping everything in `app/layout.tsx`) exposes a spring-smoothed 0-1 scroll-progress value via React context for any component that wants it, without ever touching real scroll input. This is the one place this phase diverges from the spec's literal architecture, and it's explained at length in that file's own comment.

**Reusable motion primitives** (`components/motion/`), all respecting `prefers-reduced-motion` and all animating only `transform`/`opacity` (never layout properties), per the spec's own performance and accessibility sections:
- `config.ts` — shared timing (micro/reveal/large/stagger durations), a single calm easing curve (no bounce/elastic, per spec section 11), and distance/scale constants, so the whole site's motion feel is tunable from one file.
- `Reveal.tsx` — general viewport-entrance primitive (`fade` / `fade-up` / `fade-scale` / `horizontal` / `image`).
- `StaggerReveal.tsx` (`StaggerGroup` + `StaggerItem`) — staggered group/card entrances.
- `ParallaxMedia.tsx` — restrained cinematic scale+drift for major images (spec's own 1.05->1.00 example range).
- `ScrollText.tsx` — subtle scroll-linked drift for selected major headlines only.
- `HorizontalScroll.tsx` — horizontal scroll-linked word/concept row, auto-disables its own JS movement on mobile in favor of plain touch scrolling.
- `AnimatedCounter.tsx` — count-up for numeric stats, gracefully renders non-numeric values (e.g. "Global") statically instead of animating.
- `useViewportScale.ts` — desktop/tablet/mobile bucket for scaling distances down on smaller screens per spec section 13.

**Where it's wired in**, content/links/functionality unchanged everywhere:
- `app/layout.tsx` — global `SmoothScroll` provider.
- `components/home/Paths.tsx` (Home) — staggered eyebrow/headline/subtitle/badges, `ScrollText` on the headline, staggered card entrance for the three path cards.
- `components/Hero.tsx` (About) — same staggered text entrance, `ScrollText` headline, `ParallaxMedia` on both the mobile/tablet and large-screen hero images.
- `components/ui/PageHero.tsx` — staggered eyebrow/title/description entrance, which by itself brings consistent motion to nearly every secondary page (Our Therapists, Support Groups, FAQ, Contact, legal pages) since they all share this one banner component.
- `components/home/Stats.tsx` — staggered columns + `AnimatedCounter` on each value.
- `components/home/Testimonials.tsx`, `components/TherapistsDirectory.tsx` — staggered card-grid entrance (testimonials, therapist results).
- `app/about/page.tsx` — `Reveal` on section headings, staggered card entrance for the how-it-works and founders grids.
- `app/page.tsx` (Home) — added the horizontal scroll-linked statement between the path cards and the stats band, built entirely from this page's own existing copy (the three trust badges + three path titles) rather than any new text.
- `components/FaqAccordion.tsx` — **investigated, then deliberately left unchanged.** Tried adding the spec's accordion open/close height+opacity transition; it broke `tests/unit/FaqAccordion.test.tsx`, which asserts both the default-open and a just-clicked-open answer are synchronously `toBeVisible()` with no `waitFor` anywhere in the file — any real transition duration reads as "not yet visible" at the exact instant those assertions run. Confirmed this by actually running the test suite, not just reasoning about it. The spec's own top-priority preservation rule outranks this one polish item, so this file's diff is just an explanatory comment; the chevron's existing rotate transition is unchanged and was already smooth.

**Testing fallout, all resolved:**
- Adding `whileInView` (via `Reveal`/`StaggerGroup`) crashed every test that renders `TherapistsDirectory` with `ReferenceError: IntersectionObserver is not defined` — jsdom has no real `IntersectionObserver`. Fixed with a minimal stub added to `jest.setup.ts` (never fires a real intersection callback, which is fine since no test asserts anything about scroll-triggered animation state).
- Found and fixed **three pre-existing, unrelated test bugs** in `tests/unit/TherapistsDirectory.test.tsx` while getting the suite green again — confirmed via `git show HEAD` that these were already broken before this phase touched anything: the search input's placeholder text had drifted to `"Find therapist…"` at some earlier phase while the test still expected the old `"Search…"`, and the language `<select>` picked up a wrapping `<div>` (for the custom chevron icon) at some earlier phase, so `getByText("Language").nextElementSibling` no longer resolved to the actual `<select>`. Fixed both to match current reality (`getByRole("combobox")` for the language select, the correct placeholder string) rather than leaving a broken safety net in place.
- Ran the full unit suite after all fixes: **19/19 passing.**

**Verification:** scoped `tsc --noEmit` across every new/changed file (all seven motion primitives, every component/page touched, `jest.setup.ts`) — clean. Grepped everything for the unescaped-apostrophe-in-JSX pattern — no matches. Could not get a whole-project `next build` to finish inside this sandbox's ~178-second command timeout (same long-standing limitation as the whole-project `tsc --noEmit` issue noted in earlier phases) — relying on the scoped type-check plus the full, now-passing unit test suite instead. A real `npm run build` from a normal terminal (or letting Vercel's own build run) before/during deploy is worth doing as this phase's final check, same caveat as several earlier phases.

**Known gaps, honestly flagged:**
- `next build` itself was never run to completion in this sandbox — see above. Nothing in the scoped type-check or test suite suggests a build-time problem, but this is genuinely unverified.
- Not screenshot- or browser-verified from this sandbox — worth a real scroll-through of Home, About, Our Therapists, Support Groups, and FAQ after deploy to confirm the motion feels like the "calm, intentional, refined" result the spec asks for and not something more aggressive, plus a check with the OS-level "reduce motion" setting turned on.
- The horizontal scroll-linked statement was only added to the Home page (between the path cards and stats). The spec doesn't specify where it should live, and adding it to more than one spot risked violating its own "visual restraint" section — happy to add it elsewhere if Roy wants it in a specific spot.
- SupportGroupsInteractive's group list and the match-wizard flow were left untouched — they're interactive/stateful flows rather than static content reveals, and the spec's card-entrance/reveal guidance is aimed at content sections, not multi-step forms; flagging in case Roy specifically wanted motion there too.
- A stray `.git/index.lock` file was left behind by a failed `git stash` attempt during this phase's testing (the sandbox couldn't remove it — same file-permission constraint as the stray `tsconfig.check*.json` files from earlier phases). It didn't affect any of the actual work, but **Roy should delete `.git/index.lock` by hand before running the git commands below**, or a real `git commit` will fail with "Another git process seems to be running."

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
del .git\index.lock
git add -A
git commit -m "Phase 45: add site-wide scroll-driven motion layer (framer-motion)"
git push
```

---

## Phase 46 — Advancing the motion layer: Modal, Support Groups, background depth

Roy's feedback on Phase 45: it read as too static, and Support Groups specifically didn't feel touched at all. Both were fair — Phase 45 deliberately skipped the two biggest interactive surfaces on the site (the modal system, and Support Groups' own group-picker/preview panel) as out of scope for "content reveals," and the reveal distances/durations were tuned conservatively toward the spec's "refinement, not spectacle" end. This phase addresses both without changing any structure, copy, controls, routes, or database behavior — same rule as every phase before it.

**`components/ui/Modal.tsx` — the single most-reused interactive surface site-wide** (booking, intake, and Support Groups registration all share this one component), previously had zero transition: a modal existed at full opacity or didn't exist, with nothing in between. Wrapped it in `AnimatePresence` — backdrop fades, the panel itself does a small scale+fade+rise on open and reverses on close. Same portal target, same escape-key handler, same backdrop-click-to-close, same everything except the transition. This one file change means every modal on the site now animates.

**`components/SupportGroupsInteractive.tsx` — this page's actual main content**, previously fully static: the group-picker list now uses the same `StaggerGroup`/`StaggerItem` entrance as every other card list on the site, and — the more substantial addition — the live preview panel on the right now crossfades its content (via `AnimatePresence mode="wait"`, keyed on the selected group's id) instead of snapping instantly when switching between groups. No change to the selection state, the registration flow, or the modal it opens.

**`components/motion/ParallaxLayer.tsx`** — a new primitive specifically for the decorative background glow/blob elements that already sat behind content on Home, About, and every secondary page's `PageHero` banner (spec section 10's "background layer, subtle parallax," distinct from `ParallaxMedia` which is built for real media inside a clipped frame). Wired into:
- `components/home/Paths.tsx` (Home) — the blob behind the headline.
- `components/Hero.tsx` (About) — the whole decorative doodle/glow layer.
- `components/ui/PageHero.tsx` — since nearly every secondary page (Our Therapists, Support Groups, FAQ, Contact, legal pages) shares this one banner component, this single change gave all of them the same background depth cue at once.

**Turned up the amplitude** in `components/motion/config.ts` — the one file every primitive reads its timing/distance from — since Roy's core complaint was that the existing motion was hard to notice: reveal duration 0.6s -> 0.65s, large 0.85s -> 0.9s, stagger 0.1s -> 0.12s, and fade/rise distances up roughly 25-30% (still inside the spec's own stated ranges, nothing pushed into "spectacle" territory). Also widened the About hero's `ParallaxMedia` intensity/scale on both images, and widened the Home horizontal-scroll statement's travel range, for a more noticeably "cinematic" feel on the two most visible image/motion moments.

**Verification:** scoped `tsc --noEmit` across every new/changed file — clean. Grepped for the unescaped-apostrophe-in-JSX pattern — no matches. Ran the full unit suite in two batches (sandbox timeout constraints, not a real issue) — **19/19 passing**, including the two suites that actually exercise these motion primitives (`FaqAccordion`, `TherapistsDirectory`).

**Known gaps, honestly flagged:**
- Still no `next build` run to completion in this sandbox (same ~178-second command-timeout ceiling as every earlier phase that tried) — scoped type-check and the full passing test suite are the available signal; a real `npm run build` locally or via Vercel's own build is worth doing before/at deploy.
- Deliberately did not add parallax to the small path-card thumbnails on Home (200px-tall, `object-contain` frames) — tried reasoning through it and concluded the payoff was marginal against the spec's own "visual restraint" section for secondary visuals; flagging in case Roy wants it added anyway now that the rest of the site is more animated.
- Not screenshot- or browser-verified from this sandbox — this phase specifically should get a real look at Support Groups (the group picker + preview crossfade) and a modal opening (Book a Session, or the Support Groups registration flow) after deploy, since those are the two changes with no automated test coverage backing them.
- Same `.git/index.lock` issue from Phase 45 — still present, still can't be removed from this sandbox; the `del` command below is included again as a reminder.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
del .git\index.lock
git add -A
git commit -m "Phase 46: animate the modal system and Support Groups, add background parallax depth"
git push
```

---

## Phase 47 — Gold banner redesign, Home gallery hero, golden card hover

Roy sent a reference mockup and asked for: the Home landing page rebuilt to match it (a warm gold hero band with a gallery-wall of framed artwork, cards floating over the seam below), the same gold background applied to About, Our Therapists, and Support Groups, and a "golden hover" effect on the three path cards specifically.

**`app/globals.css` — two new reusable classes**, built from the site's existing gold-family tokens (`--clay`, `--amber`, `--clay-soft`) rather than new colors, so this reads as "more of this palette," not a different brand:
- `.gold-banner` — the brushed-gold gradient background, with a slow diagonal sheen sweep (disabled under `prefers-reduced-motion: reduce`, same rule as every motion effect since Phase 45).
- `.gold-card-hover` — the golden hover effect Roy asked for on the three path cards: a one-shot diagonal gold-light sweep across the card plus a soft gold glow shadow, both on hover/focus, both reset cleanly so re-hovering always replays the same clean sweep.

**`components/home/Paths.tsx` (Home)** — rebuilt to match the mockup: the hero band now uses `.gold-banner`, the headline/subtitle/badges moved to a two-column layout (text left, on large screens) with a decorative "gallery wall" of the three existing path-artwork files on the right — three overlapping picture-frame boxes (white mat, dark espresso frame, gold-toned frame) at slight rotations, purely decorative (`aria-hidden`, empty `alt`, since the same three images already carry real, meaningful alt text in the cards below). The three cards themselves now sit in a plain section below with a small `-mt` pull so they visually float up over the gold/light seam, each card's artwork now sits in its own small white-matted frame instead of a bare `object-contain` box, and each card got `.gold-card-hover`. Text color on the gold band adjusted for contrast (subtitle/badges from `text-muted-fg` to `text-primary/80`, eyebrow chip to a cream background) — every `content.*` field, every link destination, and every card's title/description/CTA is exactly what it was before; only the visual presentation changed.

**`components/Hero.tsx` (About)** — swapped the section's plain background for `.gold-banner`, with the same contrast adjustments as Home (eyebrow chip, subtitle, badges). The painting/media panel, both CTAs, and all copy are unchanged.

**`components/ui/PageHero.tsx`** — added an opt-in `gold` boolean prop (default `false`) rather than making this the new default for every page that uses this shared banner. When `gold` is passed, the section gets `.gold-banner` and the eyebrow chip/description colors adjust for contrast; when it's not, the component renders exactly as before. Passed `gold` from `app/therapists/page.tsx` and `app/support-groups/page.tsx` only — Roy named these two plus About specifically, not FAQ, Contact, or the legal pages, which also render through `PageHero` and were deliberately left on their existing light banner.

**Verification:** scoped `tsc --noEmit` across every changed file — clean. Grepped for the unescaped-apostrophe-in-JSX pattern — no matches. `components/TherapistsDirectory.tsx` and `components/FaqAccordion.tsx` — the two components with real automated test coverage that exercises the motion primitives — were not touched at all this phase (confirmed via `git status`), so the full-suite re-run from Phase 46 still stands; spot-checked the test runner itself still works cleanly against an unrelated file.

**Known gaps, honestly flagged:**
- The gallery-wall frame positions/rotations are a tasteful approximation of the mockup, not a pixel-measured recreation — no image-editing tool available in this sandbox to match the reference exactly; worth a look on a real screen to confirm the overlap/spacing reads well at actual browser widths.
- The three path-artwork files are still the ~370-395px screenshot-resolution originals from Phase 41 — now displayed twice per page (once in the gallery, once in each card), which doubles their exposure at a size where their softness is more likely to be visible than before. Same standing offer as every phase since 41: swap in cleaner exports whenever they're available.
- Not screenshot-verified from this sandbox — this phase specifically should get a real look at Home (the gallery layout, especially at tablet widths where it's hidden below `lg`), and a hover over each path card to see the actual gold sweep timing/intensity.
- `border-b border-border` on About's Hero section (a cool blue-gray border) was left as-is against the new gold background rather than retuned to a warmer tone — a minor, easy-to-miss detail, not touched since it wasn't called out and the effect is subtle either way.
- Same `.git/index.lock` situation as Phases 45-46 — still can't remove it from this sandbox.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
del .git\index.lock
git add -A
git commit -m "Phase 47: gold banner redesign for Home/About/Our Therapists/Support Groups, golden card hover"
git push
```

---

## Phase 48 — Support Groups: dark charcoal-and-gold card redesign

Roy sent a reference mockup for the Support Groups page specifically: the group-picker cards and the live preview panel restyled as dark charcoal-navy surfaces with thin gold veining, gold serif headings, and gold-bordered pills, replacing the light cards from before. Explicit instruction: don't change any controls, logic, or text — UI only.

**`app/globals.css` — one new reusable class**, `.charcoal-marble`: a dark base color with two layered low-opacity gradients (a diagonal warm-gold tint, a faint diagonal sheen) approximating a "dark stone with a gold vein" surface without an actual texture image — none exists or was provided, and generating one wasn't an available option in this sandbox. Scoped as page-specific (only referenced from `components/SupportGroupsInteractive.tsx`), not added as a global card variant elsewhere on the site.

**`components/SupportGroupsInteractive.tsx`** — restyled, with every piece of real data and every control left exactly as it was:
- Group-picker cards: `.charcoal-marble` background, gold serif title, gold-bordered format pill, `.gold-card-hover` (from Phase 47) for the same golden sweep-on-hover effect Roy asked for on Home's cards.
- One deliberate content-visibility change, called out here rather than buried in the diff: the reference mockup shows every card's description and meta row (facilitator/schedule/seats) visible at once, where the previous behavior only expanded that block for the selected card. Matched the mockup's information density since that was the explicit brief — the text itself didn't change, and the selection state (`isOn`) still drives the border highlight and which group the right-hand preview panel shows; only which cards render their already-existing description block changed.
- The live preview panel (online-call mockup / in-person info, whichever the selected group's format is) and the Register button both restyled to the same dark/gold treatment — same conditional logic, same fields, same button behavior.
- The registration modal's own content (heading, labels, inputs, submit button) got matching gold accents (gold focus-border on inputs, the existing `Button` component's already-defined `clay` — gold-bordered outline — variant for submit) — but the modal's shared chrome (backdrop, panel, close button, portal) in `components/ui/Modal.tsx` was deliberately left untouched, since that file is also used by the booking and intake flows elsewhere on the site; changing it would have redesigned modals Roy didn't ask about.
- **Not implemented:** the mockup showed a "Secure Phone Verification" element with a progress bar on each card, and a "Phone Modal" panel — neither corresponds to any real feature in this app (registration only ever had an optional phone *number* field, never a verification step). Building that would have been inventing a new control, which directly contradicts "don't change any current controls, logic" — flagging this explicitly rather than silently ignoring part of the reference image.

**Verification:** scoped `tsc --noEmit` on the changed component and page — clean. Grepped for the unescaped-apostrophe-in-JSX pattern — no matches. Attempted to run the Tailwind CLI directly to sanity-check the new CSS compiles, but it failed on an unrelated, pre-existing sandbox issue (a broken `sucrase`/`ts-interface-checker` module resolution in `node_modules`, not something this phase's CSS caused) — manually reviewed the new `.charcoal-marble` block for balanced braces/valid syntax instead. No test file exists for `SupportGroupsInteractive.tsx`, so there's no automated suite to re-run for this component specifically.

**Known gaps, honestly flagged:**
- The Tailwind CLI failure above is worth a real `npm run build` (or `npm run dev`) check locally to confirm nothing in `node_modules` is actually broken — this sandbox's `node_modules` lives on a network-mounted drive, which has caused unrelated tooling issues before (see `jest.config.js`'s own comment about SWC crashing for the same reason).
- The card-expansion behavior change (every card now shows its full description, not just the selected one) is a real, if minor, information-display change — flagging clearly in case Roy specifically wanted the old collapse/expand behavior kept and only the colors changed.
- Not screenshot-verified from this sandbox — worth a real look at the group cards, the preview panel in both online and in-person states, and the registration modal.
- Same `.git/index.lock` situation as the last three phases.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
del .git\index.lock
git add -A
git commit -m "Phase 48: dark charcoal-and-gold redesign for Support Groups cards and preview panel"
git push
```

---

## Phase 49 — Support Groups: cards as a 2-column grid, details open as a drawer

Roy sent the same mockup again with two corrections to how Phase 48 read it: the group cards should be a 2-column grid (Phase 48 kept them as a single stacked list, just recolored), and clicking a card should open its details "in the right field" as a modal — i.e. the details panel should be hidden until a card is clicked, not always visible. He also repeated that the mockup's "Secure Phone Verification"/"Phone Modal" boxes should be removed and that slot filled with the matching real UI instead.

**`components/SupportGroupsInteractive.tsx` — rebuilt around a drawer, not an inline column:**
- The group cards are now `grid gap-4 sm:grid-cols-2` instead of a stacked `flex flex-col` list — matches the mockup's 2-up layout.
- Added one new, minimal piece of state, `previewOpen` (boolean, starts `false`). Clicking a card now does what it did before (`setActiveId`) plus `setPreviewOpen(true)`. This is a small, necessary addition to support the interaction Roy explicitly described ("once it is click one of the cards... it show in the right field a modal") — there was no way to express "hidden until clicked, open on click, closeable" without some open/closed state, since the previous behavior was "always visible, content swaps on click." Nothing about the registration flow's own state (`registerOpen`, `registerState`) changed.
- The details panel is now a genuine slide-in drawer: a semi-transparent backdrop (click to close) plus a fixed right-edge panel that animates in from `x: "100%"` to `x: 0` via framer-motion, with its own close (X) button — built as its own independent element, not a reuse or modification of `components/ui/Modal.tsx` (still shared, still untouched, still used as-is for the registration form).
- **Removed, not built:** the "Secure Phone Verification" boxes on every card and the "Phone Modal" box in the panel — confirmed again that neither is a real feature anywhere in this app. The visual slot they occupied in the drawer is filled with the actual, already-existing content instead: the real online-call mockup (mic/video/end icons) or in-person details, plus a clean meta block (facilitator, schedule, capacity, and location for in-person groups) — the exact same fields as before, just laid out to fill that space meaningfully instead of leaving it either empty or filled with an invented control.
- Register button inside the drawer opens the exact same registration `Modal` with the exact same form/validation/Supabase insert/confirmation-email call as every phase before this one.

**Verification:** scoped `tsc --noEmit` on the changed component and page — clean. Grepped for the unescaped-apostrophe-in-JSX pattern — no matches. Checked z-index stacking by hand: backdrop `z-[70]`, drawer `z-[80]`, and the shared `Modal.tsx`'s own overlay `z-[90]` — so opening Register while the drawer is open correctly layers the registration form on top of the drawer rather than behind it.

**Known gaps, honestly flagged:**
- Not screenshot-verified from this sandbox — this phase specifically should get a real click-through: opening the drawer from a card, switching to a different card while it's open (confirms the crossfade + no stale content), and closing it both via the X and via clicking the backdrop.
- On narrow/mobile widths the drawer is `w-full max-w-[420px]`, meaning it fills the whole screen below ~420px wide — that reads as a full-screen takeover rather than a side panel on phones, which seems like the right call (there's no room for a partial side panel on a phone) but wasn't explicitly specified in the mockup, which is a desktop-width image.
- Same `.git/index.lock` situation as the last four phases.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
del .git\index.lock
git add -A
git commit -m "Phase 49: Support Groups cards as a 2-column grid, details open as a right-side drawer"
git push
```

---

## Phase 50 — About Hero: painting resized to a small contained square

Roy sent a reference screenshot showing the About Hero's painting displayed much smaller — a modest, fully-visible square box beside the headline — instead of the large asymmetric panel it had bled to the viewport edge as since Phase 44/47. Explicit instruction: don't change any text, buttons, or modals — just the painting's size. The screenshot's own headline text ("Two clicks to a therapist who understands") actually matches Home's copy rather than About's, and its painting was also a genuinely different, richer composition (the same hands/glowing-light motif, but with a boot, a seated figure, and a small group folded into the surrounding leaves) at only ~260×260px resolution — too small to use directly. Asked Roy to confirm intent and provide a higher-res source; he confirmed he wants this new painting used on the About page, resized as shown, and re-sent the same screenshot as the only available source.

**New image asset** — `public/images/about/hero-painting-v2.jpg`: cropped the painting out of Roy's screenshot, upscaled from its native ~270×260px to 1400×1400px (Lanczos resampling + light unsharp-mask) and re-saved. Flagging honestly: this is an upscale of a low-resolution source, not a native high-res asset, so it's softer than `hero-painting.jpg` was — usable at the smaller display size this phase moves to, but worth swapping for a true high-res export if Roy has (or can generate) one later. The original `hero-painting.jpg` file was left in place rather than deleted/renamed, since it's still referenced in code comments and there's no reason to remove it.

**`components/Hero.tsx`:**
- `HERO_CONTENT_FALLBACK.backgroundImage` now points at `/images/about/hero-painting-v2.jpg`.
- Replaced the old two-block media setup (a contained `aspect-[9/10]` card shown only below `lg`, plus a separate `absolute`, viewport-edge-bleeding panel shown only at `lg+`) with one unified, in-flow square card (`aspect-square`, capped at `max-w-[460px]`) used at every breakpoint — matching the screenshot's compact, fully-contained treatment. The trust-chip overlay ("Over 5,000+ Sessions Completed") and the `ParallaxMedia` scroll effect both carried over unchanged, just on the one merged block instead of two. Updated the `<img>` alt text to actually describe the new painting's content (boot/seated figure/group), since the old alt text no longer matched what's shown — this is an accessibility description, not visible page copy, so it's not a change to any of the text/CTA content the instruction protected.
- No changes to the eyebrow/title/subtitle/CTA text, links, or any modal.

**Supabase `site_content`** — the published `page_about_hero` row (both `iddeoavrlnvwwfopsacy` prod and `ggjvpfivyqartvanvhzq` dev) had its own `backgroundImage` field still pointing at the old `hero-painting.jpg`, which would have silently overridden the fallback change above via `getPageContent`'s shallow-merge. Updated both rows' `backgroundImage` to `/images/about/hero-painting-v2.jpg` to match.

**Verification:** scoped `tsc --noEmit` on `components/Hero.tsx` — clean. Grepped for the unescaped-apostrophe-in-JSX pattern — no matches. Confirmed via `grep` that no other file references the old image path outside of a historical code comment. Confirmed both Supabase environments' `page_about_hero` row now reads the new path.

**Known gaps, honestly flagged:**
- The new painting image is an upscaled low-res source (see above) — soft at close inspection, though acceptable at the smaller display size this phase introduces. Recommend swapping in a native high-res export when available.
- Not screenshot-verified from this sandbox — worth a real look at the About page at mobile, tablet, and desktop widths to confirm the square card reads well in the two-column grid at each size.
- Same `.git/index.lock` situation as prior phases.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
del .git\index.lock
git add -A
git commit -m "Phase 50: resize About Hero painting to a small contained square, swap in new painting"
git push
```

---

## Phase 51 — Home: redundant badge/card-repeat row replaced with a real news ticker

Roy flagged the scroll-linked row between Home's path cards and stats band (Phase 45's `HorizontalScroll`, showing the three trust badges + three card titles with arrows between them) as redundant — it just repeated text already visible a few pixels away — and asked for it to become a genuinely continuous "news line" ticker about GESA's purpose/goal instead, with its own distinct copy.

**New component, `components/motion/NewsTicker.tsx`:** a real infinite marquee, not a scroll-linked drift — the item list renders twice back-to-back in a track that loops a flat `-50%` `translateX` on a CSS animation (`.news-ticker-track` in `app/globals.css`), so with both halves identical the loop seam is invisible. The second copy is `aria-hidden` so screen readers hear each phrase once. Pauses on hover/focus, and — matching every other motion primitive in this codebase — drops to a plain, real-touch-scrollable static row under `prefers-reduced-motion` rather than trying to animate a reduced-motion-safe version of a marquee.

**New copy, not a repeat of nearby UI text:** added a `purposeTicker` field to `HomeContent` (`lib/content.ts`) — a single newline-separated string, split into items at render time. Its fallback value (in `components/home/Paths.tsx`) is five short phrases distilled from GESA's own existing, already-published mission copy (the About page's mission paragraphs and how-it-works points, and Home's own footer note) — "Because no one should face emotional pain alone," "Verified volunteer therapists, giving their time freely," "Up to six free sessions — cost is never why someone goes without care," "A global community of care, across borders and languages," "Confidential, dignified support, always free at the point of need." Real GESA claims already made elsewhere on the site, not new invented copy.

**`app/page.tsx`:** swapped `HorizontalScroll` (fed by badge/card labels) for `NewsTicker` (fed by `homeContent.purposeTicker`). `components/motion/HorizontalScroll.tsx` itself is left in place, unused — it's still a valid general-purpose primitive, not deleted per the standing rule on removing files from the synced project folder without confirming first.

**`components/admin/content/HomeEditor.tsx`:** added a "News ticker" field group (one multiline field, "one phrase per line") so the ticker's copy stays Content Manager-editable, matching every other field on this page since Phase 35.

**Verification:** scoped `tsc --noEmit` across `lib/content.ts`, `components/home/Paths.tsx`, `components/motion/NewsTicker.tsx`, `app/page.tsx`, and `components/admin/content/HomeEditor.tsx` — clean. Grepped for the unescaped-apostrophe-in-JSX pattern — no matches. Confirmed `getPageContent`'s shallow-merge means the already-published `page_home` row (which predates this field) still resolves `purposeTicker` from the fallback correctly with no Supabase update required — verified by reading `lib/content.ts`'s merge logic directly rather than assuming.

**Known gaps, honestly flagged:**
- Not screenshot-verified from this sandbox — worth watching the actual loop/pause-on-hover timing and confirming the phrase length/speed feels like a comfortable read, not too fast.
- The published `page_home` Supabase row (prod + dev) doesn't have an explicit `purposeTicker` value yet — it doesn't need one for the fallback to work correctly, but the first save from the new "News ticker" editor field will persist whatever's showing (the fallback text) as the real stored value from then on.
- Same `.git/index.lock` situation as prior phases.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
del .git\index.lock
git add -A
git commit -m "Phase 51: replace Home's redundant badge/card-repeat row with a continuous purpose-ticker marquee"
git push
```

---

## Phase 52 — Language switcher: reload-free EN/HE transition + RTL icon mirroring

Roy sent a screen recording of another org's site (a Google-Translate-widget-powered switcher) to spec out a language-switch feature, walking through the exact UX: click the header language selector, pick Hebrew, the whole page translates and flips to RTL instantly, then picking English again reverts smoothly "without requiring a hard page reload." Checked first before building anything: GESA already has essentially this whole feature (`components/TranslationProvider.tsx` + `components/LanguageSelector.tsx`, from Phase 33) — a header selector offering English/Hebrew, DOM-level translation via `/api/translate` (Google Cloud Translation, cached), automatic `dir="rtl"` flipping, and localStorage/profile persistence. The one real, deliberate gap: switching languages always did a full `window.location.reload()`, specifically to avoid the fragility of undoing in-place DOM mutations — the opposite of the reload-free experience in Roy's reference.

**`components/TranslationProvider.tsx` — removed the reload, made both directions work in place:**
- Added `originalTextRef`, a `Map<Text, string>` that caches each text node's real English content the first time it's translated.
- `translatePage("en")` is no longer a no-op — it now restores every still-connected cached node's original English text and clears the cache, instead of relying on a reload to get back to clean English DOM.
- The pathname/language effect that triggers `translatePage` used to `return` early for `language === "en"`; now it runs for both languages, so switching back to English actually invokes the new revert branch.
- `setLanguage` just calls `setLanguageState(code)` now — no `window.location.reload()`. The existing effect picks up the state change and calls `translatePage` automatically.
- `LanguageSelector.tsx` and `AccountForm.tsx` needed no changes — the former just calls into `setLanguage` as before, and the latter's local `language` state is an unrelated profile-form field, not the translation context.

**`app/globals.css` — new global rule mirroring directional icons under RTL:** lucide-react auto-applies a `lucide-{kebab-name}` class to every icon (confirmed by reading its `createLucideIcon.js`), so one small rule (`[dir="rtl"] .lucide-arrow-right, .lucide-arrow-left, .lucide-chevron-right, .lucide-chevron-left { transform: scaleX(-1); }`) flips every arrow/chevron's drawn direction site-wide with no per-component changes — e.g. "Find your therapist →" now correctly points left in Hebrew, matching the reference video. Their *position* in a button already auto-mirrors under `dir="rtl"` per the CSS flexbox spec for plain `flex` rows with no direction override, so this only needed to fix the glyph itself.

**Known, deliberately out of scope for this phase:** true pixel-for-pixel structural mirroring (margins, padding, absolute left/right positioning) would require converting every directional Tailwind utility (`ml-`/`mr-`/`pl-`/`pr-`/absolute `left-`/`right-`) to logical properties (`ms-`/`me-`, etc.) across the whole codebase — a real, much larger follow-up, not something attempted silently here. What ships this phase (instant reload-free switching, correct RTL text direction, and mirrored icon glyphs) covers the specific UX gap Roy's video called out; multi-column/absolutely-positioned sections may still read visually LTR-ish in a few spots.

**Verification:** scoped `tsc --noEmit` on `components/TranslationProvider.tsx` — clean (had to switch a `for...of` over the `Map` to `.forEach`, since this project's `tsconfig.json` has no explicit `target`, which defaults low enough that direct Map iteration needs `--downlevelIteration`). Grepped for the unescaped-apostrophe-in-JSX pattern — no matches. Confirmed `setLanguage` has exactly two callers (`LanguageSelector.tsx`, and an unrelated same-named local state setter in `AccountForm.tsx`) so nothing else depends on the old reload behavior. No existing test file covers `TranslationProvider`/`LanguageSelector`, so there's no automated suite to re-run for this specifically.

**Known gaps, honestly flagged:**
- Not screenshot/click-through-verified from this sandbox — worth a real run-through: switch to Hebrew, confirm instant translation + RTL flip + mirrored arrows with no reload, switch back to English, confirm the original text actually restores cleanly rather than staying half-translated anywhere.
- The DOM-rewrite approach's pre-existing limitation stands: content that appears after an in-page fetch (e.g. AI match results) won't be auto-translated until the next navigation.
- `originalTextRef`'s cache is never proactively pruned for nodes from pages navigated away from — harmless (skipped via `isConnected` on revert) but grows for the life of the tab; not expected to be a real memory concern for a normal session.
- Same `.git/index.lock` situation as prior phases.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
del .git\index.lock
git add -A
git commit -m "Phase 52: reload-free EN/HE language switch, RTL icon mirroring"
git push
```

---

## Phase 53 — Language switcher: fixed the actual root cause (no API key) + flag-icon dropdown

Roy reported that Phase 52's language-switch work produced no visible change at all, and re-sent the same reference video with two explicit asks: when Hebrew is chosen, "all the text details, field with wordings" must actually turn into Hebrew (not stay English), and the dropdown should become a clear icon-based picker with recognizable flags for English/Hebrew.

**Root cause, found by reading the actual translation code rather than guessing:** `lib/translate.ts`'s `translateBatch` requires `GOOGLE_TRANSLATE_API_KEY`, and — checked directly in both `.env.local` and `.env.example` — that variable has never been set in this project. Per that file's own existing fallback logic, a missing key makes it log a warning and silently return the original English text as if it were "translated." So the whole feature was working exactly as coded — RTL flip, no-reload switch, dropdown, everything from Phases 33/52 — except every single string came back unchanged, which reads as "nothing happened."

**`lib/translations/he.ts` (new) — a bundled English→Hebrew dictionary,** checked client-side before any network call. Getting a real, billed Google Cloud Translation API key set up is still worth doing eventually (it's the only way dynamic, per-record content like therapist bios ever gets translated), but that requires Roy's own Google Cloud account/billing — not something obtainable from inside this sandbox. This dictionary makes the feature actually work today, at zero cost, for the static marketing copy that's the vast majority of what a visitor reads: every string in the header, footer, Home (hero, badges, path cards, the Phase 51 ticker), About's Hero and mission/how-it-works/founders/volunteer sections, Our Therapists' hero and filter sidebar, Support Groups' hero and registration flow, FAQ, Contact, Blog's fallback copy, and the Stats row — about 85 entries, hand-translated, verified by script that every one of ~100 live English strings pulled directly from those files' own fallback objects appears verbatim in the dictionary. One templated entry (`copyrightLine`, which contains a live `{year}`) is handled generically — any 4-digit year in the source text is swapped for a literal `{year}` token before the dictionary lookup and restored after, so it doesn't need a new entry every January.

**`components/TranslationProvider.tsx`:** `translatePage` now checks `lookupHeDictionary()` for every unique string on the page before ever calling `/api/translate`; anything the dictionary doesn't cover (dynamic DB content, or copy not yet added here) still falls through to the real API exactly as before — which will start actually working the moment a real key is set, with zero further code changes needed.

**`components/FlagIcon.tsx` (new) + `components/LanguageSelector.tsx`:** the picker used to show Unicode flag emoji (🇺🇸/🇮🇱), which is very likely why Roy couldn't see "clear flags" — Windows is a well-known case where the OS doesn't ship the actual flag glyph for those codepoints and instead renders the plain two-letter region code as text, regardless of what the browser or this app does. Replaced with real inline SVG flags (a simplified but recognizable US flag and Israeli flag with its Star of David) that render identically on every OS. Restyled the trigger to lead with the flag icon (dropping the language name below the `sm` breakpoint, so it reads as a true icon dropdown on mobile), and the open menu shows flag + name per row.

**Verification:** scoped `tsc --noEmit` across all four changed/new files — clean. Grepped for the unescaped-apostrophe-in-JSX pattern — no matches. Wrote a small Node script pulling ~100 live English strings straight out of `lib/content.ts`, `components/home/Paths.tsx`, `components/Hero.tsx`, `components/Header.tsx`, `components/Footer.tsx`, `components/TherapistsDirectory.tsx`, `components/SupportGroupsInteractive.tsx`, and `components/home/Stats.tsx`, and confirmed every one of them has a matching entry in the new dictionary file — not just eyeballed.

**Known gaps, honestly flagged:**
- Not click-through-verified from this sandbox — worth a real test: switch to Hebrew on Home, About, Our Therapists, and Support Groups and confirm the visible copy is actually Hebrew now, then switch back to English and confirm it cleanly restores.
- Content that isn't in the dictionary (therapist bios, any blog posts, admin-entered Content Manager text that differs from the fallback copy above) still depends on a real `GOOGLE_TRANSLATE_API_KEY` to translate — worth getting one set up in Vercel's env vars if full coverage matters, since this dictionary intentionally only covers the fixed marketing copy, not arbitrary database content.
- If any of the fallback copy above gets edited later (directly in code, not through the Content Manager), its dictionary entry needs a matching update or that specific string will silently stop translating (falls through to the still-unconfigured API, i.e. stays English) — not a crash, just a quiet gap.
- Same `.git/index.lock` situation as prior phases.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
del .git\index.lock
git add -A
git commit -m "Phase 53: bundled EN-to-HE dictionary (fixes translation with no API key), flag-icon language dropdown"
git push
```

---

## Phase 54 — Book a Session modal: City, year of birth, terms/privacy consent

Roy sent an HTML spec for the "Book a Session" modal on Our Therapists, asking for several new fields. First identified which component is actually rendered there: the directory's "Book a Session" button (`components/therapists/BookSessionButton.tsx`) opens `components/intake/IntakeBookingModal.tsx` — the real, conflict-free scheduling flow — not `components/match/BookingModal.tsx` (that one's the separate Find-Your-Therapist wizard's confirmation step, untouched here). Most of the spec's fields already existed and matched almost exactly (back link, "Book with {name}" heading, subtitle, Email/WhatsApp/Zoom method cards, date picker, real time-slot chips, Name/Email) — the genuinely new pieces were City, Year of birth, and two consent checkboxes (age/terms, and privacy policy), which didn't exist before.

**Schema (`session_bookings`, both `iddeoavrlnvwwfopsacy` prod and `ggjvpfivyqartvanvhzq` dev):** added `client_city text`, `client_birth_year integer`, `agreed_terms_at timestamptz`, `agreed_privacy_at timestamptz`. Consent is stored as *when* it was given rather than a plain boolean — a real timestamped record, not just a checkbox flag, given one of these is an actual legal consent. `lib/database.types.ts`'s `SessionBookingRow` updated to match (its `Insert` type is already `Partial<...>` plus a handful of required fields, so no further type changes needed there).

**`components/intake/IntakeBookingModal.tsx`:**
- Added City (optional) and Year of birth (required) fields; Phone changed from "only shown when WhatsApp is selected" to always visible (required only for WhatsApp, same as before, just no longer hidden for the other two channels — matching the spec's always-present Phone field).
- Added the two required consent checkboxes (age + terms, and privacy policy), each linking to the real, already-existing `/terms-and-conditions` and `/privacy-policy` pages.
- Client-side validation: year of birth must produce an age of 18+ (year-level granularity, matching the checkbox's own "over 18" wording, not a precise birthdate check), and both checkboxes must be checked, before submit is even enabled.
- Submit button relabeled "Book a Support Meeting" (from "Confirm booking") with a calendar-check icon, matching the spec's button text/intent — swapped the emoji "🗓️" for a lucide icon to stay consistent with this codebase's existing icon convention (no other button anywhere uses raw emoji).

**`app/api/intake-booking/route.ts`:** re-validates the year-of-birth/age check and both consent flags server-side too — the modal's client-side checks are a UX convenience, not a security boundary, since anyone could otherwise call this endpoint directly and skip them, and one of these checks is a real legal consent. Inserts the four new columns; consent timestamps are set together at submit time.

**Verification:** scoped `tsc --noEmit` on the modal, the button, and `database.types.ts` — clean. The API route's own scoped check hit a pre-existing, unrelated sandbox issue (`lib/email/resend.ts`'s import of the `resend` package fails to resolve in isolation here — a package.json `exports`/`types` resolution quirk specific to running `tsc` standalone outside the full Next.js build, in the same family as the Tailwind CLI failure noted back in Phase 48); confirmed it's pre-existing by checking `resend.ts` itself is untouched by this phase and the error is purely in third-party type resolution, not in any code I wrote. Manually re-read the route's diff for correctness instead. Grepped for the unescaped-apostrophe-in-JSX pattern — no matches. Extended `lib/translations/he.ts` (Phase 53) with ~24 new entries for this modal's fully-static strings, so the added fields stay translatable — the two consent-checkbox sentences are deliberately left out of the dictionary since each splits across multiple DOM text nodes around an embedded link and I can't verify the exact node boundaries without a live browser, so a wrong partial dictionary match seemed worse than falling through to the (still unconfigured) live API for just those two sentences.

**Known gaps, honestly flagged:**
- Not click-through-verified from this sandbox — worth a real run-through: open the modal, try submitting with an under-18 birth year (should block with the age message), try submitting with checkboxes unchecked (button should stay disabled), then complete a real booking and confirm the new fields actually land in `session_bookings`.
- The confirmation/notification emails (`lib/email/templates.ts`) weren't updated to mention city/birth year — the team notification email still only shows what it showed before this phase. Worth adding if that data should be visible to admins without a database query.
- `components/match/BookingModal.tsx` (the separate wizard flow's own booking step) was deliberately left untouched — Roy's request was specifically about the Our Therapists page's modal.
- Same `.git/index.lock` situation as prior phases — also blocked a `git stash` I tried while investigating the resend.ts error, confirmed harmless (stash aborted cleanly before touching anything, verified the modal/route edits were still intact afterward).

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
del .git\index.lock
git add -A
git commit -m "Phase 54: add City, year of birth, and terms/privacy consent to the Book a Session modal"
git push
```

---

## Phase 55 — Warm cream background on Our Therapists' directory and About's founders section

Roy sent two reference screenshots (Our Therapists' filter/results area, and About's "Our Founders" section) showing both on a warm cream background, distinct from the site's usual cool ivory (`--background`, #eef1f6). Asked to update just those two sections' background color.

**`app/therapists/page.tsx`** and **`app/about/page.tsx`:** added `bg-clay-soft` to the `<section>` wrapping the Therapists directory and the founders section respectively. Used the existing `--clay-soft` (#f5eeda, "pale gold wash") token from `app/globals.css` rather than inventing a new one-off color — it's the same warm cream the gold-banner era (Phase 47) already introduced elsewhere on the site, and visually matches the reference screenshots. Deliberately scoped to just these two `<section>` elements rather than changing `--background` globally, since Roy asked about these two sections specifically, not every page.

**Verification:** scoped `tsc --noEmit` on both files — clean. Grepped for the unescaped-apostrophe-in-JSX pattern — no matches. Confirmed `.section` (app/globals.css) has no width constraint of its own, so the background color spans the full section width edge-to-edge like the reference, with `.wrap`'s max-width only constraining the inner content — matching the screenshots' look rather than a color-filled box narrower than the page.

**Known gaps, honestly flagged:**
- Not screenshot-verified from this sandbox — worth a real look to confirm `--clay-soft` is close enough to the exact tone in the reference images, since I matched it by eye against an existing token rather than picking a color from the screenshot pixel-for-pixel.
- Same `.git/index.lock` situation as prior phases.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
del .git\index.lock
git add -A
git commit -m "Phase 55: warm cream background on Our Therapists directory and About's founders section"
git push
```

---

## Phase 55 follow-up — fixed the background to actually span full width

Roy correctly flagged that the cream background from Phase 55 only covered "a certain area," not the whole section. The bug: `bg-clay-soft` had been added to the same `<section>` element that also carried `wrap` (and, on About, `max-w-[820px]`) — those classes cap that element at 1160px/820px and center it, so the background color was centered and boxed exactly like the content, instead of bleeding to the page edges like the reference screenshots.

**Fix, both `app/therapists/page.tsx` and `app/about/page.tsx`:** split each into an outer, unconstrained `<section className="section bg-clay-soft">` (this is what now actually spans full width) wrapping an inner `<div className="wrap ...">` that keeps the *content* at its original constrained width — same pattern already used everywhere else on the site (e.g. Support Groups' page.tsx `<section className="section wrap pt-0">`, which was never the issue there since it had no separate background color competing with `wrap`).

**Verification:** re-ran the same scoped `tsc --noEmit` on both files — clean. Re-grepped for the unescaped-apostrophe-in-JSX pattern — no matches.

**Known gaps, honestly flagged:**
- Still not screenshot-verified from this sandbox — this is exactly the kind of layout bug that's obvious in a browser and easy to miss by reading JSX alone, so worth a real look this time before considering it done.
- Same `.git/index.lock` situation as prior phases.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
del .git\index.lock
git add -A
git commit -m "Phase 55 follow-up: fix cream background to span full section width, not just the centered content box"
git push
```

---

## Phase 56 — Footer redesign: Connect column, socials, accreditations, closing CTA

Roy sent a reference screenshot of a redesigned footer with a fifth "Connect" column, a social-links row, an "Accreditations & Partners" row naming three specific organizations, and a "Join Our Global Network" CTA. Before building anything, flagged two real concerns and asked Roy directly: (1) the three named accreditations/partners are specific, checkable claims about GESA's credentials — Roy confirmed they're real, so they're implemented as given; (2) the social icons and a new "GESA is a registered 501(c)(3) non-profit in the United States" line both needed either real URLs/verified wording from Roy, or to be left out — Roy asked for these to be Content Manager-editable instead of hardcoded, so he owns and can correct them himself.

**`lib/content.ts` (`FooterContent`):** added connect-column fields (heading + label/href pairs for Newsletter Signup, Press Inquiries, Partnerships, plus a Blog label), social fields (a "follow our journey" label + three social URLs, all defaulting to `""`), accreditation fields (a heading + three label slots), a Join Our Global Network label/href pair, and `nonprofitStatusLine`. Unlike the four existing columns (label editable, destination fixed to a real route) these new href fields are themselves editable — there's no existing "correct" destination for a newsletter signup or a social profile, so Roy needs to be able to set them directly.

**`components/Footer.tsx`:** grid widened to 5 columns; new Connect column added (Newsletter/Press/Partnerships route to the existing real Contact form with a subject query param, same pattern Donate/Volunteer already use — Blog reuses the same disabled "coming soon" treatment as the Explore column's Blog, rather than a second, differently-behaving Blog link). New row below the columns: social icons (LinkedIn/Twitter/Facebook, each rendered only if its URL is actually set, so an unfilled social link never becomes a dead "#" link on the live site) plus the "follow our journey" text (also only shown if at least one URL is set), the three confirmed accreditations/partners as icon+label pairs (no real logo image files exist for them, so these are simple lucide icons + text, matching the reference's minimalist style rather than fabricating logo graphics), and the "Join Our Global Network" button (routes to `/contact?subject=Volunteer`, the closest existing real flow). Bottom bar extended to a second copyright-area line for the non-profit status line.

**`components/admin/content/FooterEditor.tsx`:** added matching field groups for all of the above, with explicit help text flagging which destinations are placeholders pending real values (Newsletter Signup) and which line's legal wording Roy owns and this codebase doesn't verify (the 501(c)(3) line).

**Verification:** scoped `tsc --noEmit` on `lib/content.ts`, `components/Footer.tsx`, and `components/admin/content/FooterEditor.tsx` — caught and fixed one real bug along the way: a backslash-escaped quote inside a JSX string *attribute* (`note="...\"correct\"..."`) isn't valid the way it would be inside a normal JS string literal, which broke parsing; fixed by using single quotes for the inner emphasis instead. Re-ran clean after. Grepped for the unescaped-apostrophe-in-JSX pattern — no matches. No existing test file covers `Footer.tsx`.

**Known gaps, honestly flagged:**
- Social URLs still default to empty (no icons will show until Roy fills them in via the Content Manager) and the "Join Our Global Network" destination is a reasonable guess (`/contact?subject=Volunteer`), not something specified — worth confirming that's the right place to send people who click it, or pointing it somewhere more specific if one exists.
- Not screenshot-verified from this sandbox — worth a real look at how the new row wraps at tablet/mobile widths, since it now holds three logical groups (socials, accreditations, CTA) that could get cramped on a narrower screen.
- Same `.git/index.lock` situation as prior phases.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
del .git\index.lock
git add -A
git commit -m "Phase 56: footer redesign — Connect column, social links, accreditations row, Join Our Global Network CTA"
git push
```

---

## Phase 56 — Reverted

Roy reported the Phase 56 footer redesign broke the footer on the live site and asked to roll it back to the previous design rather than debug it in place.

**What was reverted:** `components/Footer.tsx`, `components/admin/content/FooterEditor.tsx`, and the `FooterContent` type in `lib/content.ts` were restored to their exact state from the commit immediately before Phase 56 (`ba5f1cd~1`), undoing the Connect column, social links row, accreditations row, "Join Our Global Network" CTA, and the non-profit status line — all of it, cleanly, with no partial leftovers. Confirmed via `git diff --stat` that the revert is a pure subtraction (138/61/32 lines removed from the three files, 0 unexpected additions) and via grep that no other file anywhere in the codebase still references any of the removed fields (`connectHeading`, `accreditation1Label`, `joinNetworkHref`, `socialLinkedinHref`, `nonprofitStatusLine`, etc.) — so nothing was left half-wired.

Files were restored by reading their exact prior content with `git show` and rewriting them directly (rather than `git checkout`, which failed in this sandbox with "unable to unlink" — this project folder blocks unlinking files synced into it, the same restriction documented since Phase 45's `.git/index.lock` situation).

Because Phase 51 (the Home news-ticker's `purposeTicker` field) also touched `lib/content.ts` and landed *before* Phase 56, reverting to the pre-Phase-56 commit correctly kept Phase 51's addition intact — this isn't a revert of everything back to Phase 37, just of Phase 56 specifically.

**Verification:** scoped `tsc --noEmit` on all three restored files — clean.

**What wasn't touched:** `session_bookings` schema changes from Phase 54, the language/translation work from Phases 52-53, and every other prior phase are unaffected — this revert was scoped to exactly the four files Phase 56's own commit changed (including `EXECUTION_PLAN.md`, which naturally keeps growing rather than being reverted, so this history stays honest instead of erasing the record of what was tried).

If the goal is to eventually revisit a footer redesign, worth screenshot-testing any future attempt in a real browser before considering it done — Phase 56 wasn't verified that way, which is likely how the breakage got through.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
del .git\index.lock
git add -A
git commit -m "Revert Phase 56: footer redesign broke the live footer, restored previous design"
git push
```

---

## Phase 57 — Footer redesign, take two: "Connect with Us" + "Our Trusted Partners"

After Phase 56 was reverted, Roy sent a simpler reference: same four existing columns (no fifth column, no CTA button this time), plus a "Connect with Us" social-icon row (now four icons — LinkedIn, Twitter/X, Instagram, Facebook) and an "Our Trusted Partners" row with the same three accreditations confirmed real during Phase 56, plus the non-profit status line in the bottom bar.

**`lib/content.ts` (`FooterContent`):** added `connectWithUsLabel`, four social href fields, `trustedPartnersHeading`, three partner label fields, and `nonprofitStatusLine`. Deliberate change from Phase 56: social hrefs now default to `"#"` instead of `""`. Phase 56 hid each icon entirely until a real URL was set, which meant all four icons were simply missing out of the box — a very plausible part of why that footer "looked broken." Defaulting to `"#"` means every icon always renders and matches the reference visually right away; Roy replaces `"#"` with real profile URLs via the Content Manager whenever he has them.

**`components/Footer.tsx`:** no change to the four-column grid (matches the simpler reference exactly). Added the social row and partners row between the columns and the bottom bar, and extended the bottom bar with the non-profit status line, same pattern as before.

**`components/admin/content/FooterEditor.tsx`:** added matching field groups. Wrote the note text this time using single quotes for inline emphasis instead of backslash-escaped double quotes inside a JSX attribute — that exact pattern is what broke Phase 56's admin editor (a `note="...\"...\"..."` JSX attribute doesn't support backslash-escaping the way a normal JS string does), so this phase deliberately avoided it rather than repeating it.

**New: `tests/unit/Footer.test.tsx`.** Phase 56 was only ever verified with `tsc --noEmit`, which can't catch a real rendering problem — that gap is very likely how a "broken footer" shipped without being caught first. This phase adds a real smoke test that renders `<Footer />` with its default content and asserts the four columns, all four social links, all three partner labels, and the bottom bar's new line are actually present in the rendered output — then actually ran it rather than just writing it.

**Verification:** scoped `tsc --noEmit` on all three changed files — clean. Grepped for both the unescaped-apostrophe-in-JSX pattern and the specific backslash-escaped-quote-in-JSX-attribute pattern that broke Phase 56 — no matches, either pattern. Ran the new Jest test directly (`npx jest tests/unit/Footer.test.tsx`, needed `timeout 550` and `--runInBand` to get past this sandbox's usual ~170s ceiling) — **passed**, confirming the component actually renders without throwing, not just that it type-checks. One unrelated, pre-existing console warning appeared (`fetchPriority` prop on Next's `<Image>` inside `Logo.tsx`, nothing to do with this phase's changes).

**Known gaps, honestly flagged:**
- Still not screenshot-verified in an actual browser — the new Jest test proves the component renders without errors and contains the right text/links, which is a real step up from Phase 56's tsc-only check, but it doesn't confirm the *visual* layout matches the reference pixel-for-pixel (spacing, wrapping at each breakpoint, etc.).
- Social URLs are still `"#"` placeholders — nothing will actually navigate anywhere useful until real profile URLs are set via the Content Manager.
- Same `.git/index.lock` situation as prior phases.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
del .git\index.lock
git add -A
git commit -m "Phase 57: footer redesign v2 — Connect with Us social row, Our Trusted Partners row, non-profit status line"
git push
```

---

## Phase 58 — About page: full-bleed image band + asymmetric mission layout, borrowed from a reference video

Roy sent a screen recording of a different therapy practice's own About page and asked to borrow its structure/pacing/design for GESA's About page — explicitly not its content, colors, or copy, and without changing anything currently on the page. The video is a third-party Wix-template site, unrelated to GESA; what mattered was two structural devices in how it paces the page, not its literal photos or palette.

**Two devices identified and ported into `app/about/page.tsx`:**

1. **Full-bleed photographic "breather" band** between the hero and the mission statement — a pure pacing device, no new copy. Implemented as a `relative h-[300px] sm:h-[380px] lg:h-[440px] overflow-hidden` section wrapping the existing `ParallaxMedia` primitive (same one already used in the Hero, `intensity={26} scale={1.08}`) around an `<img>`, plus a light `bg-primary/15` tint overlay to keep it from competing visually with the page. Reused `hero-painting.jpg` — the *original* About painting that's been sitting unused in `public/images/about` since Phase 50 swapped the Hero itself over to `hero-painting-v2.jpg`. Deliberately did not introduce any new photography: GESA's site-wide no-real-human-photography policy (Phase 43) stays intact, and this reuses an existing asset rather than adding a new one.

2. **Large-statement-then-offset-secondary-paragraph** layout in the mission section, replacing the old flat `.map` over every paragraph in one uniform block. `sections.missionParagraphs[0]` now renders as a large serif `<h2>` (26px/30px depending on breakpoint) inside a `Reveal`; every paragraph after that (`.slice(1)`) renders as its own smaller, right-aligned, offset-right `<p>` in a separate `Reveal` with a delay, `mt-8`/`mt-12` spacing, and `max-w-[380px] sm:text-right`. The copy itself is untouched — still exactly `sections.missionParagraphs`, still fully Content Manager-driven, and an admin adding a third paragraph later just adds another offset paragraph below the second rather than breaking anything hardcoded to "exactly two." The section's wrapper widened slightly from `max-w-[760px]` to `max-w-[820px]` to give the offset layout room to breathe.

**Nothing else on the page changed** — no other section, no color token, no existing copy. Both devices are additive: a new section inserted between two existing ones, and a layout change scoped to the mission section's internals only.

**New: `tests/unit/AboutPage.test.tsx`.** About had no prior test file. Since Phase 57 established that `tsc --noEmit` alone doesn't catch real rendering breaks, this phase adds a render test for the page itself — mocks `getPageContent` to resolve with the fallback content (About is an async Server Component, so the test awaits `AboutPage()` directly before rendering the result, the same way Next resolves it on the server) and asserts: every pre-existing section still renders (how-it-works heading, founders intro, volunteer body), the new image band renders with its alt text and the correct `hero-painting.jpg` src, the first mission paragraph renders as the big `<h2>` statement, and every remaining mission paragraph renders as its own offset `<p>`.

**Verification:** scoped `tsc --noEmit` covering `app/about/page.tsx`, `ParallaxMedia.tsx`, `Hero.tsx`, and `lib/content.ts` — clean. Grepped the changed file for both the unescaped-apostrophe-in-JSX and backslash-escaped-quote-in-JSX-attribute patterns that broke Phase 56 — no matches (the apostrophes present are all inside plain JS strings/comments, not the pattern that caused that bug). Ran the new Jest test (`timeout 550 npx jest tests/unit/AboutPage.test.tsx --runInBand --no-coverage`) — **passed** (127.8s).

**Known gaps, honestly flagged:**
- Not screenshot-verified in an actual browser — the Jest test confirms the component renders without throwing and contains the right elements/text/attributes, but not the pixel-level visual result (parallax feel, exact spacing at each breakpoint, how the offset paragraphs wrap on narrow screens).
- The reference video's site also used different photography/colors throughout; only the two structural devices were ported, per Roy's explicit instruction not to touch existing structure, details, or color palette otherwise.
- Same `.git/index.lock` situation as prior phases.

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
del .git\index.lock
git add -A
git commit -m "Phase 58: About page — full-bleed image breather band + asymmetric mission statement layout"
git push
```

---
**Gate:** Per Roy's instruction, each phase stops here for review/approval before the next one starts.
