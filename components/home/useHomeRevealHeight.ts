// Phase 34 — this hook was never actually Home-specific (it just measures a
// DOM node's height), and the footer reveal effect it powers now applies to
// About, Our Therapists, and Support Groups too, not just Home. The real
// implementation moved to components/layout/useRevealHeight.ts. This file is
// kept as a thin re-export, rather than deleted, since files already written
// into the synced project folder can't be removed without asking first —
// new code should import from the layout/ path directly.
export { useRevealHeight as useHomeRevealHeight } from "@/components/layout/useRevealHeight";
