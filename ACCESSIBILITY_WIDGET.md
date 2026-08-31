# Accessibility Widget — integration guide

Built from scratch for Phase 90. No third-party accessibility-widget code, assets, or branding was copied —
the launcher icon, cursor, and every behavior are original to this codebase.

## 1. File-by-file guide

| File | Purpose |
|---|---|
| `lib/accessibility/config.ts` | Single source of truth: types, defaults, the localStorage key, and the config-driven control lists the panel maps over. |
| `components/accessibility/AccessibilityProvider.tsx` | State + context (`useAccessibility()`), localStorage load/persist, applies settings to `<html>` as classes/data-attributes/CSS variables, `reset()`. |
| `components/accessibility/AccessibilityWidget.tsx` | The launcher button + "Accessibility Adjustments" dialog: open/close, focus management, focus trap, Escape, click-outside, admin-route exclusion. |
| `components/accessibility/AccessibilityIcon.tsx` | Original human-figure SVG glyph used inside the launcher. |
| `components/accessibility/ReadingOverlays.tsx` | The Reading Line / Reading Mask pointer-tracking overlay elements. |
| `components/accessibility/sections/LanguageSection.tsx` | Language dropdown — calls the site's real `useTranslation().setLanguage()`. |
| `components/accessibility/sections/ContentModulesSection.tsx` | Font Size / Line Height (3-way) + Readable Font / Big Cursor / Letter Spacing / Align Text / Font Weight toggles. |
| `components/accessibility/sections/ColorModulesSection.tsx` | Light Contrast / High Contrast / Monochrome — mutually exclusive. |
| `components/accessibility/sections/OrientationModulesSection.tsx` | Reading Line / Reading Mask / Hide Images / Highlight Content / Stop Animations / Highlight Links toggles. |
| `components/accessibility/sections/SkipToContentSection.tsx` | Skip To Content dropdown (Main Content / Footer). |
| `components/accessibility/sections/ResetSection.tsx` | The Reset Settings CTA. |
| `app/globals.css` | (appended, "Phase 90 — Accessibility Widget" section) — every module's actual CSS. |
| `app/layout.tsx` | Wraps the whole app shell in `AccessibilityProvider`, renders `AccessibilityWidget` globally, adds `id="main-content"`/`tabIndex={-1}` to `<main>`. |
| `components/Footer.tsx` | Adds `id="site-footer"`/`tabIndex={-1}` to `<footer>`. |
| `lib/languages.ts` | Expanded to the full ~51-language list (see "Languages" below). |
| `tests/unit/AccessibilityWidget.test.tsx` | Unit tests — see checklist below for what's covered. |

## 2. How it's wired in

```
app/layout.tsx
  <TranslationProvider>                 (existing — real i18n/RTL engine)
    <AccessibilityProvider>             (new — this widget's state)
      <Header />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <SiteFooterSlot /> → <Footer id="site-footer" tabIndex={-1} />
      <CrisisButton />
      <AccessibilityWidget />           (new — launcher + panel, renders null on /admin/*)
    </AccessibilityProvider>
  </TranslationProvider>
```

Because this sits in the root layout (not any page), no page-level code, CMS content, or route can remove,
hide, or replace it — there's nothing page-level rendering it in the first place. It's excluded only from
`/admin/*` (the internal CRM, not the public site this was asked for — the same convention
`TranslationProvider` already uses for the same reason).

## 3. Config object (languages + settings)

- **Languages** — `lib/languages.ts`'s `LANGUAGES` array (`{ code, label, flag, name }`; English and עברית
  today — briefly expanded to ~51 entries in Phase 90, reverted back to these two in Phase 91 per Roy's
  request). This is the *same* list the header's existing `LanguageSelector` and the account page's language
  `<select>` already use — the widget doesn't duplicate it. Selecting a language calls the real
  `TranslationProvider.setLanguage()`, which walks the page's DOM text and translates it (both entries today
  are instant/free — English is a no-op, Hebrew via the bundled dictionary in `lib/translations/he.ts`).
- **Settings** — `lib/accessibility/config.ts`'s `AccessibilitySettings` type, `DEFAULT_ACCESSIBILITY_SETTINGS`,
  and the `CONTENT_TOGGLE_MODULES` / `COLOR_MODE_OPTIONS` / `ORIENTATION_TOGGLE_MODULES` / `SKIP_TARGET_OPTIONS`
  arrays the panel renders from. Adding a new toggle module is a one-line addition to the relevant array plus
  whatever `applyContentModules`/`applyOrientationModules` needs to do with it.

## 4. Persistence

Everything is stored under a single versioned localStorage key: `site-accessibility-settings-v1`
(`ACCESSIBILITY_STORAGE_KEY`). Bumping the `-v1` suffix in a future change is the migration strategy — old,
differently-shaped stored data is simply never read again, and every visitor picks up the new defaults once
under the new key rather than crashing on an incompatible shape.

## 5. Test checklist

Automated (`tests/unit/AccessibilityWidget.test.tsx`, 8/8 passing):
- [x] Launcher renders with an accessible name and opens/closes the panel on click.
- [x] Escape closes the panel and returns focus to the launcher.
- [x] Widget does not render on `/admin/*` routes.
- [x] A content-module change (Font Size → Increase) persists to localStorage and applies to `<html>`.
- [x] A persisted setting restores correctly into state on the next mount.
- [x] Color modes are mutually exclusive (selecting Monochrome after High Contrast leaves only Monochrome active).
- [x] Skip To Content → Main Content moves real DOM focus and announces "Moved to main content".
- [x] Reset Settings clears every module, removes the localStorage key, and announces completion.

Manual — please verify before/shortly after deploying:
- [ ] **Desktop**: launcher visible bottom-right, above the sticky header, the Crisis Button, and page content on Home/About/Find Your Therapist/Support Groups/Blog/Contact/FAQ.
- [ ] **Mobile** (real device or emulated ≤480px): launcher stays reachable at a ≥44×44px target; panel becomes a bottom sheet; no horizontal scrolling appears anywhere on the page.
- [ ] **Keyboard-only**: Tab to the launcher, Enter/Space opens it, Tab cycles only within the panel while open (focus trap), Shift+Tab from the first control wraps to the last, Escape closes and returns focus to the launcher.
- [ ] **Screen reader** (VoiceOver/NVDA/JAWS): launcher announces "Accessibility options"; panel announces as a dialog titled "Accessibility Adjustments"; every toggle announces its pressed/checked state; Reset and Skip To Content announcements are heard without moving focus away from the control just used.
- [ ] **Persistence after refresh**: toggle several settings, reload the page, confirm they're still applied (and confirm this in a private/incognito window too, since localStorage is empty there — should just fall back to defaults, not error).
- [ ] **Reset behavior**: with several settings active, click Reset Settings — confirm every visual change reverts, `localStorage.getItem("site-accessibility-settings-v1")` is `null` in devtools, and language reverts to English.
- [ ] **RTL**: switch the widget's Language dropdown to עברית (Hebrew) or Arabic — confirm `<html dir="rtl">` and that the panel/launcher still read correctly (they're LTR-agnostic by design, no assumptions about reading direction in their own layout).
- [ ] **Compatibility with existing pages**: confirm the widget doesn't block or shift the Crisis Button, the language picker in the header, or any modal (Volunteer Application, booking modals) — click through a few of these with the accessibility panel open and closed.
- [ ] **200% browser zoom**: confirm the panel remains usable (scrolls internally) and the launcher stays reachable.

## 6. Assumptions and integration points needing your attention

- **Language translation coverage**: English and Hebrew only, per Phase 91 (Roy asked to revert the brief
  Phase 90 expansion to ~51 languages back down to these two). Both flows are already free/instant — English
  is a no-op, Hebrew via the bundled dictionary in `lib/translations/he.ts`. `/api/translate` (Google Cloud
  Translation) still exists for any language typed in directly, but nothing in the UI offers one anymore.
- **Flag icons**: `components/FlagIcon.tsx` already has hand-drawn SVG flags for both current entries
  (English, Hebrew).
- **Stop Animations and Framer Motion**: this toggle's CSS reaches ordinary CSS transitions/animations and
  `scroll-behavior: smooth`, but not this site's Framer-Motion-driven scroll reveals (`components/motion/Reveal.tsx`,
  `StaggerReveal.tsx`) — those already respect the OS-level `prefers-reduced-motion` via their own
  `useReducedMotion()` call, but aren't wired to this specific in-page toggle. Wiring them together (e.g. a
  small shared context both this widget and those motion primitives read) is a reasonable, contained follow-up
  if you want full coverage.
- **Hide Images**: uses `opacity: 0` (not `display:none`/`visibility:hidden`) specifically so images stay in
  the DOM and in the accessibility tree — a screen reader user's access to alt text is unaffected by this
  purely visual, sighted-user-facing toggle. An image can opt out of ever being hidden with a
  `data-a11y-keep-image` attribute (no current image in the codebase needs this, but it's there for a future
  logo/CAPTCHA/form-control image rendered as `<img>`).
- **Positioning next to the existing Crisis Button**: the launcher sits at `bottom: 96px` (84px on narrow
  mobile) specifically to stack cleanly above the site's existing fixed Crisis Button
  (`components/CrisisButton.tsx`, `bottom: 20px`) rather than overlapping it. If either button's size changes
  later, re-check this offset.
