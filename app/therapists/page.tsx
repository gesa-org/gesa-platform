import TherapistsDirectory from "@/components/TherapistsDirectory";
import { getActiveTherapists } from "@/lib/queries";

export const revalidate = 60;

export default async function TherapistsPage() {
  const therapists = await getActiveTherapists();

  return (
    <section className="section wrap">
      <div className="text-center">
        <span className="eyebrow">Our Specialists</span>
        <h1 className="my-2.5 text-[38px]">Verified volunteer therapists</h1>
        <p className="mx-auto max-w-[640px] text-muted-fg">
          Browse our network of verified volunteer therapists. Search and filter to find the right
          fit, then open a profile to read more and book.
        </p>
      </div>
      <TherapistsDirectory therapists={therapists} />
    </section>
  );
}
