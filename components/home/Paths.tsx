import Link from "next/link";
import Image from "next/image";

// Phase 16 — replaced the scroll-pinned, 300vh-tall crossfade showcase
// (Phase 11/11.1) with a compact, static 3-card grid. Roy's feedback: the
// section was consuming too much of the homepage (each of the 4 paths held
// the viewport pinned for a full screen height of scrolling — 400vh total)
// and "Helping the helpers" was no longer needed, leaving three paths:
// crisis, veterans/reservists/families, and general support.
//
// Phase 19 — Roy sent three finished card designs (built with Claude
// Design) for this section, one per path, each already containing its own
// icon badge, heading, description, and "Reach out now" button baked into
// the image itself. Rendering our own HTML badge/heading/description/button
// on top of these — the approach used since Phase 16 — would have shown
// duplicate text stacked on top of the image's own baked-in text. Instead,
// each card is now just that one image, and the whole card is wrapped in a
// single link (since the button in the image is no longer a real,
// clickable element) with an aria-label carrying the same information a
// screen reader would otherwise get from the separate heading/description/
// button that used to be real DOM text.
//
// The three source files (uploaded as Crisis.jpg / Support.jpg /
// Veterans.jpg) were 2.2–2.5MB each — fine for a one-off download, too
// heavy for a homepage section that loads on every visit. Resized to a
// 1400px-wide max and re-compressed (quality 82) before adding to the
// repo, cutting each file to roughly 160–275KB with no visible quality
// loss at the sizes these cards actually render at.
const PATHS = [
  {
    id: "crisis",
    title: "In crisis right now",
    description:
      "For anyone shaken by war, terror, or disaster. Fast, gentle help when you can't wait — approximately six free sessions to start.",
    ctaLink: "/intake?path=crisis",
    ctaLabel: "Reach out now",
    image: "/images/paths/crisis-optimized.jpg",
  },
  {
    id: "veteran",
    title: "Veterans, reservists & families",
    description:
      "For the long shadow of service — adjustment, ongoing stress, trauma, and the strain on families. Unlimited free sessions for veterans and reservists; families receive a structured package of sessions.",
    ctaLink: "/intake?path=veteran",
    ctaLabel: "Reach out now",
    image: "/images/paths/veterans-optimized-v2.jpg",
  },
  {
    id: "general",
    title: "Seeking support",
    description:
      "For anyone carrying anxiety, ongoing stress, or the weight of antisemitism. Start here — more is coming.",
    ctaLink: "/intake?path=general",
    ctaLabel: "Reach out now",
    image: "/images/paths/seeking-support-optimized.jpg",
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
            <Link
              key={p.id}
              href={p.ctaLink}
              aria-label={`${p.ctaLabel} — ${p.title}: ${p.description}`}
              className="group relative block h-[420px] overflow-hidden rounded-[24px] shadow-lg transition-shadow hover:shadow-2xl"
            >
              <Image
                src={p.image}
                alt={`${p.title} — ${p.description}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-[13px] text-muted-fg">
          Free, confidential sessions · verified volunteer therapists · secure communication
        </p>
      </div>
    </section>
  );
}
