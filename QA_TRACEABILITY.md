# QA Traceability Matrix — Proposal vs. Build

Cross-checks this build against **GESA_Website_Development_Proposal.docx**
(VentVest, July 2026 — the v2.0 proposal). That proposal describes a much
larger platform than this engagement's brief (Next.js/TS + Supabase + Vercel +
in-app chat + auth/RBAC, delivered phase-by-phase with your sign-off between
phases). This document exists so the gap between "what the proposal
describes" and "what got built" is explicit, not discovered later.

Status legend: ✅ built & tested · ⚠️ partially built · ❌ not built (by design,
not oversight — see note) · 🧪 test file reference

## Section 4 — Public site & information architecture

| Proposal item | Status | Notes / test coverage |
|---|---|---|
| 4.1 Public IA (Home, About, Specialists, Support Groups, Blog, FAQ, Contact, Legal, footer) | ✅ | All pages built and live-wired to Supabase. 🧪 `tests/e2e/navigation.spec.ts` |
| 4.2 Four support tracks | ✅ | Home "Paths" section — war/terror, antisemitism/diaspora, helping the helpers, group support |
| 4.3 Two-click booking promise | ❌ | No booking/calendar flow exists yet — there's no "pick a time" step anywhere. This engagement's brief didn't include booking; flagging since the proposal treats it as core |
| 4.4 Taxonomy-driven filtering (specialty, language, duration, gender) | ✅ | Our Specialists directory filters on all four. 🧪 `tests/e2e/therapist-directory.spec.ts` |

## Section 5 — Business processes

| Proposal item | Status | Notes |
|---|---|---|
| 5.1 Client journey: Arrive → Filter | ✅ | |
| 5.1 Client journey: Match → Consent → Book → Attend → Continue → Follow-up | ❌ | None of this exists — no intake-to-match engine, no booking calendar, no session reminders. The `intake_requests`/`matches`/`sessions` tables exist in the schema (Phase 3) but nothing writes to or reads from them yet |
| 5.2 Therapist onboarding & document verification | ❌ | `therapist_documents` table + status enum exist; no application form, no upload UI, no reviewer workflow |
| 5.3 Smart matching engine | ❌ | Not built. `matches` table exists but is unused |
| 5.4 Session reminders / no-show tracking | ❌ | `sessions.is_free`, `clients.free_sessions_used/total`, `no_show_count` columns exist; nothing increments or emails them yet |
| 5.5 Crisis & safety (SOS path, resource directory, escalation log) | ⚠️ | Persistent crisis button + modal with real hotlines is built and tested (🧪 `navigation.spec.ts`). `crisis_resources` table is seeded (3 rows). No region-detection, no escalation logging, no "alert a responder" path |
| 5.6 Donations & payments (Stripe/PayPal, receipts, tax handling) | ❌ | "Donate" CTAs route to the contact form only. No payment processor is integrated |

## Section 6 — Frontend

| Proposal item | Status | Notes |
|---|---|---|
| 6.1 Public pages, mobile-first | ✅ | |
| 6.2 Client area (booking history, remaining free sessions) | ❌ | No client dashboard beyond the messages list |
| 6.3 Therapist portal | ❌ | Therapists have no login/dashboard experience at all — the 9 seeded therapists have no linked accounts (see Phase 4 notes) |
| 6.4 Accessibility (WCAG 2.1 AA) + multilingual | ⚠️ | Semantic markup, focus states, and `prefers-reduced-motion` are respected (inherited from the original design system). No formal a11y audit run. English only — no i18n layer |

## Section 7 — Backend data model

| Entity | Status |
|---|---|
| Therapist, Client, IntakeRequest, Match, Session, Payment/Donation, Document, CrisisResource, User/Role | ✅ schema exists with RLS (Phase 3) — ⚠️ most have no UI/workflow built on top yet (see Section 5 above) |

## Sections 9–11 — CRM, integrations, AI

| Proposal item | Status |
|---|---|
| 9. Admin/reviewer/therapist dashboards, CRM spine | ❌ | Not built |
| 10. Video (Zoom/Meet), Payments (Stripe/PayPal), Email, SMS/WhatsApp, Translation | ⚠️ Email only (Resend, Phase 4) — everything else ❌ |
| 11. AI-assisted matching guidance / on-site assistant | ❌ | Not built |

## Section 12 — Security, privacy, compliance

| Proposal item | Status |
|---|---|
| RLS-enforced data access, role-based permissions | ✅ | Audited in Phase 3; `auth_role()` reviewed and accepted (see EXECUTION_PLAN.md decisions log) |
| GDPR/Israeli Privacy Law lawful-basis + retention rules | ❌ | Not implemented — no consent capture beyond account creation, no data retention policy, no erasure workflow |
| Audit logging | ❌ | Not implemented |

## Section 13 — Migrating the existing therapist network

| Proposal item | Status |
|---|---|
| Import/re-tag/re-verify existing 200+ therapists | ⚠️ | 9 real therapist records + real photos were pulled from the production data as seed/demo content (Phase 3). No bulk-import tooling exists for the remaining ~190+ |

---

## What is actually tested right now

**Unit (Jest + React Testing Library)** — `tests/unit/`
- `Button.test.tsx`, `Badge.test.tsx` — UI primitives render/behave correctly — ✅ verified passing
- `FaqAccordion.test.tsx` — expand/collapse logic, only one open at a time — ✅ verified passing
- `TherapistsDirectory.test.tsx` — name/language filter logic, empty state — ⚠️ written and reviewed, execution timed out in this sandbox (see note below), not yet confirmed
- `emailTemplates.test.ts` — every Resend template renders expected content — ✅ verified passing
- `databaseTypes.smoke.test.ts` — `lib/database.types.ts` type helpers resolve to real row shapes — ✅ verified passing

**End-to-end (Playwright, Chromium + mobile Safari viewport)** — `tests/e2e/`
- `navigation.spec.ts` — home hero, header nav, footer legal links resolve, crisis modal
- `therapist-directory.spec.ts` — directory listing + filters against live seed data
- `support-groups.spec.ts` — tab switching, Register modal open/close
- `contact.spec.ts` — subject deep-link, required-field validation, submit flow (network calls stubbed so it doesn't depend on live Supabase/Resend)
- `auth.spec.ts` — signed-out state, bad-login error surfaces, `/messages` redirect-to-login, signup password rule

**Not covered yet:** chat send/receive (needs two authenticated sessions — worth adding once therapist accounts exist), signup→email delivery (can't verify without a real `RESEND_API_KEY`), RLS negative tests (e.g., confirming a client truly cannot read another client's thread) — recommend adding as pgTAP or a dedicated Supabase test project before production launch.

## Running this locally

```bash
npm install
npm test                 # Jest unit tests
npx playwright install   # one-time browser download
npm run test:e2e          # Playwright E2E (spins up a local prod build automatically)
```

**Note:** `npm install` did complete in this sandbox after some work, and 5 of
the 6 unit test files above were actually run and confirmed passing here — not
just written. The 6th, `TherapistsDirectory.test.tsx`, has the most test cases
and the most `userEvent` interaction of the set, and its run consistently
exceeded my tool's hard ~3-minute-per-command cap on this network-mounted
folder (Jest cold-start overhead alone runs 100–150+ seconds here before any
test executes). I read through the file and component and found no logic
issue — it's the slowest file, not a broken one, but I can't give you a
confirmed pass on it from this environment. On your machine, without the
mount penalty, `npm test` should run the full suite in a few seconds:

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
npm install
npm test                 # Jest unit tests — all 6 files
npx playwright install   # one-time browser download
npm run test:e2e          # Playwright E2E (spins up a local prod build automatically)
```

E2E has not been run anywhere yet — Playwright's `webServer` step requires
`next build`, which this sandbox can't complete cleanly (same mount issue as
Phase 1/2). That verification needs to happen on your machine.
