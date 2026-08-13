import Link from "next/link";
import { LifeBuoy, Shield, Heart, Users, ArrowRight } from "lucide-react";
import Card from "@/components/ui/Card";

const PRIMARY_PATHS = [
  {
    id: "crisis",
    icon: LifeBuoy,
    title: "In crisis right now",
    description:
      "For anyone shaken by war, terror, or disaster. Fast, gentle help when you can't wait.",
    ctaLink: "/intake?path=crisis",
    ctaLabel: "Book a session",
  },
  {
    id: "veteran",
    icon: Shield,
    title: "Veterans, reservists & families",
    description:
      "For the long shadow of service — adjustment, ongoing stress, trauma, and the strain on families.",
    ctaLink: "/intake?path=veteran",
    ctaLabel: "Book a session",
  },
  {
    id: "general",
    icon: Heart,
    title: "Seeking support",
    description:
      "For anyone carrying anxiety, ongoing stress, or the weight of antisemitism. Start here — more is coming.",
    ctaLink: "/intake?path=general",
    ctaLabel: "Book a session",
  },
];

const ADJACENT_PATH = {
  id: "helpers",
  icon: Users,
  title: "Helping the helpers",
  description: "For therapists and caregivers. When you hold others' pain, your care is free too.",
  ctaLink: "/intake?path=helpers",
  ctaLabel: "Book a session",
};

export default function Paths() {
  return (
    <section className="section wrap" aria-labelledby="paths-heading">
      <div className="text-center">
        <span className="eyebrow">Four paths to support</span>
        <h2 id="paths-heading" className="mx-auto mt-3 mb-2.5 max-w-[760px] text-[34px]">
          Two clicks to support
        </h2>
        <p className="mx-auto max-w-[620px] text-muted-fg">
          Choose your path and confirm — you&apos;ll be matched with a verified volunteer therapist
          for a free, confidential session. No forms, no accounts, no questions upfront.
        </p>
      </div>

      <div className="mt-10 grid gap-[22px] md:grid-cols-3">
        {PRIMARY_PATHS.map((p) => (
          <Card key={p.id} className="flex flex-col">
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-accent-soft text-primary">
              <p.icon size={24} />
            </div>
            <h3 className="mt-3.5 mb-2 text-[19px]">{p.title}</h3>
            <p className="flex-1 text-[14.5px] text-muted-fg">{p.description}</p>
            <Link
              href={p.ctaLink}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[15px] font-semibold text-primary-fg transition-colors hover:bg-primary-600"
            >
              {p.ctaLabel} <ArrowRight size={16} />
            </Link>
          </Card>
        ))}
      </div>

      <div className="mt-5.5 mt-[22px] flex flex-wrap items-center gap-5 rounded-[var(--radius)] border border-transparent bg-clay-soft p-6 md:p-7">
        <div className="flex h-14 w-14 flex-none items-center justify-center rounded-[14px] bg-white/60 text-clay">
          <ADJACENT_PATH.icon size={26} />
        </div>
        <div className="min-w-[220px] flex-1">
          <div className="eyebrow text-clay">A related path</div>
          <h3 className="mt-1 mb-1 text-[19px]">{ADJACENT_PATH.title}</h3>
          <p className="m-0 text-[14.5px] text-muted-fg">{ADJACENT_PATH.description}</p>
        </div>
        <Link
          href={ADJACENT_PATH.ctaLink}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-clay px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#a25835]"
        >
          {ADJACENT_PATH.ctaLabel} <ArrowRight size={16} />
        </Link>
      </div>

      <p className="mt-4.5 mt-[18px] text-center text-[13px] text-muted-fg">
        Up to six free sessions · verified volunteer therapists · secure, confidential communication
      </p>
    </section>
  );
}
