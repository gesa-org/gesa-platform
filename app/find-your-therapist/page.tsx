import { Sparkle } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import MatchWizard from "@/components/match/MatchWizard";
import { getActiveClinicLocations } from "@/lib/queries";

export const metadata = {
  title: "Find Your Therapist — GESA",
  description: "A short, guided match to a verified volunteer therapist based on your needs and preferences.",
};

export default async function FindYourTherapistPage() {
  const clinicLocations = await getActiveClinicLocations();

  return (
    <>
      <PageHero
        icon={Sparkle}
        eyebrow="Find Your Therapist"
        title="A guided match, just for you"
        description="Answer a few quick questions and we'll match you with a verified volunteer therapist suited to your needs — free, confidential, and no account required."
      />
      <section className="section wrap pt-0">
        <MatchWizard clinicLocations={clinicLocations} />
      </section>
    </>
  );
}
