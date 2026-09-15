// Phase 218 — reverting Phase 217 (Roy asked to undo it entirely). This
// page is intentionally empty again, matching its Phase 216 state: the
// Hero/AI Matching/founder/team content that Phase 217 moved here from
// /about has been moved back to app/about/page.tsx, and the transferred
// Community content that Phase 217 appended after it has been moved back to
// app/support-groups/page.tsx. Route stays live (not redirected/removed) —
// same reasoning as every prior "intentionally empty" page this project has
// shipped: no 404, shared header/footer still render via the root layout,
// just no page-specific content.
export const metadata = {
  title: "Find Support — GESA",
};

export default function FindYourTherapistPage() {
  return null;
}
