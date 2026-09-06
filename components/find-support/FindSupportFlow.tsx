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
export default function FindSupportFlow({ clinicLocations }: { clinicLocations: Tables<"clinic_locations">[] }) {
  const [showWizard, setShowWizard] = useState(false);

  if (showWizard) {
    return <MatchWizard clinicLocations={clinicLocations} />;
  }
  return <ChoiceScreen onChooseAi={() => setShowWizard(true)} />;
}
