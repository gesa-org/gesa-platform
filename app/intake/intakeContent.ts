import type { IntakeFlowContent } from "@/lib/content";

// Phase 80 round 2 — kept in its own small module (rather than colocated in
// app/intake/page.tsx like most other fallbacks) since both the intake page
// itself and the admin Content Manager page need to import it, and a route's
// page.tsx isn't a normal importable module in the App Router.
export const INTAKE_FLOW_CONTENT_FALLBACK: IntakeFlowContent = {
  published: true,
  pathCrisisLabel: "In crisis right now",
  pathVeteranLabel: "Veterans, reservists & families",
  pathGeneralLabel: "Seeking support",
  pathHelpersLabel: "Helping the helpers",
  crisisHeroTitle: "Help is available right now",
  defaultHeroTitle: "You're one step from support",
  crisisDisclaimer: "GESA is not an emergency service. If you are in immediate danger, call your local emergency number.",
  moreHelplinesText: "More helplines at",
  ongoingSupportPrompt: "You can also connect with a volunteer therapist for ongoing, free support.",
  matchListIntro: "Here are volunteer therapists who fit what you shared. Choose one to see their availability and book a free session.",
};
