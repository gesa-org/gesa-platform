import Link from "next/link";
import Image from "next/image";
import { LifeBuoy, Shield, Heart, ArrowRight } from "lucide-react";

// Phase 16 — replaced the scroll-pinned, 300vh-tall crossfade showcase
// (Phase 11/11.1) with a compact, static 3-card grid. Roy's feedback: the
// section was consuming too much of the homepage (each of the 4 paths held
// the viewport pinned for a full screen height of scrolling — 400vh total)
// and "Helping the helpers" was no longer needed, leaving three paths:
// crisis, veterans/reservists/families, and general support.
//
// Each card now carries its own on-theme background photo (same images used
// before) with a gradient overlay for legibility, plus a soft decorative
// blur behind the section header to match the modernized look used
// elsewhere on the site (see components/ui/PageHero.tsx). No scroll
// listeners, no requestAnimationFrame loop, no pinned height — just a
// normal section that takes only as much vertical space as its content.
const PATHS = [
  {
    id: "crisis",
    icon: LifeBuoy,
    title: "In crisis right now",
    description:
      "For anyone shaken by war, terror, or disaster. Fast, gentle help when you can't wait — approximately six free sessions to start.",
    ctaLink: "/intake?path=crisis",
    ctaLabel: "Reach out now",
    badgeClass: "bg-destructive text-white",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "veteran",
    icon: Shield,
    title: "Veterans, reservists & families",
    description:
      "For the long shadow of service — adjustment, ongoing stress, trauma, and the strain on families. Unlimited free sessions for veterans and reservists; families receive a structured package of sessions.",
    ctaLink: "/intake?path=veteran",
    ctaLabel: "Reach out now",
    badgeClass: "bg-primary-600 text-white",
    image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "general",
    icon: Heart,
    title: "Seeking support",
    description:
      "For anyone carrying anxiety, ongoing stress, or the weight of antisemitism. Start here — more is coming.",
    ctaLink: "/intake?path=general",
    ctaLabel: "Reach out now",
    badgeClass: "bg-accent text-white",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function Paths() {
  return (
    <section aria-labelledby="paths-heading" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-accent-soft opacity-50 blur-[110px]" />
      </div>

      <div className="section wrap relative z-10">
        <div className="text-center">
          <span className="eyebrow">Three paths to support</span>
          <h2 id="paths-heading" className="mx-auto mt-3 mb-2.5 max-w-[760px] text-[34px]">
            Two clicks to support
          </h2>
          <p className="mx-auto max-w-[620px] text-muted-fg">
            Choose your path and confirm — you&apos;ll be matched with a therapist who understands,
            for a free, confidential session. No forms, no accounts, no questions upfront.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PATHS.map((p) => (
            <div
              key={p.id}
              className="group relative flex h-[420px] flex-col justify-end overflow-hidden rounded-[24px] shadow-lg transition-shadow hover:shadow-2xl"
            >
              <Image
                src={p.image}
                alt={p.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/5" />

              <div className="relative z-10 flex flex-col p-6">
                <div className={`mb-3.5 flex h-[46px] w-[46px] items-center justify-center rounded-[12px] ${p.badgeClass}`}>
                  <p.icon size={22} />
                </div>
                <h3 className="mb-1.5 text-[19px] text-white">{p.title}</h3>
                <p className="mb-4 text-[13.5px] leading-[1.5] text-white/85">{p.description}</p>
                <Link
                  href={p.ctaLink}
                  className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-primary transition-colors hover:bg-white/90"
                >
                  {p.ctaLabel} <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-[13px] text-muted-fg">
          Free, confidential sessions · verified volunteer therapists · secure communication
        </p>
      </div>
    </section>
  );
}
