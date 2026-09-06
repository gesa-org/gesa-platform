"use client";

import { useState } from "react";
import ChoiceScreen from "@/components/find-support/ChoiceScreen";
import MatchWizard from "@/components/match/MatchWizard";
import type { Tables } from "@/lib/database.types";

// Phase 142 — the client-side toggle between the choice screen and the AI
// Support wizard. Kept as its own small client component (rather than
// making the whole find-your-therapist page a client component) so the page
// itself can stay a Server Component for its content-fetching/editor-
// preview wiring.
//
// Phase 151 — `onChooseBrowse` passes straight through to ChoiceScreen
// unchanged; this component doesn't need to react to it itself (unlike
// `onChooseAi`, which swaps this component's own rendered step) since the
// Browse Therapist modal it opens lives one level up, at HeroFindSupportCta
// — see that file's own comment for why.
export default function FindSupportFlow({
  clinicLocations,
  onChooseBrowse,
}: {
  clinicLocations: Tables<"clinic_locations">[];
  onChooseBrowse: () => void;
}) {
  const [showWizard, setShowWizard] = useState(false);

  if (showWizard) {
    return <MatchWizard clinicLocations={clinicLocations} />;
  }
  return <ChoiceScreen onChooseAi={() => setShowWizard(true)} onChooseBrowse={onChooseBrowse} />;
}
