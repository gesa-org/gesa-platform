import Link from "next/link";
import Image from "next/image";
import { Sparkle, ShieldCheck, HeartHandshake, Users, ArrowRight } from "lucide-react";
import HighlightedText from "@/components/ui/HighlightedText";
import Reveal from "@/components/motion/Reveal";
import ScrollText from "@/components/motion/ScrollText";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";
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
// Phase 41 — Roy replaced all three card photos with new artwork (a mixed-
// media piece for Crisis, a boots-and-compass still life for Veterans, a
// hands-in-water piece for Seeking Support), sent as photos of the framed
// pieces rather than clean digital exports. The files that actually made it
// through chat attachment were screenshot-resolution (~370–395px wide) —
// confirmed with Roy that no higher-resolution originals were available
// through this channel, and he opted to proceed with what we had rather
// than wait. They'll render softer than the previous 1400px photography at
// large card sizes; worth swapping in cleaner exports later if Roy gets
// access to the originals. Kept as .png (source format) rather than
// re-encoding to .jpg, since these are small illustrative/mixed-media
// images rather than photos where JPEG's compression would help file size.
//
// The card photo (fixed by position, not editable — see the Phase 19
// comment block above) is the only thing here that stays code-managed.
// Everything else per card now comes from `content` (Content Manager key
// "page_home").
const PATH_IMAGES = [
  "/images/paths/crisis-artwork.png",
  "/images/paths/veterans-artwork.png",
  "/images/paths/seeking-support-artwork.png",
];

// Phase 35 — the top banner (eyebrow/headline/subtitle) is Content
// Manager-editable via site_content key "page_home", with these exact
// current strings seeded as the value so publishing changes nothing until
// an admin actually edits them.
//
// Phase 35 (round 2) — the trust badges, the closing note, and the three
// path cards' title/description/CTA/link are now editable too.
//
// Phase 42 — the Phase 19-era design (one full-bleed photo per card, no
// visible text, since the badge/heading/description/button were baked
// into the photo itself) no longer holds once the photos became the
// Phase 41 artwork, which has no text baked in and isn't the same
// portrait/landscape shape the old full-bleed crop was tuned for. Two
// problems Roy flagged: the cards read as blank/textless, and object-cover
// on a fixed h-[420px] box was cropping the new artwork (especially the
// frame edges) to fill that shape. Rebuilt the card as a normal
// image-then-content layout: the artwork sits in a fixed-height frame with
// object-contain (so the whole piece is always visible, letterboxed rather
// than cropped, on a soft background instead of a hard photo edge), and
// title/description/CTA now render as real, visible text below it —
// exactly the content already stored in `content.card1Title` etc., which
// existed since Phase 35 round 2 but was previously only used for the
// aria-label, never actually shown.
// Phase 45 — layered in the site-wide scroll-motion system here: the
// eyebrow/headline/subtitle/badges fade+rise in with a short stagger (spec
// section 3's "Section heading -> Description -> ... -> CTA" timing), the
// headline itself also gets the subtle scroll-linked drift from
// ScrollText (one of the few "selected major statements" this is applied
// to, per spec section 5), and the three cards use the same
// StaggerGroup/StaggerItem entrance as spec section 7. No content, links,
// or card images changed — this is animation only, layered on the exact
// markup from Phase 42.
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
          <Reveal type="fade-up" distance="sm" duration={0.5}>
            <span className="relative mb-5 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-4 py-1.5 text-[13px] font-semibold text-primary">
              <Sparkle size={13} /> {content.eyebrow}
            </span>
          </Reveal>
          <ScrollText distance={20}>
            <h1
              id="paths-heading"
              className="mx-auto mb-4 max-w-[820px] font-serif text-[clamp(32px,4.6vw,50px)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground"
            >
              <HighlightedText text={content.title} highlight={content.highlight} />
            </h1>
          </ScrollText>
          <Reveal type="fade-up" delay={0.08}>
            <p className="mx-auto max-w-[620px] text-[17px] leading-[1.55] text-muted-fg">{content.subtitle}</p>
          </Reveal>
          <StaggerGroup className="mt-7 flex flex-wrap justify-center gap-6 text-[14px] font-medium text-muted-fg">
            <StaggerItem className="inline-block">
              <span className="flex items-center gap-2">
                <ShieldCheck className="text-accent" size={18} /> {content.badge1Label}
              </span>
            </StaggerItem>
            <StaggerItem className="inline-block">
              <span className="flex items-center gap-2">
                <HeartHandshake className="text-accent" size={18} /> {content.badge2Label}
              </span>
            </StaggerItem>
            <StaggerItem className="inline-block">
              <span className="flex items-center gap-2">
                <Users className="text-accent" size={18} /> {content.badge3Label}
              </span>
            </StaggerItem>
          </StaggerGroup>
        </div>

        <StaggerGroup className="mt-12 grid gap-6 md:grid-cols-3">
          {cards.map((p, i) => (
            <StaggerItem key={i}>
              <div className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-border bg-card shadow-lg transition-shadow hover:shadow-2xl">
                <div className="relative h-[200px] flex-none bg-secondary">
                  <Image
                    src={PATH_IMAGES[i]}
                    alt={`${p.title} artwork`}
                    fill
                    className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-[19px]">{p.title}</h3>
                  <p className="mt-2 flex-1 text-[14.5px] text-muted-fg">{p.description}</p>
                  <Link
                    href={p.ctaLink}
                    className="mt-5 inline-flex items-center justify-center gap-2 self-start rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-fg transition-colors hover:bg-primary-600"
                  >
                    {p.ctaLabel} <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <Reveal type="fade">
          <p className="mt-8 text-center text-[13px] text-muted-fg">{content.footerNote}</p>
        </Reveal>
      </div>
    </section>
  );
}
