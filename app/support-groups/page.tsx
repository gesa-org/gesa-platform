// Phase 219 — Roy asked for this page's full content to move onto Find
// Support (app/find-your-therapist/page.tsx), transferred exactly as it
// existed, and for this route to be left intentionally empty afterward.
// Route stays live (not redirected/removed) — no 404, shared header/footer
// still render via the root layout, just no page-specific content. The
// "Community" nav link (unchanged this phase) continues to open this page.
export const metadata = {
  title: "Community — GESA",
};

export default function SupportGroupsPage() {
  return null;
}
