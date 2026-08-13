# Environment Variables — per environment

Set these in **Vercel → Project → Settings → Environment Variables**, scoped per
environment as noted. Never commit real values to git — `.env.local` is
gitignored for this reason.

Legend: 🔒 server-only (must NOT be prefixed `NEXT_PUBLIC_`) · 🌐 public (safe in the browser bundle).

## Dev (all branches except `main` and `uat`, i.e. every PR/preview deploy)

Vercel scope: **Preview** (default, unscoped — applies to every non-`main`,
non-`uat` branch automatically).

| Variable | Value | Notes |
|---|---|---|
| 🌐 `NEXT_PUBLIC_SUPABASE_URL` | `https://ggjvpfivyqartvanvhzq.supabase.co` | Dev Supabase project (`gesa-dev`) |
| 🌐 `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_pwqblE4IsgIS51akreuPwA_vdrHnYza` | Publishable key. Legacy anon JWT also works if a library needs it: see note below |
| 🔒 `SUPABASE_SERVICE_ROLE_KEY` | *(get from Supabase Dashboard → gesa-dev → Project Settings → API)* | Not fetchable by me — grab it yourself |
| 🔒 `RESEND_API_KEY` | *(your Resend dev/test API key)* | Leave blank to keep emails no-op'd (current behavior) |
| 🔒 `RESEND_FROM_EMAIL` | `GESA <no-reply@gesa.org>` | Needs a domain verified in Resend before real sends work |
| 🔒 `GESA_CONTACT_INBOX` | your team inbox | Where contact-form notifications land |
| 🌐 `NEXT_PUBLIC_SITE_URL` | `https://<your-preview-domain>.vercel.app` | Vercel sets a per-deploy URL automatically; leave blank to let the app fall back, or use `VERCEL_URL` |
| 🌐 `NEXT_PUBLIC_APP_ENV` | `development` | |

## UAT (branch `uat`)

Vercel scope: **Preview, branch-scoped to `uat`** (Settings → Environment
Variables → add variable → Environments: Preview → Git Branch: `uat`. This
works on the free Hobby plan — branch-scoped Preview vars don't require Pro.)

**Blocked:** there's no `gesa-uat` Supabase project yet — the org
(`gesa.org26@gmail.com`) is capped at 2 projects on the free plan and both
slots are used (Prod + Dev). Until you upgrade the org plan or pause/delete a
project and I create `gesa-uat`, **point the `uat` branch's vars at the Dev
project** (same values as the Dev table above) so the branch still deploys and
works — just against Dev data. Swap them to the real UAT project's URL/keys
the moment it exists; nothing else about the pipeline needs to change.

## Production (branch `main`)

Vercel scope: **Production**.

| Variable | Value | Notes |
|---|---|---|
| 🌐 `NEXT_PUBLIC_SUPABASE_URL` | `https://iddeoavrlnvwwfopsacy.supabase.co` | Production Supabase project — **holds real therapist/inquiry data** |
| 🌐 `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_De4l1-DwnjFhvCFP2SWPew_gHatlxs3` | Publishable key |
| 🔒 `SUPABASE_SERVICE_ROLE_KEY` | *(get from Supabase Dashboard → Production project → Project Settings → API)* | Grab yourself, same as Dev |
| 🔒 `RESEND_API_KEY` | *(your Resend production API key)* | |
| 🔒 `RESEND_FROM_EMAIL` | `GESA <no-reply@gesa.org>` | |
| 🔒 `GESA_CONTACT_INBOX` | your team inbox | |
| 🌐 `NEXT_PUBLIC_SITE_URL` | `https://gesa.org` (or whatever domain you point at this Vercel project) | |
| 🌐 `NEXT_PUBLIC_APP_ENV` | `production` | |

**Before going live on `main`:** the Production Supabase project currently has
the `handle_new_user()` trigger, RLS policies, and content tables from Phase
3–4 applied — but it was never rebuilt with the `testimonials` /
`legal_pages` / `site_content` / `group_registrations` tables the way Dev was
(those migrations were applied to `gesa-dev` only). **Action needed from you
before the first production deploy:** ask me to re-run the same Phase 3/4
migrations against the Production project (`iddeoavrlnvwwfopsacy`), or confirm
you want to do that yourself — I did not touch Production's schema without
your explicit go-ahead.

## A note on the anon key format

Supabase now issues two key types: the newer `sb_publishable_...` key and the
legacy JWT-style `anon` key. Both work with `@supabase/supabase-js`. I've
listed the publishable key above since Supabase recommends it for new
projects; if you hit any issue, the legacy JWT anon key is also available in
the same Dashboard → API screen as a drop-in replacement.
