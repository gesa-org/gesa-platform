// Phase 217 — Roy asked for every section on this page (the gold Community
// banner + Charity/Professional Services CTAs, the "Why GESA exists"
// mission blurb + three-card pathway navigator, the real support-group
// listing/registration flow, and the "Stories of Healing" testimonials) to
// move to `/find-your-therapist` instead (see that page's own Phase 217
// comment — same components, same content sources, moved verbatim, not
// duplicated). This route stays live rather than being redirected or
// removed, per Roy's explicit "do not automatically redirect it" — the
// "Community" nav link (lib/navigation.ts, untouched by this phase) can
// keep opening this now-empty page for now. The global site shell (header,
// footer, accessibility widget, crisis button) still renders around it via
// app/layout.tsx, exactly as it does for every route.
export const metadata = {
  title: "Community — GESA",
};

export default function SupportGroupsPage() {
  return null;
}
