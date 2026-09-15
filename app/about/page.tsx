// Phase 217 — Roy asked for the Community page's content to move onto Find
// Support, and confirmed (via AskUserQuestion, since this created a genuine
// conflict) that Find Support's own AI Matching/founder/team content —
// which had briefly moved here in Phase 216 — should move back to
// `/find-your-therapist` rather than staying here duplicated across two
// pages. That leaves this route with nothing of its own again: same
// intentionally-empty treatment Phase 216 used for `/find-your-therapist`
// at the time — the route stays live (no redirect, no removal) so any
// bookmark/link to `/about` still resolves, and the global site shell
// (header, footer, accessibility widget, crisis button) still renders
// around it via app/layout.tsx, exactly as it does for every route.
//
// This is a real trade-off, flagged directly rather than decided silently:
// the "About" nav link (lib/navigation.ts) still points at `/about`, so it
// currently opens this empty page. Roy may want that nav item repointed
// (e.g. back to "/", or removed, or given new content of its own) — left
// untouched here since it wasn't part of this request, but worth raising.
export const metadata = {
  title: "About — GESA",
};

export default function AboutPage() {
  return null;
}
