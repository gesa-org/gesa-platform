import { Sparkle } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import MatchWizard from "@/components/match/MatchWizard";
import { getActiveClinicLocations } from "@/lib/queries";
import { getPageContent, FIND_YOUR_THERAPIST_CONTENT_FALLBACK } from "@/lib/content";

export const metadata = {
  title: "Find Your Therapist — GESA",
  description: "A short, guided match to a verified volunteer therapist based on your needs and preferences.",
};

// Phase 80 round 2 — this hero banner had no Content Manager wiring at all;
// now reads from "page_find_your_therapist" via the same SimplePageContent/
// getPageContent pattern every other banner-only page uses (see
// lib/content.ts's SIMPLE_PAGE_ENTRIES registry).
export default async function FindYourTherapistPage() {
  const [clinicLocations, content] = await Promise.all([
    getActiveClinicLocations(),
    getPageContent("page_find_your_therapist", FIND_YOUR_THERAPIST_CONTENT_FALLBACK),
  ]);

  return (
    <>
      <PageHero icon={Sparkle} eyebrow={content.eyebrow} title={content.title} description={content.description} />
      <section className="section wrap pt-0">
        <MatchWizard clinicLocations={clinicLocations} />
      </section>
    </>
  );
}
