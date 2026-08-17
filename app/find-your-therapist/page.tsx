import MatchWizard from "@/components/match/MatchWizard";
import { getActiveClinicLocations } from "@/lib/queries";

export const metadata = {
  title: "Find Your Therapist — GESA",
  description: "A short, guided match to a verified volunteer therapist based on your needs and preferences.",
};

export default async function FindYourTherapistPage() {
  const clinicLocations = await getActiveClinicLocations();

  return (
    <section className="section wrap">
      <div className="mb-8 text-center">
        <span className="eyebrow">Find Your Therapist</span>
        <h1 className="my-2.5 text-[36px]">A guided match, just for you</h1>
        <p className="mx-auto max-w-[560px] text-muted-fg">
          Answer a few quick questions and we&apos;ll match you with a verified volunteer therapist suited to your
          needs — free, confidential, and no account required.
        </p>
      </div>
      <MatchWizard clinicLocations={clinicLocations} />
    </section>
  );
}
