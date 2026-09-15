// Phase 215 — Roy asked for the full About/Find-Support content (Hero with
// the AI Matching CTA, How GESA Works, founder spotlight, Team & Advisors,
// donate band — everything this file rendered since Phase 145) to move to
// `/about` instead (see app/about/page.tsx, now byte-for-byte what used to
// be here), so that "About" is a genuinely distinct page from Home rather
// than a nav item that just links to "/". This route stays live rather
// than being removed or turned into a redirect — any existing bookmark or
// external link to `/find-your-therapist` still resolves to a real page —
// but is now intentionally empty: no heading, no cards, no duplicate of
// the content that moved to About. The global site shell (header, footer,
// accessibility widget, crisis button) still renders around this, exactly
// as it does for every route — that's all wired in app/layout.tsx, not
// per-page, so an empty page body here doesn't lose any of it.
//
// This page is deliberately NOT registered in
// lib/ui-builder/pageRegistry.ts's PAGE_DEFINITIONS: it has no content of
// its own for an admin to edit, so there is nothing to register — the
// "about" pageKey's two site_content keys (page_about_hero/
// page_about_sections) moved with the content itself to `/about`.
export const metadata = {
  title: "Find Support — GESA",
};

export default function FindYourTherapistPage() {
  return null;
}
