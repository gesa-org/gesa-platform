[LOGO: VentVest — see note below]

# GESA Platform
## Technical Specification & System Documentation

**Prepared by VentVest for Roy**
**Version 3.0 — September 2026**
**Document Control: v3.0 — Confidential — Prepared for internal handoff and QA test planning**

> **Logo/formatting note for whoever renders this into the final PDF/DOCX:** this revision was produced with the project's sandboxed build shell unreachable (a standing Windows-update mount issue affecting this session — see EXECUTION_PLAN.md), which blocks the usual LaTeX/pandoc pipeline used for the earlier "Professional" PDF (`GESA_Platform_Technical_Specification_Professional.pdf`, v1.7). That v1.7 file already has the correct page shell to reuse: VentVest logo centered on the title page, a running header with the VentVest wordmark (top-left) and "GESA Platform — Technical Specification" (top-right) on every page, and the Document Control — Version History table format below. **The fastest path to a finished PDF:** take v1.7's title page and header/footer shell as-is, replace everything from "Document Control — Version History" onward with this document's content, and update the version-history table with the entry below. I'll do this myself as soon as the build shell is reachable again in a future session.

---

## Document Control — Version History

| Version | Date | Author | Reviewer / Approver | Description |
|---|---|---|---|---|
| 1.0 | 2026-08-29 | R. Rapada | J. Buena | Initial technical specification: tech stack, architecture, database schema, email system, public site pages, admin CRM, content management, design system, and environment/deployment notes. |
| 1.1 | 2026-08-29 | R. Rapada | J. Buena | Rebranded as a professional handoff document — VentVest logo added to the cover page and to a running header on every page, document-control line added to the title page. |
| 1.2 | 2026-08-29 | R. Rapada | J. Buena | Added Functional Requirements, Client Workflow, and Therapist Workflow sections. |
| 1.3 | 2026-08-30 | R. Rapada | J. Buena | Added QA & Testing Reference section — form validation rules, button/CTA inventory, navigation reference, error/empty states, and suggested test scenarios. |
| 1.4 | 2026-08-30 | R. Rapada | J. Buena | Corrected duplicate section numbering throughout; renamed the table of contents to "Tables of Version". |
| 1.5 | 2026-08-30 | R. Rapada | J. Buena | Added this Document Control — Version History page. |
| 1.6 | 2026-08-30 | R. Rapada | J. Buena | Restyled the version-history table with corporate header/row formatting for a cleaner, more professional presentation. |
| 1.7 | 2026-08-30 | R. Rapada | J. Buena | Moved this page to start on page 2 (title page now stands alone); set Author/Reviewer to R. Rapada / J. Buena; switched document font to Arial. |
| 2.0 | 2026-09-14 | Claude (Cowork) | Roy | Full content revision covering every phase from 88 through 199 — architecture, RLS/security, schema, email, every public page, the 15-section admin CRM, CMS + new UI Builder, design system, environment variables, FR-1 through FR-79, client/therapist workflows, and two new QA-focused sections (Known Issues/Reverted Work, Mobile Responsiveness Status). Delivered as Markdown — build shell unreachable, so PDF/DOCX rendering was deferred. |
| 3.0 | 2026-09-14 | Claude (Cowork) | Roy | Re-requested by Roy with the original v1.0 PDF as a formatting reference. Added this Document Control — Version History section and the formatting note above so the content is ready to drop into the existing "Professional" page shell (logo, running header, version table) the moment the build shell is reachable to actually render it. Content unchanged from v2.0 below — still current through Phase 199. |

**How to use this document if you are QA:** Section 13 ("Known Issues, Regressions & Work That Was Reverted") and Section 14 ("Mobile Responsiveness Status") are written specifically for you — they list what to test, what NOT to expect (reverted/abandoned designs), and disclosed gaps that are not bugs. Section 10 (Functional Requirements) is numbered FR-1 through FR-79 and is the closest thing to a test-case index.

---

## Table of Contents

1. Overview
2. Tech Stack & Architecture
3. Database Schema
4. Email System
5. Public Website — Pages & Features
6. Admin CRM Dashboard
7. Content Management System
8. Design System
9. Environment Variables & Deployment Notes
10. Functional Requirements
11. Client Workflow
12. Therapist Workflow
13. Known Issues, Regressions & Work That Was Reverted (QA focus)
14. Mobile Responsiveness Status (Phase 199, in progress)
15. Appendix — Open Items for Handoff

---

## 1. Overview

GESA (Global Emotional Support Alliance) is a nonprofit platform connecting people in need of emotional support with a global network of volunteer therapists, at no cost to the client for most pathways. The platform now consists of a public marketing/intake site, a **donation/payments track** (Mollie for donations, PayPal for paid Professional Services bookings), a set of client-facing tools (accounts, real-time chat, two distinct booking mechanisms), a **read-only therapist self-service dashboard**, an **invitation-only onboarding system** for therapist and admin accounts, and an internal CRM/admin dashboard with 15 sections, including a visual page-content/design-token editor ("UI Builder").

**Stack at a glance:** Next.js 14.2.3 (App Router, TypeScript) on Vercel, Supabase (Postgres, Auth, Storage, Realtime) as the backend, Resend for transactional email, Mollie for donations, PayPal Orders v2 for paid bookings, and an optional Anthropic-powered AI matching engine with a deterministic rule-based fallback.

**Repository conventions (unchanged):** all work is tracked as sequential numbered "Phases" in `EXECUTION_PLAN.md`, each ending with a review gate before the next begins. The codebase favors editing existing files over deleting them — deprecated components/fields are commented as unused rather than removed. **As of this revision there is no committed migration history after `0001_init.sql`** — every schema change since Phase ~126 was applied directly to the Production Supabase project via the Supabase MCP tool, not via a migration file. This is a deliberate but undocumented-until-now process choice; see §15.

**What has materially changed since v1.0 (headline items — detail in the sections below):**
- Therapists **now have** a self-service login and a read-only dashboard at `/therapist` (v1.0 said this did not exist).
- Therapist and admin accounts can **only** be created via a single-use invitation (Phase 187) — public signup produces client accounts only.
- A real donations payment flow (Mollie) and a paid "Professional Services" booking flow (PayPal) now exist.
- The "Find Your Therapist" experience was rebuilt three times and now lives behind a modal launched from `/find-your-therapist` (which now renders what used to be the About page's content — see §5).
- A visual design-token and page-content editor ("UI Builder") was added as a fourth content-editing surface alongside the existing Content Manager.
- Two real, disclosed security vulnerabilities (role self-escalation) were found and fixed in Production.
- A site-wide hydration failure that made the entire site non-interactive for any visitor with "reduce motion" enabled was found and fixed.
- A mobile-responsiveness audit and fix pass is underway (Phase 199) but far from complete — see §14.

---

## 2. Tech Stack & Architecture

### 2.1 Core Dependencies

| Category | Library | Version | Status |
|---|---|---|---|
| Framework | Next.js | 14.2.3 (App Router, TypeScript) | unchanged |
| UI | React / React DOM | ^18 | unchanged |
| Backend / DB / Auth | @supabase/supabase-js | ^2.42.0 | unchanged |
| Backend / DB / Auth | @supabase/ssr | ^0.12.4 | unchanged |
| Styling | Tailwind CSS | ^3.4.1 | unchanged, new `xs: 400px` breakpoint (Phase 199) |
| Animation | Framer Motion | ^11.18.2 | unchanged, reduced-motion bug fixed (Phase 176) |
| Icons | lucide-react | ^0.370.0 | unchanged |
| Email | Resend | ^3.2.0 | unchanged |
| Validation | Zod | ^3.23.8 | unchanged |
| AI matching | @anthropic-ai/sdk | ^0.32.1 | unchanged (falls back to rule-based scorer if unset) |
| Phone parsing | **libphonenumber-js** | ^1.13.12 | **new (Phase 125)** — E.164 validation/formatting, country detection |
| Donations payments | **@mollie/api-client** | latest | **new (Phase 99)** |
| Rich text editing | **@tiptap/react + starter-kit + pm + extension-underline/-link/-text-align/-placeholder/-text-style** | latest | **new (Phase 134/136)** — admin Page Content editor only, lazy-loaded, never in the public bundle |
| HTML sanitization | **sanitize-html + @types/sanitize-html** | latest | **new (Phase 134)** |
| Payments (paid bookings) | **PayPal Orders v2 REST** | — | **new (Phase 196)** — hand-rolled client in `lib/payments/paypal.ts`, no SDK dependency |
| Language | TypeScript | ^5 | unchanged |
| Unit testing | Jest ^29.7, Testing Library ^16 | — | unchanged |
| E2E testing | Playwright | ^1.48.0 | unchanged |
| Runtime | Node.js | >= 20 | unchanged |

**Dependency incident worth documenting for future work:** `sanitize-html`'s `htmlparser2` dependency turned out to be pure ESM and caused a runtime 500 the first time it was added. Since Phase 136, every new dependency is checked for a dual `import`/`require` exports map before adoption — this is why four Tiptap text-styling extensions were hand-written (`components/admin/ui-builder/richTextFontExtensions.ts`) instead of adding the equivalent official `@tiptap` packages.

**Evaluated and explicitly rejected:** `react-i18next` / `next-intl` (Phase 116) — the site still uses a DOM-rewrite `TranslationProvider` rather than a real i18n library.

NPM scripts unchanged: `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `test` (Jest), `test:e2e` (Playwright), `db:types`.

### 2.2 Deployment Topology

Unchanged in shape, but with an important caveat: two Supabase projects exist (`iddeoavrlnvwwfopsacy` Production, `ggjvpfivyqartvanvhzq` "gesa-dev"), and **the dev project is missing three tables that live API routes depend on** (`diary_scheduling_events`, `booking_intake_forms`, `crm_ui_drafts`). This was flagged in Phase 142 and never resolved. QA testing against a Preview/Dev deployment for any diary-link booking, PayPal booking, or UI Builder feature will fail for schema reasons, not application-logic reasons — test those flows against Production data patterns or expect them to be broken in Preview.

No `vercel.json` is committed; all configuration remains in Vercel's dashboard-level environment variables.

### 2.3 Authentication Architecture

The four-client model (browser, server, admin/service-role, session-refresh middleware) is unchanged in shape. What changed:

- **`middleware.ts` performs no role gating** — confirmed in code. It only refreshes the Supabase session cookie. All authorization is enforced per-route/per-layout server guards plus Postgres RLS, never in middleware.
- **New guards in `lib/auth/`:**
  - `requireTherapist.ts` (Phase 127) — signed-out → `/login?next=/therapist`; wrong role → `/`; returns `null` (not a redirect) when a `therapist`-role account has no linked `therapists` row, so the dashboard can show a friendly "not linked yet" message instead of crashing.
  - `requireSuperAdmin.ts` (Phase 187) — non-`super_admin` → redirect to `/admin`.
  - `requireAdmin.ts` — now accepts `admin` **or** `super_admin`.
  - `passwordPolicy.ts` (Phase 175) — 12+ characters, upper/lower/number/symbol, plus a hardcoded compromised-password backstop list.
  - `authErrors.ts` (Phase 175) — maps raw Supabase Auth errors to safe, non-leaky user-facing copy.

**Roles (`AppRole`) — the enum grew.** Was `admin | reviewer | therapist | client | finance`. **Now:** `admin | reviewer | therapist | client | finance | super_admin` (Phase 187). A new `InvitedRole` type (`therapist | admin | super_admin`) names the three roles that can only be obtained via an accepted invitation — see §2.4 item 2 and §5's Administrators/Invitations sections.

**Public signup can no longer produce a therapist or admin account.** `handle_new_user()` was rewritten three times (Phases 178, 179, 187) and now always assigns `role: 'client'` regardless of any metadata passed at signup.

### 2.4 Row-Level Security Pattern

The five-point pattern from v1.0 (public insert / no public read / admin+reviewer read / admin-only update / narrower therapist-read) is still the general shape, but it now has real, disclosed exceptions and two fixed vulnerabilities that QA should specifically regression-test:

1. **`support_requests` (Find Support submissions, Phase 142) has ZERO RLS policies at all, by design.** It contains an open-text "how are you feeling" field. It is service-role-only end to end — the CRM reads it through `getAllSupportRequests()` using the admin client, the notification bell reads it through a dedicated server route (`/api/admin/support-requests/notifications`), and the therapist dashboard reads it through the service-role client rather than the cookie client. A direct browser query against this table, by design, returns nothing for anyone.
2. **`booking_intake_forms` (Phase 128) has RLS enabled with no public INSERT/UPDATE policy** — all writes go through `/api/booking-intake` using the service-role client.
3. **Fixed vulnerability — role self-escalation via signup metadata (Phase 178).** `handle_new_user()` used to read `raw_user_meta_data->>'role'` and trust it; anyone calling the Supabase Auth REST API directly with the public anon key could pass `data: { role: "admin" }` and be granted admin on account creation. **QA must verify:** attempting this today results in a `client` role, never anything else.
4. **Fixed vulnerability — role self-escalation via `profiles` self-update RLS (Phase 187).** The `profiles_self_update` policy had `USING (id = auth.uid())` with no `WITH CHECK`, so any signed-in client could run `update profiles set role='admin' where id = auth.uid()` directly against Supabase and succeed. Fixed by a new trigger, `protect_profile_role_column()`, which reverts any `role` change made by a caller who is not the service-role client or an existing `admin`/`super_admin`. **QA must verify:** the same update attempt today is rejected/reverted.
5. **Therapist contact-info confidentiality (Phase 126).** `contact_email`/`contact_phone` are revoked from the `anon` role at the column level on the base `therapists` table; a new `therapists_public` view (used by every public read path) excludes both columns and adds a derived `has_whatsapp` boolean instead. A new `get_therapist_contact(p_therapist_id)` `SECURITY DEFINER` RPC is the only path for an admin or the therapist themself to read the real values. **A real, live leak was found and fixed as part of this work:** `/api/match` had been returning `contact_phone` in its JSON response to every wizard visitor. **Known remaining gap, still open:** the column-level revoke was only applied to the `anon` role — a signed-in `authenticated` therapist account can still `select *` on the base `therapists` table and read another therapist's contact information. Flag this to Roy; it has not been fixed as of Phase 199.
6. **`therapists` gained column-level write protection (Phase 178, extended Phase 186).** A trigger, `protect_therapist_sensitive_fields()`, silently reverts any non-admin write to `is_verified`, `is_active`, `verified_at`, `verified_by`, `profile_id`, `contact_email`; extended in Phase 186 to also cover `INSERT`, `profile_status`, and `volunteer_application_id`, and to hard-reject an `INSERT`/`UPDATE` that points `volunteer_application_id` at an application that is not `approved`. `is_active` is now a **derived mirror** of `profile_status`, maintained entirely by trigger — writing to `is_active` directly will be silently reverted to whatever `profile_status` implies.
7. **`gesa_admin_audit_log` RLS tightened (Phase 186)** — previously wide open; now admin-only INSERT, admin/reviewer SELECT, and no UPDATE or DELETE policy at all (the log is immutable by design).
8. **A protective trigger prevents removing the last Super Admin** — `protect_last_super_admin()` (Phase 187) raises an exception if a role change or account deactivation would leave zero `super_admin` rows in the system.
9. **`SECURITY DEFINER` functions that should never be called directly were locked down** — several trigger-only functions had `execute` revoked from `anon`/`authenticated` after being found auto-exposed as callable PostgREST RPC endpoints (Phases 178, 179, 187).

The application-level `requireAdmin()`/`requireTherapist()`/`requireSuperAdmin()` guards remain explicitly documented as defense-in-depth on top of these database policies, never a substitute for them.

### 2.5 Database Functions (RPC)

All five functions from v1.0 (`auth_role()`, `get_or_create_my_client()`, `get_or_create_thread()`, `get_booked_slots()`, `handle_new_user()`) are still present. New:

| Function | Phase | Purpose |
|---|---|---|
| `get_therapist_contact(p_therapist_id)` | 126 | `SECURITY DEFINER` — the only path for an admin or the therapist's own linked account to read real `contact_email`/`contact_phone` |
| `protect_therapist_sensitive_fields()` | 178, rewritten 186 | Trigger — see §2.4 item 6 |
| `protect_profile_role_column()` | 187 | Trigger — see §2.4 item 4 |
| `protect_last_super_admin()` | 187 | Trigger — see §2.4 item 8 |
| `set_session_booking_client_profile_id_trigger()` | 179 | `BEFORE INSERT` on `session_bookings` — sets `client_profile_id` from `auth.uid()` server-side; never accepts it from client input |

---

## 3. Database Schema

Source of truth remains `lib/database.types.ts` (regenerated via `npm run db:types`), schema `public`. Everything in v1.0's schema tables is still present and largely unchanged in shape except where noted.

### 3.1 New tables (since v1.0)

| Table | Phase(s) | Notes |
|---|---|---|
| `donations` | 98, 99 | `full_name, email, phone, frequency(once\|monthly), amount, amount_choice, message, created_at`, plus (Phase 99) `status` (Mollie `PaymentStatus` enum), `currency`, `mollie_payment_id`, `mollie_customer_id`, `mollie_subscription_id`, `paid_at`. RLS: public insert, admin/reviewer read. |
| `diary_scheduling_events` | 126, 128, 129, 151, 196 | Tracks the external-scheduler ("diary link") booking handoff. Lifecycle: `calendar_opened → slot_selected → pending_confirmation → confirmed`, plus `cancelled`/`failed`. Columns include `selected_date/start_time/end_time`, `duration_minutes`, `appointment_type`, `external_booking_id`, `confirmed_at`, `slot_source` (CHECK currently only allows `client_reported`; `provider_webhook` reserved for future use), `path`, `search_session_type/country/city_or_address` (152), and (196) `service_type`, `payment_status` (`not_required\|pending\|paid\|failed\|refunded`), `payment_provider`, `payment_reference`, `price_amount`, `price_currency`. |
| `booking_intake_forms` | 128, 196 | Required client-intake form completed before an external scheduler opens. `therapist_id/name, profile_id, client_name/email/phone/city/birth_year, participated_before, sessions_count, agreed_terms_at, agreed_privacy_at, status, idempotency_key (unique)`, plus (196) `service_type`. RLS enabled with **no public insert/update policy** — service-role only via `/api/booking-intake`. |
| `crm_ui_drafts` | 132 | `scope text primary key, schema jsonb, updated_by, updated_at`. Backs the UI Builder's autosave/publish model. Scopes in use: `global`, `page:<key>`. RLS: admin-only, all operations. |
| `support_requests` | 142 | Replaces `match_requests` as the live write target for the Find Support flow. `pathway (ai\|manual)`, a 9-value status pipeline, contact fields, preferences, `feelings_text`, `crisis_disclaimer_shown_at`, `matched_therapist_ids`, `ai_reasoning`, `gender_preference_honored`, `selected_therapist_id`, `preferred_date/time`, `diary_scheduling_event_id` FK. **RLS enabled with zero policies** — service-role only, by design. |
| `invitations` | 187 | `email, first_name, last_name, invited_role, therapist_profile_id, volunteer_application_id, invited_by_user_id, token_hash (sha256 — the raw token is never stored), token_expires_at, status (draft/sent/opened/accepted/expired/revoked/failed), sent_at/opened_at/accepted_at/revoked_at/last_resent_at, resend_count, accepted_profile_id, revoked_by_user_id`. Partial unique index prevents two simultaneous live invitations to the same email+role. RLS: admin/super_admin only. |

`gesa_admin_audit_log` already existed in v1.0 but is now actively written to (Phases 178, 186, 187) and had its RLS rewritten (§2.4 item 7).

### 3.2 New view — `therapists_public`

The public read path for the directory, individual profile pages, and both matching flows no longer reads the base `therapists` table directly. `therapists_public` (Phase 126) excludes `contact_email`/`contact_phone` and adds a derived `has_whatsapp` boolean; it was recreated three more times to add `offers_online`/`offers_in_person`/`city` (151), `support_pathways` (152), and `session_price_amount`/`session_price_currency` (196). `latitude`/`longitude` are deliberately never exposed through this view.

### 3.3 New columns on existing tables

**`therapists`:**

| Column | Phase | Notes |
|---|---|---|
| `diary_link`, `diary_link_status` (`valid\|invalid\|unset`, default `unset`), `country`, `price_note` | 126 | External scheduler support |
| `offers_online` (bool, default **true**), `offers_in_person` (bool, default **false**), `city`, `latitude`, `longitude` | 151 | Session-format/location filtering |
| `support_pathways text[] not null default '{}'` (values `crisis`, `veteran`, `general`, `helpers`) | 152 | Drives `/intake?path=` pathway listings |
| `profile_status` (`draft\|pending_publication\|active\|inactive\|archived`, default `draft`), `volunteer_application_id` FK → `therapist_applications` ON DELETE SET NULL | 186 | Publication lifecycle; see §6 |
| `session_price_amount numeric(10,2)`, `session_price_currency text default 'USD'` | 196 | Professional Services pricing — **no admin UI exists to set this; it must currently be set via direct SQL.** |

A new partial unique index, `therapists_profile_id_unique` on `(profile_id) WHERE profile_id IS NOT NULL`, prevents one login being linked to two therapist records (Phase 178).

**`session_bookings`:** gained `client_profile_id uuid references profiles(id)` (Phase 179, set unconditionally by trigger from `auth.uid()`, never from client input — guest bookings get `null`), `search_session_type/country/city_or_address` (151), and a widened `contact_channel` CHECK to include `in_person` (151). New RLS policy `session_bookings_client_read`: `USING (client_profile_id = auth.uid())` backs the new `/account/bookings` page.

**`inquiries`** (Phase 150): added `status` (default `New`; `New/Seen/In Progress/Resolved/Archived`), `admin_notes`, `source`, `consent` (default false). Existing rows were backfilled `source = 'legacy'`.

**`support_groups`** (Phase 157): added `status text not null default 'coming_soon'` (`coming_soon|active`). **Data change, not just schema:** all six existing groups had fabricated `facilitator_name`/`schedule`/`capacity`/`location`/`register_url` values cleared to NULL — this placeholder data had been live on the public site.

**`therapist_applications`:** a `status` CHECK (`new/reviewing/approved/rejected/withdrawn`) was formalized (Phase 186); Phase 189 added `gender`, `country`, `has_certification`, `primary_expertise`, `calendar_link`, `photo_url`, `consent_affidavit`, `consent_privacy_terms`.

### 3.4 New storage bucket

`volunteer-application-photos` (Phase 189) — public, 256KB limit, `image/jpeg|png|webp` only, public INSERT (the application form is unauthenticated) and SELECT policies.

### 3.5 Known orphaned/legacy data (present but not cleaned up — do not treat as bugs unless asked to clean them up)

- Six unread `site_content` keys from before the CMS was restructured: `about_page`, `home_hero_media`, `intake_config`, `our_specialists`, `paths_section`, `preloader`.
- The `match_requests` table and its historical rows are preserved but frozen (no new writes since Phase 142) — reachable only by direct URL at `/admin/match-requests`, which was removed from the admin nav in Phase 150.
- An unrelated `gesa` **schema** exists in the same Supabase project with its own `inquiries` table; the application never queries it.
- Two Supabase projects are out of sync — see §2.2 and §15.

### 3.6 Enumerated Types

Unchanged set from v1.0 plus the additions noted above: `AppRole` (now includes `super_admin`), `InvitedRole` (new), `DocumentStatus`, `DocumentType`, `GenderType`, `SessionDuration`, `TrackType`, `GenderPreference`, `SessionFormat`, `ContactChannel`, `BookingStatus`, `MeetingDurationChoice`.

---

## 4. Email System

### 4.1 Architecture change — `lib/email/resend.ts` (Phase 177)

The v1.0 model — each API route reading `GESA_CONTACT_INBOX` itself with its own hardcoded fallback — is gone. Eight routes had each copy-pasted their own `|| "hello@gesa.org"` fallback; this is now centralized:

- **`getContactInbox()`** is the single source of truth for the admin-notification recipient. It validates the environment variable's format and, if it's missing or invalid, logs one warning and returns a hardcoded fallback, `gesa.org26@gmail.com` — **`hello@gesa.org` has been fully retired.**
- **`isValidEmailFormat()`** also rejects header-injection attempts (any value containing a carriage return or newline).
- **`getReplyTo(visitorEmail)`** — team notifications reply to the visitor's own address; visitor confirmations reply to the contact inbox.
- `lib/contact.ts` (new) exposes `GESA_PUBLIC_CONTACT_EMAIL`/`GESA_PUBLIC_CONTACT_MAILTO` for public display, deliberately kept separate from the server-only `getContactInbox()`.
- Incoming `email` fields are now format-validated server-side in every route that accepts one.

### 4.2 Template changes

- The shared `shell()` wrapper (Phase 177) now appends "Questions? Reach us any time at gesa.org26@gmail.com" as a `mailto:` link to every outgoing email.
- **New template pairs since v1.0:** `donationReceivedEmail`/`donationNotificationEmail` (98); the diary-scheduling notification pair (126); the diary-appointment confirmation triple — client/therapist/team (129); the support-request therapist+team notification pair (142); invitation email templates (187).
- **Wording requirement QA should spot-check:** every diary-link email must be worded around "opened" / "you reported booking this" and must never imply GESA verified the appointment (Phases 126, 129) — because none of that data is provider-verified (see §11). The support-request therapist notification must **never** contain the client's free-text `feelings_text` (Phase 142).
- The volunteer-application notification email was extended with gender/country/primary-expertise/calendar-link/photo fields and a "90-minute" duration label (Phase 189).

### 4.3 New email-sending surfaces

`/api/email/donation` (98) joins the existing contact/welcome/group-registration/volunteer-application routes. Additionally, several flows send email **outside** the `/api/email/*` convention: the Mollie webhook (donor/team confirmation, sent once and only when a payment actually clears), `/api/diary-scheduling` (therapist+team on every handoff), `/api/diary-appointment/confirm` (three emails), and `/api/support-request/select-therapist` (two minimal emails).

### 4.4 Not in this repository

Password-reset/invite/all Supabase Auth email templates and the recovery-token expiry window remain configured entirely in the Supabase Dashboard, not in code (flagged Phases 175, 177). `RESEND_FROM_EMAIL` remains `GESA <no-reply@gesa.org>` — unrelated to the `GESA_CONTACT_INBOX` change; Gmail cannot be used as a From address for outbound mail.

---

## 5. Public Website — Pages & Features

### 5.1 Current full route inventory

Public: `/`, `/[slug]` (legal pages), `/about` (now a permanent 308 redirect → `/find-your-therapist`), **`/accept-invitation`** *(new)*, `/account`, **`/account/bookings`** *(new)*, `/blog`, `/blog/[slug]`, `/contact`, **`/donate`** *(new)*, **`/donate/thank-you`** *(new)*, `/faq`, `/find-your-therapist`, `/forgot-password`, `/intake`, `/login`, `/messages`, `/messages/[threadId]`, `/reset-password`, `/signup`, `/support-groups`, **`/therapist`** *(new — see §12)*, `/therapists`, `/therapists/[slug]`.

### 5.2 Site-wide changes

- **A persistent nav-label/route mismatch exists and QA must know about it to avoid false bug reports:** nav labels were changed (Phase 88) without changing the underlying routes. "Home" (`/`) is labeled **About**. "About" is labeled **Find Support** and now points at `/find-your-therapist`. "Our Therapists" is labeled **Our Professionals** (`/therapists`, unchanged). "Support Groups" is labeled **Community** (`/support-groups`, unchanged). This mismatch has caused real confusion internally across at least three phases and should be treated as expected behavior, not a bug, unless Roy asks for it to change.
- **Header Donate CTA** changed twice more since v1.0: "Donate" → "JOIN GESA" (opened the volunteer modal) → back to a real **"DONATE"** button linking to `/donate` (Phase 98). Phase 199 recolored it dark navy using a new dedicated `--donate-navy` token (kept separate from `--primary`, which drives every other button site-wide).
- **A new site-wide accessibility widget exists** (Phase 90) — a floating launcher (fixed above the crisis button) opening an "Accessibility Adjustments" panel with Language, Content, Color, Orientation, Skip-to-Content, and Reset modules. Settings persist in `localStorage`. **What is actually built:** Light Contrast, High Contrast, and Monochrome color modes; on/off text alignment. **What is not built despite appearing planned:** Dark Contrast, Sepia, and Invert color modes; three-way text alignment; "Highlight Titles"/"Show Descriptions" toggles. The widget itself is hidden on every `/admin/**` route and is not CMS-editable.
- **Footer restructured** (Phase 117) so its "Explore" column reads from the same shared `lib/navigation.ts` config as the header, eliminating a prior drift where the footer called a link "Find Support" while the header called the same link "Our Professionals." The footer's second, separately-broken Donate link (→ `/contact?subject=Donation`) was removed outright.
- **Crisis Button rebuilt (Phase 169).** Previously showed four hardcoded, US-only resources to every visitor worldwide regardless of location. Now shows an always-visible universal emergency notice plus a searchable country selector with verified, country-specific resources for 23 countries; any other country gets an explicit "we don't have a verified local number" fallback with a link to Befrienders Worldwide — **the system is designed to never display a guessed or unverified hotline number.**
- **Hebrew/RTL support** exists (built, reverted, and rebuilt across Phases 111–116) — Heebo webfont under `dir="rtl"`, mirrored fonts/spacing/close-button placement, and a pre-hydration `lang`/`dir` sync script. **Known, disclosed limitations QA should not report as new bugs:** anything outside the ~276-entry bundled dictionary silently falls back to English (the Google Translate API key is unset); admin-edited CMS copy drifts out of the dictionary over time; directional Tailwind spacing utilities (`ml-`, `pl-`, `left-*`) do not mirror; the admin CRM has no localization at all.

### 5.3 `/` — Home ("About" in the nav)

- Hero band is centered text only; a previously-tried gallery-wall artwork background was removed.
- Three flip-animated pathway cards remain the centerpiece. **Current live values:** badges read WAR / TERROR / DISASTER; front labels are Resilience / Veterans / Support; captions are "Gifted Professional Support" (×2) and "Global Professional Directory." Links: card 1 → `/intake?path=crisis`, card 2 → `/intake?path=veteran`, card 3 → **`/therapists`** (a prior bug sent card 3 into the free intake flow instead of the paid directory; fixed in Phase 155).
- **QA must test the original wood-frame/cream-mat card design.** Four separate redesign attempts at this card's front face (an embossed panel with debossed texture treatments) were built and then reverted at Roy's request (Phase 191 twice, then 197, then 198). An unused component, `PathCardTexture.tsx`, remains in the codebase from these attempts but is not wired into anything live.
- Background is `--home-gray` (`#b0bac3`) with an animated gold sheen spanning the full section, including the trust-badge strip below the hero.

### 5.4 `/about`

Still exists as a file (`app/about/page.tsx`) but is permanently unreachable — every request 308-redirects to `/find-your-therapist`, which now renders this page's actual content (see §5.6). Do not report "the About page is broken" if it redirects; that is the current, intended behavior.

### 5.5 `/therapists` and `/therapists/[slug]` — Our Professionals

- Backed by `therapists_public`, not the base table.
- **"Book a Session" now branches on whether the therapist has a scheduling link (`diary_link`).** With one: a required client-intake form, then the external scheduler opens in a new tab, then the client self-reports which slot they picked, then a review step, then a confirmation with a `GESA-xxxxxxxx` reference number. **This entire path is client-reported, never provider-verified** — the system logs it as `slot_source = 'client_reported'` and every related email is worded to avoid implying GESA confirmed the appointment. Without a diary link: the original native date/time picker, which is a real, conflict-free reservation backed by a database unique constraint.
- New session-format filter (Online / In-person, Phase 152).
- **Pagination was added, then fixed, then removed entirely (Phase 180).** Current behavior: every active, matching therapist renders in one pass; the count line reads "Showing all N active therapists" or "Showing X of Y active therapists." Do not test for a "Load more" button — it no longer exists.
- Mobile: the filter sidebar is now a bottom-sheet below the `lg` breakpoint (Phase 199) — see §14.

### 5.6 `/find-your-therapist` — "Find Support" (the most heavily reworked public page)

This is the single biggest structural change since v1.0 and deserves careful QA attention.

- **This route now renders what used to be the About page's content** (hero, "How GESA Works," founder spotlight, movement CTA band, team & advisors, donate band). `/about` permanently redirects here.
- The hero's primary CTA opens a **modal**, not a new page. Its `href` must remain the exact sentinel string **`#how-it-works`** for the modal to open at all; if an admin edits this field in the Content Manager to anything else (even a visually similar URL), the button silently becomes a dead link with no error. **This has happened once already in Production (Phase 160)** and should be flagged as a standing risk for anyone editing this field, not treated as a new bug if found again.
- The modal presents a two-way choice: **AI Support** or **Browse therapist**.
- **AI Support wizard is 4 steps:** Preferences → Format & Location → Feelings → Matches. **Disclosed, current gap: no name, email, phone, or 18-and-over confirmation is collected anywhere in this flow.** A contact-details step existed briefly and was removed (Phase 147); the underlying booking-selection API call still submits blank values for those fields. This is known and was not accidentally missed by this revision — flag to Roy as an open product question, not a bug to silently fix.
- **Browse therapist** opens a guided two-step search (session type, then country + city/address for in-person) with live result counts and filter chips — it no longer simply redirects to the full, unfiltered directory.
- **Only one close ("X") control now exists on this modal (Phase 199).** A duplicate close-looking control used to render from the choice screen itself (a leftover from before this screen always lived inside the modal); it has been removed from the DOM. The modal's remaining close button has a real focus trap, moves focus to itself on open, restores focus to the trigger element on close, and is labeled `aria-label="Close AI Matching Support"`.
- **Known, unfixed z-index bug:** this modal renders at a higher stack layer than the shared booking modal. If a client opens a booking modal for a diary-link-less therapist from inside the AI Support matches screen, the booking modal can render visually behind this modal's backdrop. Flagged in Phase 151, still open.

### 5.7 `/donate` and `/donate/thank-you` — brand new since v1.0

- `/donate`: hero, a giving box (one-time/monthly toggle, three preset amounts plus a custom amount, "Make my gift"), an impact row, a "be part of the movement" band, a trust-badge row, and a closing crisis-resources line. Fully CMS-editable.
- **Real payment processing via Mollie**, not a contact-form stand-in. Submitting the form first writes a `donations` row with `status: "open"` (so an abandoned payment still leaves a trace), then creates a Mollie payment (and, for monthly gifts, a Mollie customer + mandate), then redirects to Mollie's hosted checkout page. **The recurring subscription itself is only created by the webhook once the first payment actually clears** — never optimistically on form submit.
- The Mollie webhook receives only an unsigned payment ID and **always re-fetches the real status from Mollie's API** rather than trusting anything in the POST body.
- `/donate/thank-you` distinguishes three states — paid, failed/canceled/expired, and still-processing — and never assumes success just because the donor was redirected back.
- Requires `MOLLIE_API_KEY` to function; without it the page shows an explicit "not connected" message rather than failing silently. **Roy needs to supply a real key for this to go live.**

### 5.8 `/intake` — pathway listings (completely rewritten, Phase 152)

Previously ran the AI matcher with a hardcoded hint and returned at most 3 results in a bespoke card layout. **Now** it runs a real, uncapped database filter (`support_pathways` array contains the requested pathway, `is_active`, `is_verified`) and renders using the same directory/card/booking components as `/therapists`. Headings read "Available WAR / TERROR / DISASTER Support Professionals."

**Operational caveat QA should know before filing a "no results" bug:** the schema migration only backfilled the `general` pathway onto existing active therapists. `crisis`, `veteran`, and `helpers` pathways start genuinely empty in the data and will show zero results until an admin explicitly checks those boxes on each professional's profile. This is a data-completeness issue, not an application bug.

### 5.9 `/support-groups` — Community

- Gained a substantial intro block above the existing group listings (hero buttons, mission blurb, a three-card pathway navigator).
- **All six existing support groups currently show "Coming Soon" and have no reachable registration path (Phase 157).** Their previous facilitator/schedule/capacity/location/registration-URL data was found to be entirely fabricated placeholder content that had been live on the public site, and has been cleared from the database. The registration form and its underlying table are unchanged and will work again the moment any group's status is flipped to `active` — this is intentional, not a broken feature.
- **Two new paid/free service journeys were added (Phase 196):** a "Charity Services" CTA (free, capped at 6 sessions per client email, enforced server-side) and a "Professional Services" CTA (paid via PayPal; a booking cannot be confirmed with a `paid` status unless the payment actually cleared, enforced server-side regardless of what the client sends). **Both flows only list therapists who have a scheduling link configured** — therapists without one are not reachable through these two specific entry points. If a therapist has no price configured, checkout is blocked with an explicit message (and, again, there is currently no admin UI to set that price).

### 5.10 `/contact`

Gained an optional phone field and a required consent checkbox linking the Privacy Policy (Phase 150) — submission is disabled until it's checked. A separate footer form (`components/footer/HelpUsGrowForm.tsx`) remains a second legitimate, CMS-wired entry point into the same `inquiries` table.

### 5.11 Legal pages (`/[slug]`)

Five original pages plus a new **`affidavit`** page (Phase 189, currently placeholder body text, editable via the CRM). Terms & Conditions was fully rewritten (Phase 181) but **still contains live `[jurisdiction]` and `[effective date]` placeholders that need Roy's actual input** — not a rendering bug. All legal pages render as plain text (no Markdown support), and stray literal `##` characters that had leaked into four of the five pages were cleaned up (Phase 182).

### 5.12 Auth pages

- `/login`, `/signup`, `/reset-password` all use a new password field with a show/hide toggle.
- `/signup` gained a required Confirm Password field (previously missing) and a live password-requirements checklist.
- `/reset-password` enforces the 12-character policy, shows a specific "this reset link is no longer valid" state, and **signs the user out of every other active session** on a successful reset.
- **`/accept-invitation` (new, Phase 187)** — the landing page for a therapist/admin/super-admin invitation link. Validates the token before rendering anything meaningful; email is shown locked/read-only; name is pre-filled but editable; the same password policy applies; Terms + Privacy acceptance is required; on success, signs the person in and redirects a therapist to `/therapist`, an admin to `/admin`.

### 5.13 `/account` and `/account/bookings`

`/account` gained a Change Password section and a "My Bookings" link. **`/account/bookings` is new (Phase 179)** — shows a signed-in client's own bookings, split into Upcoming and Past/other, enforced by real RLS on the new `session_bookings.client_profile_id` column (server-set from the session, never from client input). A note on the page discloses that guest bookings made before an account existed may not appear.

### 5.14 `/blog`

Unchanged — still a deliberate redirect-to-Home stub with no published content, labeled "Coming soon" in the footer.

---

## 6. Admin CRM Dashboard

Every `/admin/**` route remains wrapped by `requireAdmin()`, explicitly documented as defense-in-depth on top of Postgres RLS, not a substitute for it.

### 6.1 Navigation — grew from 11 sections to 15

1. Overview — `/admin`
2. Session bookings — `/admin/sessions`
3. **Charity/Professional Bookings — `/admin/service-bookings`** *(new, Phase 196)*
4. **Find Support requests — `/admin/support-requests`** *(new, Phase 142 — functional replacement for "Find Your Therapist")*
5. Booking requests — `/admin/bookings`
6. Volunteer Applications — `/admin/volunteer-applications`
7. **Donations — `/admin/donations`** *(new, Phase 98)*
8. Inquiries — `/admin/inquiries`
9. Group registrations — `/admin/registrations`
10. Messages — `/admin/messages`
11. Our Professionals — `/admin/therapists` *(renamed from "Therapists," Phase 125 — the route, table, and `therapist` role value are unchanged)*
12. Users — `/admin/users`
13. **Administrators — `/admin/administrators`** *(new, Phase 187)*
14. Content Manager — `/admin/content`
15. **UI Builder — `/admin/ui-builder`** *(new, Phase 132)*

**Removed from the visible nav (but not deleted):** the legacy "Find Your Therapist" screen at `/admin/match-requests`. The page and its historical data still exist and are reachable by direct URL; it receives no new writes since Phase 142.

### 6.2 Overview — `/admin`

Same general shape as v1.0 (email-config warning banner, four KPI tiles, a 6-month trend chart, an activity feed, a scheduling calendar), with one important fix: **the Overview KPIs, activity feed, and calendar had all still been reading the frozen `match_requests` table for roughly 8 phases after `support_requests` became the real write target (Phase 142) — meaning all Find Support activity was invisible in this dashboard until Phase 150 fixed the read source.** The email-config warning was also rewritten to validate the contact inbox's actual format, not just whether it's set, with distinct messages for "not set" vs. "set but invalid."

### 6.3 New: Charity/Professional Bookings — `/admin/service-bookings` (Phase 196)

Deliberately kept separate from `/admin/sessions`. Read-only by design — no manual status override exists here; filterable by service type, payment status, booking status, therapist, and date range.

### 6.4 New: Donations — `/admin/donations` (Phase 98/99)

Displays donation records with per-status visibility; pledged totals count only rows with `status = 'paid'`.

### 6.5 Find Support requests — `/admin/support-requests` (Phase 142, functional rename)

One table over the real `support_requests` data, including a collapsible "how they're feeling" detail and a status control that re-validates the caller's admin role server-side on every change.

### 6.6 Our Professionals — `/admin/therapists`

Substantially expanded since v1.0:
- New international phone input with country auto-detection and E.164 normalization.
- New profile fields: scheduling link, country, price note, session types offered (online/in-person) + city, intake pathway checkboxes, and a "professional login linking" section.
- New **Diary link** status column, **Source** column, and a **status badge** (Draft / Pending publication / Active / Inactive / Archived) reflecting the new `profile_status` lifecycle.
- **New Archive action** — the requested "delete." It is a soft-delete only; the confirmation modal names the therapist explicitly, and if a login is linked it offers "archive profile only" vs. "deactivate account and archive profile" (a reversible ban, not a deletion). **No code path performs a hard SQL DELETE on a therapist.**
- **New explicit Publish/Set Active control**, separate from approving a volunteer application — approving an application never publishes a profile as a side effect (see §6.7).
- **New Account column and invitation actions** (Send/Resend/Revoke per row, plus a bulk "Invite professionals" action) reflecting the invitation-only onboarding model (§12).

### 6.7 Volunteer Applications — restructured (Phase 186/187)

Approving an application is now explicitly a multi-step, deliberate process rather than a single status change:
- "Approve application only" — just updates the status.
- "Approve and create professional profile" — creates a **Draft** therapist profile, not an active/public one.
- "Approve, create profile, and send invitation" — additionally sends the therapist an account invitation.

**A database trigger, not just UI convention, enforces that a therapist profile may only be linked to an approved application.** Note for the record: an earlier concern that approved applications were somehow becoming live public listings automatically was investigated and found **not reproducible** — the one flagged case had a different, unrelated cause. The multi-step safeguard above was still built regardless, since the previous single-status flow made no such distinction explicit.

The additional applicant fields captured since Phase 189 (gender, country, primary expertise, calendar link, photo) are stored but **not yet surfaced anywhere in the CRM review screen** — deliberately deferred, not an oversight.

### 6.8 Inquiries — rebuilt (Phase 150)

Now the single authoritative workflow: search by name/email/subject/message, status filter, date sort, an empty state, and a detail modal with editable admin notes, a status dropdown, and delete.

### 6.9 Delete actions across the CRM (Phase 150, entirely new)

A shared confirmation-modal pattern plus seven new, individually server-authorized delete routes (each independently re-checking the caller is an admin before using the service-role client) now exist for inquiries, session bookings, support requests, the legacy match requests, booking requests, volunteer applications, and group registrations.

### 6.10 New: Administrators — `/admin/administrators` (Phase 187)

Lists administrators and super admins with a Deactivate action, plus pending admin invitations with Resend/Revoke. Only a Super Admin can invite another Super Admin. Server-side, the system blocks self-deactivation, blocks deactivating a Super Admin unless the caller is also one, and blocks deactivating the last remaining Super Admin.

### 6.11 New: invitation system API surface (Phase 187)

`POST /api/admin/invitations`, `/api/admin/invitations/bulk`, `/api/admin/invitations/[id]/resend` (issues a brand-new token; the old one is immediately invalidated), `/api/admin/invitations/[id]/revoke`, `/api/admin/administrators/[id]/deactivate`, and the public, token-gated `POST /api/invitations/accept`. Every one of these actions is written to the admin audit log.

**A real bug was found and fixed while building this:** `/admin/users`' "Add user" screen had been silently creating every new account as `client` regardless of which role the admin selected, ever since Phase 178 changed how roles are assigned at signup. Fixed by having the invitation/admin-creation path set the role explicitly via the service-role client.

### 6.12 Notification Bell

Fixed to read from `support_requests` via a dedicated server route rather than a direct browser query (which was silently returning nothing, since that table has no RLS policies at all). **Known, still-open gap:** the therapist-facing branch of the bell still only surfaces the legacy `match_requests` table and was never extended to real bookings or diary-scheduling events.

### 6.13 Mobile responsiveness of the CRM

**Essentially none exists yet.** Verified directly in code: the only responsive handling anywhere under `app/admin` is the layout's sidebar collapsing above the `lg` breakpoint, plus three isolated `overflow-x-auto` table wrappers (Users, Messages, Donations). Every other admin table, filter bar, modal, and action menu will overflow or behave unpredictably on a phone-width screen today. This is explicitly scoped as pending work in the Phase 199 mobile pass — see §14.

---

## 7. Content Management System

### 7.1 `site_content` mechanism — unchanged in shape

Still one generic `key`/`value(jsonb)` table, read through `getPageContent()` with a fallback-to-hardcoded-constant contract, written via `upsert(..., { onConflict: "key" })`.

### 7.2 Content Manager tab changes (`/admin/content`)

Current tabs: **Header, About, Find Support, Our Professionals, Community, Blog (disabled), Contact, Intake, FAQ, Legal Pages, Footer, Donate Page, Donate Band, Crisis Button, Volunteer Modal.**

- Several tabs were renamed to track the live nav-label changes (Home→About, About→Find Support, Our Therapists→Our Professionals, Support Groups→Community).
- **New tabs:** Donate Page, Volunteer Modal, plus a nested Donate Thank-You editor and a nested Community Intro editor.
- **Deliberately removed, not just hidden:** the About page's "Our Mission" field group was deleted outright from the type, fallback, and editor — a rare departure from the site's usual "stop rendering, keep the field" convention. The Crisis Button's old "Resource 1–4" manual-entry fields were also removed once the new 23-country data-driven system replaced them (§5.2).
- Several field groups that are still editable but no longer rendered anywhere carry an explicit on-screen note saying so, rather than silently doing nothing when edited.

### 7.3 New CMS surface — the "UI Builder" (`/admin/ui-builder`, Phases 132–141)

This is an entirely new content-editing surface, separate from the Content Manager described above, and QA should understand it exists as its own thing:

- **Global Theme tab** — a visual editor for site-wide design tokens (colors, fonts, base sizing) with real WCAG contrast-ratio pass/fail badges (a warning, not a hard block), undo/redo history, autosaved drafts, and an explicit Publish step that updates `site_content.theme_tokens` and revalidates the site's cache. An "Images/Lighting" module and a "Layout/Reorder" module exist in the UI as visibly disabled placeholders — they are not functional yet, and that is intentional, not broken.
- **Page Content tab** — click-to-select visual editing directly on a live preview of the real public site. A normal visitor's HTML is byte-identical to before this feature existed; the extra data attributes and click handlers only render inside the admin preview iframe. Supports rich text (a Word-style toolbar: headings, bold/italic/underline/strike, lists, alignment, links with safe-protocol validation, font family/size/color, etc.) on most text fields, enforced by a three-tier content-mode system (`block` / `inline` / `none`) so, for example, a button label field can never end up containing a `<h1>` tag. All rich text is sanitized both when saved and again when rendered.
- Covers every public page, the five (now six) legal pages, and a pseudo-page grouping the global Header, Footer, and Crisis Button together.
- **Not built yet:** an image/media library, several field-type controls (toggles, social links, repeatable lists), a publish-time accessibility review step, version history, and multi-admin concurrency conflict detection.

---

## 8. Design System

### 8.1 Color Tokens — additions since v1.0

All tokens listed in v1.0 remain unchanged in value except where noted. New tokens in `app/globals.css`:

| Token | Value | Role |
|---|---|---|
| `--sand-brown` | `#cba560` | Gold icon-circle accents in specific sections |
| `--green-sage` | `#9ba689` | Home trust-badge strip background |
| `--home-gray` | `#b0bac3` | Home page's current section background |
| `--donate-navy` | `#1c2b45` | **Header Donate CTA only** — deliberately not `--primary`, since `--primary` drives every other button site-wide |
| `--donate-navy-600` | `#12192b` | Donate CTA hover state |
| `--font-signature` | Caveat (handwritten style) | About/Find Support founder signature only |

Design-token values injected at runtime by the UI Builder (base font size, heading/body weight, line height, label tracking) live in a separate `<style>` block generated by `lib/ui-builder/tokensToCss.ts`, not in the static `globals.css` file.

### 8.2 Typography — unchanged from v1.0.

### 8.3 New/changed reusable components (`components/ui/`)

`PhoneNumberInput` (international phone entry), `PasswordInput` + `PasswordRequirements` (show/hide toggle + live strength checklist), `MultiSelectCombobox` (searchable multi-select with an "Other" free-text option, used by the volunteer application form), `GoldHeroGlow` (extracted shared decorative hero layer), and **`MobileNavDrawer`** (Phase 199 — see §14).

### 8.4 New Tailwind breakpoint

`xs: 400px` was added under `theme.extend.screens` in `tailwind.config.ts` (Phase 199) — purely additive, does not change the meaning of the existing `sm`/`md`/`lg`/`xl`/`2xl` breakpoints anywhere else in the site.

### 8.5 Known, disclosed design-system inconsistency

`--donate-navy`, `--slate-banner`, and `--home-gray` have no matching Tailwind color alias (unlike `--primary`, `--accent`, etc.) — they're used via raw CSS or Tailwind's arbitrary-value syntax (`bg-[var(--token)]`). Not a bug, just a documented inconsistency worth normalizing in a future cleanup pass.

### 8.6 Z-index conventions (worth documenting explicitly for QA)

The shared booking modal (`components/ui/Modal.tsx`) uses `z-[90]`. `BrowseTherapistModal` deliberately uses a lower `z-[85]` so a booking modal opened from within it renders on top. `FindSupportModal` uses `z-[100]`. **This produces a known, unfixed layering bug:** because the Find Support modal's z-index is higher than the shared booking modal's, a booking modal opened from inside the AI Support matches screen (for a therapist without a scheduling link) can render visually behind the Find Support modal's backdrop. Flagged in Phase 151 and not yet fixed.

---

## 9. Environment Variables & Deployment Notes

### 9.1 New environment variables since v1.0

| Variable | Exposure | Purpose |
|---|---|---|
| `MOLLIE_API_KEY` | Server-only | Donations checkout. Without it, `/donate` shows an explicit "not connected" message. |
| `GESA_CONTACT_INBOX` | Server-only | Unchanged variable, changed required value — must now be `gesa.org26@gmail.com` (the old `hello@gesa.org` inbox is retired). Now format-validated, not just presence-checked. Requires a redeploy to take effect after changing. |
| `NEXT_PUBLIC_GESA_CONTACT_EMAIL` | Public | Optional publicly-displayed contact address; defaults to `GESA_CONTACT_INBOX` if unset. |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | Server-only | Professional Services payment processing. |
| `PAYPAL_ENV` | Server-only | `sandbox` or `live`. |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Public | Browser-side PayPal Smart Buttons SDK. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | **Now genuinely load-bearing** — required for invitation acceptance, admin user creation, therapist archive/deactivate, and every table with no RLS policies (`support_requests`, `booking_intake_forms`) or draft storage (`crm_ui_drafts`). The August spec's note that this was "not yet used in any live flow" is no longer accurate. |
| `NEXT_PUBLIC_SITE_URL` | Public | Now also used to build invitation-email links, in addition to the password-reset redirect base. Must be on Supabase's Redirect URLs allow-list or these flows will silently fail to redirect correctly. |

Unchanged: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ANTHROPIC_API_KEY` (still gates AI matching; falls back to the rule-based scorer if unset), `GOOGLE_TRANSLATE_API_KEY` (still unset in every environment — everything outside the bundled Hebrew dictionary silently falls back to English), `NEXT_PUBLIC_APP_ENV`.

**Documentation gap to close:** `ENV_VARS.md` and `.env.example` currently disagree with each other on where `MOLLIE_API_KEY` and `NEXT_PUBLIC_PAYPAL_CLIENT_ID` are documented — each appears in only one of the two files. Reconcile before QA relies on either as the checklist.

### 9.2 Open items for handoff — see §15 (Appendix), which supersedes and expands v1.0's version of this section.

---

## 10. Functional Requirements

FR-1 through FR-32 from v1.0 remain accurate and are not repeated here in full; the only correction is that **FR references to therapist self-service should be understood in light of §12** — a read-only dashboard now exists, though it does not add or change any of FR-1–32's original behavior. New requirements observed in the current codebase, continuing the numbering:

**Accessibility**
- FR-33 — A site-wide accessibility widget shall offer Language, Content, Color, Orientation, Skip-to-Content, and Reset modules, persisted per browser, and shall not render on any admin route.

**Donations & payments**
- FR-34 — A public donations page shall support one-time and monthly giving with preset and custom amounts.
- FR-35 — A donation record shall be written before redirecting to hosted checkout, so an abandoned payment still leaves a record.
- FR-36 — A recurring gift's subscription shall be created only after the first payment actually clears, never optimistically.
- FR-37 — Payment-status webhooks shall always re-fetch true status from the payment provider's API rather than trusting the webhook payload.
- FR-38 — A post-payment landing page shall distinguish paid, failed/canceled/expired, and still-processing outcomes.
- FR-39 — An admin donations view shall count only successfully paid records toward any pledged total.
- FR-40 — Paid Professional Services bookings shall use PayPal Orders v2 checkout.
- FR-41 — A paid booking shall never reach a confirmed state unless the payment status is genuinely `paid`, enforced server-side.
- FR-42 — Checkout shall be blocked with an explicit message when a therapist has no price configured.

**Confidentiality**
- FR-43 — A therapist's contact email and phone shall never be reachable through any public read path.
- FR-44 — Admin or self reads of a therapist's real contact information shall go through a dedicated, audited RPC.

**Scheduling-link ("diary link") booking**
- FR-45 — The booking action shall branch on whether a therapist has a valid scheduling link configured.
- FR-46 — A required client-intake form shall be completed and saved before an external scheduler opens.
- FR-47 — The external-scheduler handoff shall track a defined lifecycle from calendar-opened through confirmed (or cancelled/failed).
- FR-48 — Any slot selected through this path shall be recorded and displayed as client-reported, never as provider-verified.
- FR-49 — Confirmation shall be idempotent — a repeated confirmation call shall not resend notification emails — and shall issue a human-readable reference number.

**Find Support**
- FR-50 — A single modal-based choice screen shall offer AI Support or Browse Therapist as the two Find Support pathways.
- FR-51 — Both pathways shall write to one unified requests table, accessible only through service-role-authorized server code.
- FR-52 — A CRM-visible record shall be created only at genuine submission, never merely on entering the flow.
- FR-53 — Browse Therapist shall support a guided search by session type and location with a live result count.
- FR-54 — Every booking shall be tagged with its originating search path and parameters for CRM traceability.

**Pathway listings**
- FR-55 — Each home-page pathway shall list every eligible, active, verified therapist for that pathway with no artificial cap.

**Community / support groups**
- FR-56 — A support group shall never display facilitator, schedule, or capacity information, nor offer a reachable registration path, unless its status is active.
- FR-57 — Free "Charity Services" bookings shall be capped at a fixed number of sessions per client email, enforced server-side.

**Crisis resources**
- FR-58 — Crisis resources shall be country-specific and verified; an unsupported country shall receive an explicit fallback rather than a guessed number.

**Applications / onboarding**
- FR-59 — A public volunteer application shall create only an application record — never a public listing, account, or invitation, as a side effect.
- FR-60 — Approval, profile creation, and public publishing shall remain three separate, deliberate admin actions.
- FR-61 — A therapist profile shall only be linkable to an approved application, enforced at the database level.
- FR-62 — Removing a professional from the public directory shall always be a reversible archive, never a hard delete.
- FR-63 — The volunteer application form shall require a minimum-resolution photo, a bounded-length bio, a fixed set of session-duration options, and two explicit legal consents before it can be submitted.

**Invitations / RBAC**
- FR-64 — Therapist, Administrator, and Super Admin accounts shall only be created by accepting a single-use, expiring, cryptographically hashed invitation — never through public self-registration.
- FR-65 — Only an existing Super Admin may invite another Super Admin, and the system shall always retain at least one Super Admin.
- FR-66 — Resending an invitation shall invalidate any previously issued token for it.
- FR-67 — Every invitation and administrator-management action shall be recorded in an immutable audit log.
- FR-68 — A user shall never be able to change their own role, regardless of which client they use to attempt it.

**Client account**
- FR-69 — A signed-in client shall be able to view their own bookings, enforced by row-level security rather than application logic alone.
- FR-70 — A booking's association to a client account shall be set server-side from the authenticated session, never accepted from client-submitted input.

**Auth**
- FR-71 — Password entry fields shall provide a show/hide toggle; new passwords shall be required to meet a defined minimum-strength policy.
- FR-72 — Password recovery shall never disclose whether a given email address has an account, or what role it holds.
- FR-73 — A successful password reset shall invalidate all other active sessions for that account.

**CRM**
- FR-74 — Deletion of a CRM record shall require an explicit confirmation step and shall independently re-verify the caller's admin role server-side.
- FR-75 — Inquiries shall support a status, admin-only notes, a source tag, and a recorded consent flag.

**CMS / UI Builder**
- FR-76 — Administrators shall be able to edit site-wide design tokens with a draft/publish workflow and immediate cache invalidation on publish.
- FR-77 — Administrators shall be able to visually select and edit text content directly on a live preview of the real public site, across every public page and the legal pages.
- FR-78 — All rich-text content shall be sanitized both when it is saved and again whenever it is rendered, regardless of source.

---

## 11. Client Workflow

The overall shape from v1.0 (entry points → choosing a therapist → two distinct booking mechanisms → optional account/messaging) is still correct, with these material corrections:

1. **Entry into "Find Support" now opens a modal**, launched from `/find-your-therapist` (the former About page content), not a standalone wizard page.
2. **The AI Support wizard is now 4 steps** (Preferences → Format & Location → Feelings → Matches), and — this is a disclosed, current gap, not an oversight in this document — **does not collect the client's name, email, phone, or an 18-and-over confirmation anywhere in the flow.**
3. **A CRM-visible record is created only at genuine submission**, not on merely entering or abandoning the flow partway.
4. **Browse Therapist is a guided search**, not an immediate redirect to the full public directory.
5. **Booking now has two genuinely different mechanisms** depending on the specific therapist: a scheduling-link handoff (client-reported, not provider-verified) or a native date/time picker (a real, database-enforced reservation). Only the native path is a guaranteed slot.
6. **Two new paid/free journeys exist from the Community page** — free Charity Services (capped at 6 sessions per client email) and paid Professional Services (PayPal).
7. **Home pathway cards now lead to full, uncapped therapist listings**, not a 3-result AI match.
8. **Support-group registration is currently unreachable for all six existing groups** (they show "Coming Soon"); the underlying mechanism itself is unchanged and will work again once any group is activated.
9. **New account capabilities:** a "My Bookings" page, a Change Password section, and password strength/show-hide UI throughout.
10. **Donation is now a real payment journey** via Mollie, not a contact-form stand-in.
11. **Crisis resources are now country-selectable**, not US-only.
12. **On mobile, primary site navigation is finally reachable** via a new hamburger drawer (Phase 199) — before this fix, a phone visitor had no way at all to reach the header's nav links or Donate button.

---

## 12. Therapist Workflow

**This section corrects the single most significant inaccuracy in the v1.0 specification.** The August document stated, in its own words, that "Therapists do not have a self-service portal" and have "no login flow distinct from the generic client sign-in." **Both statements are now false, verified directly against the current code, not just against the project's planning document.**

### 12.1 A therapist self-service login and dashboard now exist

- `app/therapist/layout.tsx` and `app/therapist/page.tsx` exist. The layout is a Server Component that calls a dedicated `requireTherapist()` guard once for the whole section; the dashboard page itself is read-only — no forms, no editable fields, no tabs.
- The dashboard shows, in order: an inactive-profile notice (if applicable), Upcoming sessions, AI Support Bookings, scheduling-link activity, and past/other requests — each queried with an explicit filter to that therapist's own linked record, on top of RLS.
- If a `therapist`-role account exists but has not yet been linked to a professional profile record, the page shows a friendly "your account isn't linked to a professional profile yet" message rather than an empty or broken dashboard.
- `AppRole` includes a distinct `therapist` value, and the account menu shows a "My Dashboard" link (mirroring the admin "CRM Dashboard" link) only to signed-in therapists.
- **What a therapist still cannot do, which remains consistent with the platform's original design intent:** edit their own profile, confirm/cancel/reschedule anything, or manage their own availability, pricing, or offered pathways/session types from this dashboard. All of that remains exclusively an admin function through the CRM. There is also no in-app queue for a therapist to accept or decline a request — coordination with clients happens by email, WhatsApp, or Zoom outside the platform, same as before.

### 12.2 How a therapist account is created — invitation-only (current, as of Phase 187)

This has changed twice since the mechanism was first introduced:
1. Originally (Phase 127), an admin manually created a `therapist`-role login and separately linked it to a professional profile record via an email lookup.
2. Briefly (Phase 178), the system attempted to auto-link an account at signup by matching the signup email against the therapist's public contact email — **this was a real security hole, since that contact email is publicly visible on the profile page,** and was removed once identified.
3. **Currently:** account creation is invitation-only. An admin sends a single-use, expiring, cryptographically hashed invitation (individually, in bulk, or automatically when approving a volunteer application with the "send invitation" option). The invited person accepts it at `/accept-invitation`, sets a password, accepts the Terms and Privacy Policy, and is signed in and redirected straight to their dashboard. Public self-registration can no longer produce a therapist (or admin) account under any circumstance.

### 12.3 Application, admin review, and manual promotion to a listed therapist

Unchanged in spirit from v1.0 — a structured public application, admin review with a status pipeline, and a deliberate, separate manual step to actually create and publish a public listing — but now formalized with an explicit `Draft → Pending publication → Active → Inactive → Archived` lifecycle and a database-level rule (not just a UI convention) that a profile can only be linked to an approved application.

### 12.4 Availability remains entirely admin-managed

There is still no evidence of, or intention for, a therapist-facing screen to edit their own weekly availability. This remains a deliberate admin-managed record.

### 12.5 Known, still-open gap

The site-wide notification bell's therapist-facing branch still only surfaces the legacy `match_requests` table and has never been extended to real session bookings or scheduling-link events — a therapist relying on the bell for awareness of new activity will not see everything relevant. Flagged since Phase 127, still unresolved as of Phase 199.

---

## 13. Known Issues, Regressions & Work That Was Reverted (QA focus)

This section exists specifically so QA does not spend time either (a) reporting long-standing, disclosed, intentional gaps as new bugs, or (b) testing for a design/feature that was tried and explicitly reverted. It is organized roughly by how much of the site a given issue affects.

### 13.1 Fixed — but worth a regression test specifically because of how severe it was

1. **Site-wide hydration failure that made the entire site non-interactive for any visitor with "reduce motion" enabled (fixed, Phase 176).** The root cause: a motion-detection hook was being read during React's render pass, which returns different values on the server than on the client's first render for anyone with that OS/browser setting — causing a guaranteed mismatch on roughly a dozen footer elements on every single route. This didn't just log a warning; it broke React's ability to run any effects at all, so **nothing on any page was clickable.** **QA action:** enable "reduce motion" in your OS or browser settings and confirm every interactive control on every page type still works. Then test again with it disabled.
2. **Site-wide "Application error" crash for any visitor whose browser locale/timezone wasn't US English/UTC (fixed, Phase 185).** Caused by admin date displays formatting dates using the browser's local settings on the server and the visitor's real settings on the client, producing a mismatch. **QA action:** test `/therapists` and every admin list page from a non-US-English, non-UTC browser profile; confirm every date column shows a real date.
3. **The Therapist Edit page in the CRM crashed on every single open (fixed, Phase 188).** **QA action:** open Edit on several different therapist profiles and confirm the Intake Pathways and Session Types checkboxes correctly reflect each one's actually-saved values.
4. **Two confirmed live security vulnerabilities allowing a normal signed-up user to grant themselves admin access (both fixed — see §2.4, items 3–4).** **QA action:** attempt both exploit paths described there and confirm both are now rejected.
5. **A live data leak of therapist phone numbers to any visitor of the matching wizard (fixed, Phase 126).** **QA action:** inspect the network response of every public-facing therapist/matching endpoint and confirm no `contact_email`/`contact_phone` field is ever present.
6. **Clicking "AI Support" used to create two duplicate, blank CRM records and two duplicate admin notifications instantly, before the client entered a single answer (fixed, Phase 184).** **QA action:** enter the AI Support wizard and abandon it at each step — confirm zero CRM records are created. Complete it — confirm exactly one record and one notification, even if you double-click submit.
7. **Click-to-select editing in the UI Builder silently failed for most navigation links and call-to-action buttons site-wide (fixed, Phase 141).** **QA action:** in Page Content edit mode, click a header nav label, a footer link, and a CTA button's label on at least three different pages; confirm each becomes selectable and none of them navigate away when clicked in edit mode.
8. **The CRM's Overview dashboard, activity feed, notification bell, and calendar were all silently reading a frozen, dead table — meaning all Find Support activity was invisible in the admin dashboard for roughly 8 phases of development (fixed, Phase 150).**
9. **The admin "Add user" screen silently created every new account as a plain client regardless of which role was selected (fixed, Phase 187).**

### 13.2 Known, disclosed, currently open — do not report these as new findings without checking here first

1. **A signed-in therapist account can still read another therapist's private contact information** by querying the base `therapists` table directly — the confidentiality fix (§2.4 item 5) was only applied to the `anon` role, not `authenticated`. Genuinely open; flag to Roy, don't treat as resolved.
2. **The AI Support wizard collects no name, email, phone, or age confirmation.** Disclosed in §5.6/§11 — a real product gap, not a bug in this document's sense, but worth a decision from Roy about whether it should return.
3. **A z-index layering conflict** can cause a booking modal to render behind the Find Support modal's backdrop in one specific nested scenario (§8.6). Open since Phase 151.
4. **The therapist-facing notification bell only surfaces one legacy data source** and misses real bookings/scheduling events (§12.5). Open since Phase 127.
5. **No admin UI exists to set a therapist's Professional Services price** — it currently requires direct database access. Deliberately deferred by Roy, not a bug.
6. **Terms & Conditions contains live placeholder text** (`[jurisdiction]`, `[effective date]`) awaiting Roy's actual input.
7. **`crisis`, `veteran`, and `helpers` pathway listings will show few or no results** until an admin populates those tags on individual therapist profiles — a data-completeness state, not an application defect.
8. **All six Community support groups are in "Coming Soon" status with no reachable registration path**, and this is intentional pending real facilitator data.
9. **Hebrew/RTL translation has multiple disclosed limitations** — untranslated content falls back silently to English, admin-edited copy drifts out of the translation dictionary over time, directional CSS spacing does not mirror, and the admin CRM is not localized at all. See §5.2.
10. **Two Supabase environments (Production and Dev) are schema-out-of-sync**, missing three tables in Dev that several live features depend on (§2.2). Testing certain flows against a Preview/Dev deployment will fail for this reason.
11. **There is no committed migration history after the initial schema file** — every schema change since roughly Phase 126 was applied directly to Production via a database tool, not through a versioned migration. This is a process/technical-debt item, not a functional bug, but QA and any future engineer should know the database schema cannot currently be reconstructed from the git history alone.

### 13.3 Explicitly built, then reverted — QA should NOT expect to find these live, and should not report their absence as a regression

- **Four separate redesign attempts of the Home page's pathway card front faces** (an embossed panel design with a debossed texture treatment, attempted twice, plus two further literal-spec attempts) were all built and then reverted at Roy's explicit request. The live design is the original wood-frame/cream-mat card. An unused component (`PathCardTexture.tsx`) remains in the codebase from these attempts but is not connected to anything.
- An interactive, mouse-reactive glow effect on the Home hero's icon background was built and reverted.
- Several full-site hero-background color schemes (a dark navy treatment, an all-gold treatment, various seam/gradient fixes) were tried and superseded across multiple phases; the current, final state is documented in §5.3.
- A brief expansion of the language switcher to roughly 50 languages was tried and reverted back down to English/Hebrew only.
- A short-lived rebuild of Hebrew/RTL support was itself reverted once, then rebuilt properly on the second attempt — the version described in §5.2 is the final, current one.

---

## 14. Mobile Responsiveness Status (Phase 199, in progress)

Roy requested a full mobile UX/accessibility audit and fix pass across every public, authenticated, and admin page at common phone widths (320–430px). **This is being delivered as a sequence of installments under one phase number, and as of this document, only the first installment has landed.** QA should treat this section as the current, honest state of that work — not a claim that mobile responsiveness is complete site-wide.

### 14.1 Completed so far

1. **A mobile navigation drawer was added — the single biggest gap that existed.** Before this fix, the site's header navigation was completely hidden below the `md` breakpoint with no fallback of any kind, and the Donate button was hidden below `sm` — meaning a phone visitor had no way to reach any primary nav link or the Donate button at all. A new hamburger-triggered, off-canvas drawer now provides all of that, with a proper focus trap, Escape-to-close, body-scroll lock, and focus correctly moving to and returning from the panel.
2. The header's spacing was tightened below `sm`, and the "GESA" wordmark now hides below a new 400px breakpoint, leaving just the recognizable logo mark so the header doesn't overflow on the smallest common phone widths.
3. The notification bell's dropdown panel, which was a fixed width wider than a 320px screen, now sizes itself to the viewport on mobile.
4. **The therapist directory's filter sidebar was converted to a bottom-sheet pattern below the `lg` breakpoint.** Previously it rendered full-width and inline above the results, meaning a phone visitor had to scroll past the entire filter panel before seeing a single therapist card. It's now a compact "Filters" button (showing an active-filter count) that opens the same filter controls in a full-screen sheet.
5. **Follow-up fix — the header's Donate button was recolored to a dark navy blue** at Roy's request, using a new, dedicated color value rather than changing the site's main button color (which is used everywhere else).
6. **Follow-up fix — a duplicate close button on the AI Matching Support modal was removed.** The modal had been showing two visually identical "X" close controls with different underlying behavior; only one now exists, and it received a proper focus trap and an accessible label in the process.

### 14.2 Explicitly not yet started

- The homepage's hero and pathway-card layout at small widths.
- Every form platform-wide (contact, donation, intake, booking, account, therapist onboarding).
- The authentication pages (login, signup, forgot-password, reset-password, account).
- The Community page's donation/service booking flows and the professional-onboarding (volunteer application) flow.
- The footer, its inquiry form, and the legal pages.
- **The entire admin CRM dashboard** — confirmed in code to have essentially no mobile handling beyond the sidebar collapsing and three scrollable table wrappers. Every other admin table, filter bar, and modal is expected to overflow or behave unpredictably on a phone.
- Loading/error states and a full accessibility pass beyond what's already covered above.
- A structured cross-width QA pass at 320/360/375/390/412/430px.
- A final consolidated audit/deliverables report for this whole effort.

### 14.3 A caveat that affects how much confidence to place in installment one

Because the project's build/test sandbox has been unavailable for an extended stretch of this work, **none of the Phase 199 mobile changes (or, more broadly, a large amount of the work from roughly Phase 175 onward) have been run through `tsc --noEmit`, the Jest suite, or a real browser rendering** by the person who built them. This does not mean the code is wrong — but it does mean QA's manual verification of these specific changes is the first real check they will have received. Priority checks for installment one specifically: the hamburger icon appears only below the `md` breakpoint and every nav link plus Donate is reachable and functional from inside it; focus trapping and Escape-key handling work correctly on both the nav drawer and the AI Matching modal; the wordmark hides cleanly below 400px width without breaking the header layout; the notification dropdown fits inside a 320px-wide screen; the therapist directory's filter sheet opens, filters correctly, and its "Show N results" button scrolls to the right place; and exactly one close control exists on the AI Matching Support modal.

---

## 15. Appendix — Open Items for Handoff

This supersedes and expands v1.0's "Open Items for Handoff" section.

1. **Two Supabase environments are out of sync.** Production (`iddeoavrlnvwwfopsacy`) has tables that the Dev/Preview project (`ggjvpfivyqartvanvhzq`) is missing (`diary_scheduling_events`, `booking_intake_forms`, `crm_ui_drafts`). Flagged internally in Phase 142 and never resolved. Any QA pass against a Preview deployment should expect certain booking/UI-Builder features to fail for this reason.
2. **No migration files exist for any schema change made after the initial setup.** Every table, column, trigger, and policy added since roughly Phase 126 was applied directly against the Production database via a database administration tool, not committed as a versioned migration. Recommend either formalizing this as the documented process going forward, or beginning to capture migrations again — either way, the current git history alone cannot reconstruct today's actual schema.
3. **The nav-label-to-route mismatch** ("About" labels the homepage; "Find Support" labels `/find-your-therapist`, which itself used to be reachable at `/about`) has caused real, repeated confusion during development. It should be documented prominently for anyone new joining the project, including QA, precisely so it isn't mistaken for a bug.
4. **Two specific content fields are sentinel values that silently break a feature if edited casually through the CMS:** the Find Support page's primary hero button href must remain exactly `#how-it-works`, and the header's Donate button href must remain exactly `/donate` (or the specific volunteer-modal trigger value) for their special click behavior to keep working. Both have already broken once in Production from an innocent-looking content edit.
5. **A general hazard when updating any CMS-driven field in code:** the content-loading helper does a shallow merge between the live database row and the code's hardcoded fallback, so a published row that predates a newly added field will silently keep using the old fallback for that one field even after a code deploy. Several past changes required a direct one-time database update in addition to the code change. Any future spec change touching a CMS field should explicitly say whether the live data also needs a one-time update.
6. **Items that still need Roy's direct input, not further engineering work:** the real Terms & Conditions jurisdiction and effective date; a live `MOLLIE_API_KEY`; a live `GOOGLE_TRANSLATE_API_KEY` (or an explicit decision to leave translation dictionary-only); a decision on whether the AI Support flow should recapture contact details and an age gate; a decision on how a therapist's Professional Services session price should actually be set (currently SQL-only); and real facilitator/schedule data for the six Community support groups currently marked "Coming Soon."
7. **Files intentionally left in the codebase but not wired into anything live** (per the project's standing "don't delete without confirming" convention): several early match-flow components, an early intake-flow component, the unused card-texture component from the reverted Home redesigns, the unreachable `/about` page file, an old volunteer-status selector, sample support-group data, and a one-off JSX-text validation script. `/api/match` and `/api/match-booking` are retired in place and now return HTTP 410 Gone rather than being deleted.
8. **`SUPABASE_SERVICE_ROLE_KEY` is now genuinely required**, contrary to v1.0's note that it was unused — treat it as a mandatory secret for both Production and any environment meant to exercise invitations, therapist archiving, or the two zero-RLS tables.

---

*This document reflects the codebase as of Phase 199 in `EXECUTION_PLAN.md` at the time of writing. As with v1.0, for the single most current state of any specific feature, defer to the live code and that file's latest entries — this specification should be treated as a snapshot for QA planning, not a live-updating source of truth.*
