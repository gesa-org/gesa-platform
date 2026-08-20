import { Users2 } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import SupportGroupsInteractive from "@/components/SupportGroupsInteractive";
import { getSupportGroups } from "@/lib/queries";

export const revalidate = 60;

// Footer reveal effect (Phase 34 — extended from Home in Phase 29): opted
// into the same fixed donate-CTA + footer layer as Home, About, and Our
// Therapists (see SiteFooterSlot). This page's content is the opaque cover.
export default async function SupportGroupsPage() {
  const groups = await getSupportGroups();

  return (
    <div className="reveal-page__main">
      <PageHero
        icon={Users2}
        eyebrow="Support Groups"
        title="Facilitated circles for collective healing"
        description="Online and in-person groups, guided by verified facilitators. You are welcome exactly as you are."
      />
      <section className="section wrap pt-0">
        <SupportGroupsInteractive groups={groups} />
      </section>
    </div>
  );
}
