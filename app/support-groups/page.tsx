import SupportGroupsInteractive from "@/components/SupportGroupsInteractive";
import { getSupportGroups } from "@/lib/queries";

export const revalidate = 60;

export default async function SupportGroupsPage() {
  const groups = await getSupportGroups();

  return (
    <section className="section wrap">
      <div className="text-center">
        <span className="eyebrow">Support Groups</span>
        <h1 className="my-2.5 text-[38px]">Facilitated circles for collective healing</h1>
        <p className="mx-auto max-w-[640px] text-muted-fg">
          Online and in-person groups, guided by verified facilitators. You are welcome exactly as
          you are.
        </p>
      </div>
      <SupportGroupsInteractive groups={groups} />
    </section>
  );
}
