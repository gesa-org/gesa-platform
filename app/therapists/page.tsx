import { Users } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import TherapistsDirectory from "@/components/TherapistsDirectory";
import { getActiveTherapists } from "@/lib/queries";

export const revalidate = 60;

export default async function TherapistsPage() {
  const therapists = await getActiveTherapists();

  return (
    <>
      <PageHero
        icon={Users}
        eyebrow="Our Specialists"
        title="Verified volunteer therapists"
        description="Browse our network of verified volunteer therapists. Search and filter to find the right fit, then open a profile to read more and book."
      />
      <section className="section wrap pt-0">
        <TherapistsDirectory therapists={therapists} />
      </section>
    </>
  );
}
