import { Users } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import TherapistsDirectory from "@/components/TherapistsDirectory";
import { getActiveTherapists } from "@/lib/queries";

export const revalidate = 60;

// Footer reveal effect (Phase 34 — extended from Home in Phase 29): opted
// into the same fixed donate-CTA + footer layer as Home, About, and Support
// Groups (see SiteFooterSlot). This page's content is the opaque cover.
export default async function TherapistsPage() {
  const therapists = await getActiveTherapists();

  return (
    <div className="reveal-page__main">
      <PageHero
        icon={Users}
        eyebrow="Our Specialists"
        title="Verified volunteer therapists"
        description="Browse our network of verified volunteer therapists. Search and filter to find the right fit, then open a profile to read more and book."
      />
      <section className="section wrap pt-0">
        <TherapistsDirectory therapists={therapists} />
      </section>
    </div>
  );
}
