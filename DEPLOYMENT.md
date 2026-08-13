# Deployment — GitHub + Vercel setup

This is the one part of the whole build I genuinely can't do from here: I have
no GitHub or Vercel connector, and this sandbox's mount of your Downloads
folder has a permanently stuck `.git/index.lock` from an earlier phase (can't
be deleted from here — Operation not permitted). There are **zero commits in
this repo so far**, so the cleanest fix is to reinitialize git from your
machine rather than fight the lock. Nothing is lost — there was nothing
committed to lose.

Everything below is written so you can copy/paste it in order. I've done
everything else (code, migrations, tests, CI config, env var values) — this
doc is just the handoff for the parts that need your accounts.

## 1. Fix git and make the first commit (your machine, not this sandbox)

Open a terminal **in the project folder** (this is what caused the `ENOENT`
error last time — you were in `C:\Users\Coolmax123>` instead):

```bash
cd "C:\Users\Coolmax123\Downloads\GESA Therapists Profile"
del /f .git\index.lock
git add -A
git status --short   # sanity check: should NOT list node_modules, raw root .png files, _b/_d/_g/etc, gesa-website/, gesa-backend-refactor/
git commit -m "Initial commit: GESA platform (Phases 1-5)"
```

The `.gitignore` is already set up to exclude the raw photo dump, old
prototype folders, and scratch files — if `git status --short` still shows
any of those, stop and tell me before committing.

## 2. Create the GitHub repo

1. Go to github.com → New repository → name it (e.g. `gesa-platform`) →
   **do not** initialize with a README/gitignore (you already have both) →
   Create.
2. Copy the remote URL it gives you, then:

```bash
git remote add origin <the-url-github-gave-you>
git branch -M main
git push -u origin main
git checkout -b uat
git push -u origin uat
git checkout main
```

`main` = Production, `uat` = UAT, everything else (feature branches, PRs) =
Dev — matching the CI workflow and the Vercel setup below.

## 3. Add GitHub Actions secrets

The CI workflow (`.github/workflows/ci.yml`) runs E2E tests against the Dev
Supabase project. In the new repo: **Settings → Secrets and variables →
Actions → New repository secret**, add:

| Secret name | Value |
|---|---|
| `DEV_SUPABASE_URL` | `https://ggjvpfivyqartvanvhzq.supabase.co` |
| `DEV_SUPABASE_ANON_KEY` | `sb_publishable_pwqblE4IsgIS51akreuPwA_vdrHnYza` |

(Same Dev values as `ENV_VARS.md` — these are separate from Vercel's env vars
because GitHub Actions and Vercel don't share a secrets store.)

## 4. Create the Vercel project

1. vercel.com → Add New → Project → Import your new GitHub repo.
2. Framework preset: Vercel will auto-detect **Next.js** — leave build/output
   settings on their defaults.
3. Before the first deploy, go to **Settings → Environment Variables** and add
   every variable listed in `ENV_VARS.md`, scoped exactly as that doc
   describes (Production for `main`, Preview branch-scoped to `uat`, plain
   Preview for everything else).
4. Deploy. Vercel will auto-deploy on every push from here on:
   `main` → your production URL, `uat` → a stable preview URL for that branch,
   every other branch/PR → its own preview URL.
5. Once you have a domain, add it under **Settings → Domains** and point it at
   the `main`/Production deployment. Update `NEXT_PUBLIC_SITE_URL` in the
   Production env vars to match.

## 5. What's still blocked on your side after this

- **UAT Supabase project** — can't create a 3rd project until you upgrade the
  org plan or free up a slot (see `ENV_VARS.md`). Until then the `uat` branch
  points at Dev data, which is a working stand-in, not a bug.
- **`SUPABASE_SERVICE_ROLE_KEY`** for both Dev and Production — I can't fetch
  this for you (security). Grab both from each project's Dashboard → Project
  Settings → API.
- **`RESEND_API_KEY`** — not set anywhere yet, so all emails currently
  no-op with a console warning. Get a key from resend.com and verify a sending
  domain before turning this on.
- **Production schema** — the `testimonials`/`legal_pages`/`site_content`/
  `group_registrations` tables and the sign-up trigger were only applied to
  Dev in Phases 3–4, on purpose (didn't want to touch your live Production
  data without asking). Tell me when you're ready and I'll apply the same
  migrations to Production before your first real deploy on `main`.

## 6. Confirming it worked

Once you've pushed and connected Vercel:
- Push a small change to a feature branch → open a PR → confirm the CI
  workflow runs (lint/typecheck/unit) and Vercel posts a preview deployment
  link on the PR.
- Merge to `uat` → confirm CI's `e2e` job runs and Vercel deploys the `uat`
  preview.
- When ready, merge to `main` → confirm CI runs and Vercel promotes to
  Production.
