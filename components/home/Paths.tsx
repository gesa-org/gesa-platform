import Link from "next/link";
import Image from "next/image";
import { Sparkle, ShieldCheck, HeartHandshake, Users } from "lucide-react";
import HighlightedText from "@/components/ui/HighlightedText";
import type { HomeContent } from "@/lib/content";

export const HOME_CONTENT_FALLBACK: HomeContent = {
  published: true,
  eyebrow: "A global volunteer support alliance",
  title: "Two clicks to a therapist who understands",
  highlight: "",
  subtitle:
    "GESA (Global Emotional Support Alliance) connects you with a verified volunteer therapist for a free, confidential session — no forms, no accounts, no questions upfront. Choose the path below that fits you and confirm.",
  badge1Label: "Verified Professionals",
  badge2Label: "100% Free Sessions",
  badge3Label: "Global Community",
  footerNote: "Free, confidential sessions · verified volunteer therapists · secure communication",
  card1Title: "In crisis right now",
  card1Description:
    "For anyone shaken by war, terror, or disaster. Fast, gentle help when you can't wait — approximately six free sessions to start.",
  card1CtaLabel: "Reach out now",
  card1CtaLink: "/intake?path=crisis",
  card2Title: "Veterans, reservists & families",
  card2Description:
    "For the long shadow of service — adjustment, ongoing stress, trauma, and the strain on families. Unlimited free sessions for veterans and reservists; families receive a structured package of sessions.",
  card2CtaLabel: "Reach out now",
  card2CtaLink: "/intake?path=veteran",
  card3Title: "Seeking support",
  card3Description: "For anyone carrying anxiety, ongoing stress, or the weight of antisemitism. Start here — more is coming.",
  card3CtaLabel: "Reach out now",
  card3CtaLink: "/intake?path=general",
};

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
//
// Phase 21 — the Veterans photo is landscape (a veteran, his wife, and
// daughter spread across the full frame) while Crisis and Support are
// portrait, so any crop that fit the same narrow 1-of-3 column as the
// other two cut someone out — first the button, then the daughter's face.
// Gave it a full-width row instead so nothing was cropped.
//
// Phase 22 — Roy asked for the three cards back in one straight row.
// Reverted to a single 3-column grid, kept the Veterans card visible
// end-to-end via object-contain on a navy fill rather than cropping anyone
// out — but that shrank the whole composite (photo + text + button
// together) to fit the letterbox, so it looked visibly smaller than the
// other two full-bleed cards.
//
// Phase 23 — Roy provided a new, tighter crop of the veteran/wife/daughter
// (already close to the card's own aspect ratio, so it fills the frame
// edge-to-edge with no letterboxing and no one cut off). That photo had no
// badge/heading/description/button baked in like Crisis and Support do, so
// one was composed onto it (matching font, sizing, and the same white-pill
// button style as the other two cards) rather than leaving it a bare photo
// or falling back to a mismatched live-HTML overlay. All three cards are
// back to the exact same treatment: one full-bleed image, object-cover,
// same card height — genuinely consistent, not just visually similar.
//
// Phase 30 — this section is now the Home page's landing interface. The old
// Hero (headline, photo, trust badges) moved to the About page, so this is
// the first thing a visitor sees here — it needed to carry more of the
// "what is GESA, why should I trust it" weight than it used to as a
// mid-page section that assumed a hero above it. Added the same eyebrow
// badge style and trust-badge row Hero used to show (verified/free/global),
// sized the heading like a real landing headline, and gave the section
// hero-level top spacing instead of a plain mid-page section's padding.
// The card photo (fixed by position, not editable — see the Phase 19
// comment block above) is the only thing here that stays code-managed.
// Everything else per card now comes from `content` (Content Manager key
// "page_home").
const PATH_IMAGES = [
  "/images/paths/crisis-optimized.jpg",
  "/images/paths/veterans-composed.jpg",
  "/images/paths/seeking-support-optimized.jpg",
];

// Phase 35 — the top banner (eyebrow/headline/subtitle) is Content
// Manager-editable via site_content key "page_home", with these exact
// current strings seeded as the value so publishing changes nothing until
// an admin actually edits them.
//
// Phase 35 (round 2) — the trust badges, the closing note, and the three
// path cards' title/description/CTA/link are now editable too. The cards'
// visible on-photo text still can't change without new artwork (see
// HOME_CONTENT_FALLBACK's comment) — only the CTA link genuinely changes
// what a visitor sees happen when they click.
export default function Paths({ content = HOME_CONTENT_FALLBACK }: { content?: HomeContent }) {
  const cards = [
    { title: content.card1Title, description: content.card1Description, ctaLabel: content.card1CtaLabel, ctaLink: content.card1CtaLink },
    { title: content.card2Title, description: content.card2Description, ctaLabel: content.card2CtaLabel, ctaLink: content.card2CtaLink },
    { title: content.card3Title, description: content.card3Description, ctaLabel: content.card3CtaLabel, ctaLink: content.card3CtaLink },
  ];

  return (
    <section aria-labelledby="paths-heading" className="relative overflow-hidden pt-16 pb-16 md:pt-20">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-accent-soft opacity-50 blur-[110px]" />
      </div>

      <div className="wrap relative z-10">
        <div className="text-center">
          <span className="relative mb-5 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-4 py-1.5 text-[13px] font-semibold text-primary">
            <Sparkle size={13} /> {content.eyebrow}
          </span>
          <h1
            id="paths-heading"
            className="mx-auto mb-4 max-w-[820px] font-serif text-[clamp(32px,4.6vw,50px)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground"
          >
            <HighlightedText text={content.title} highlight={content.highlight} />
          </h1>
          <p className="mx-auto max-w-[620px] text-[17px] leading-[1.55] text-muted-fg">{content.subtitle}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-6 text-[14px] font-medium text-muted-fg">
            <span className="flex items-center gap-2">
              <ShieldCheck className="text-accent" size={18} /> {content.badge1Label}
            </span>
            <span className="flex items-center gap-2">
              <HeartHandshake className="text-accent" size={18} /> {content.badge2Label}
            </span>
            <span className="flex items-center gap-2">
              <Users className="text-accent" size={18} /> {content.badge3Label}
            </span>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {cards.map((p, i) => (
            <Link
              key={i}
              href={p.ctaLink}
              aria-label={`${p.ctaLabel} — ${p.title}: ${p.description}`}
              className="group relative block h-[420px] overflow-hidden rounded-[24px] shadow-lg transition-shadow hover:shadow-2xl"
            >
              <Image
                src={PATH_IMAGES[i]}
                alt={`${p.title} — ${p.description}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-[13px] text-muted-fg">{content.footerNote}</p>
      </div>
    </section>
  );
}
