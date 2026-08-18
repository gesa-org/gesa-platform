import { Users2 } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import SupportGroupsInteractive from "@/components/SupportGroupsInteractive";
import { getSupportGroups } from "@/lib/queries";

export const revalidate = 60;

export default async function SupportGroupsPage() {
  const groups = await getSupportGroups();

  return (
    <>
      <PageHero
        icon={Users2}
        eyebrow="Support Groups"
        title="Facilitated circles for collective healing"
        description="Online and in-person groups, guided by verified facilitators. You are welcome exactly as you are."
      />
      <section className="section wrap pt-0">
        <SupportGroupsInteractive groups={groups} />
      </section>
    </>
  );
}
