import Link from "next/link";
import Image from "next/image";
import { Sprout, Footprints, Waves, Sparkle, ShieldCheck, HeartHandshake, Users } from "lucide-react";
import GoldWatermarks from "@/components/ui/GoldWatermarks";
import Reveal from "@/components/motion/Reveal";
import ParallaxLayer from "@/components/motion/ParallaxLayer";
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
  purposeTicker:
    "Because no one should face emotional pain alone\nVerified volunteer therapists, giving their time freely\nUp to six free sessions — cost is never why someone goes without care\nA global community of care, across borders and languages\nConfidential, dignified support, always free at the point of need",
  // Phase 95 — Roy sent a reference image of the three cards restyled as
  // framed artwork with a gold badge + serif title beneath, using art-piece
  // titles ("Grounded" / "Service Remembrance" / "Life from the Deep")
  // instead of the previous audience-descriptive titles ("In crisis right
  // now" etc). Confirmed with Roy: yes, replace the titles; keep the cards
  // fully functional (still link to their intake path) rather than turning
  // them into a non-interactive gallery. Descriptions are unchanged and
  // still carry the full audience context — they're no longer shown as
  // visible card text (the reference design has no description text on the
  // card face), but live on as each card's aria-label, same "whole card is
  // a link, description moves to the accessible name" pattern this section
  // already used before Phase 42 added visible description text.
  card1Title: "Grounded",
  card1Description:
    "For anyone shaken by war, terror, or disaster. Fast, gentle help when you can't wait — approximately six free sessions to start.",
  card1CtaLabel: "Reach out now",
  card1CtaLink: "/intake?path=crisis",
  card2Title: "Service Remembrance",
  card2Description:
    "For the long shadow of service — adjustment, ongoing stress, trauma, and the strain on families. Unlimited free sessions for veterans and reservists; families receive a structured package of sessions.",
  card2CtaLabel: "Reach out now",
  card2CtaLink: "/intake?path=veteran",
  card3Title: "Life from the Deep",
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

// Phase 76 — one badge icon per card, fixed by position (same "code-
// managed, not editable" treatment as PATH_IMAGES above) — chosen to match
// each card's own context. Phase 95 — re-picked to match the new art-piece
// titles in Roy's reference image: a sprouting plant for "Grounded" (growth/
// rootedness), footprints for "Service Remembrance" (military
// boots/journey — closest available lucide icon to the boots-and-sprig
// badge in the reference), and waves for "Life from the Deep" (the ocean
// imagery in that card's artwork and reference badge).
const PATH_BADGE_ICONS = [Sprout, Footprints, Waves];

// Phase 95 — each card's mat/frame color loosely follows Roy's reference
// (cream, sage, and a cool slate-blue mat), built from this site's existing
// palette tokens rather than picking arbitrary new colors, except the third
// mat — no existing token was close to the reference's blue-gray, so that
// one is a new hardcoded value matched to the Footer's own long-standing
// slate-blue text color (#c7d0de) for consistency with a color already
// established elsewhere on the site.
const CARD_STYLES: { mat: string; frame: string }[] = [
  { mat: "bg-clay-soft", frame: "border-clay" },
  { mat: "bg-sage-soft", frame: "border-espresso" },
  { mat: "bg-[#c7d0de]", frame: "border-clay" },
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
//
// Phase 46 — the decorative glow blob behind the headline now drifts
// slightly on scroll via ParallaxLayer (spec section 10's "background
// layer, subtle parallax," separate from the content layer's own reveal
// above it) — a purely cosmetic depth cue, no layout or content change.
//
// Phase 47 — Roy sent a reference mockup for this section: a warm gold
// hero band with the headline on the left and an overlapping "gallery
// wall" of the three path artworks (in individual picture frames) on the
// right, then the three cards below floating slightly up over the seam
// between the gold band and the light section beneath it. Rebuilt the
// hero band and card image area to match, using the exact same three
// existing artwork files (Phase 41) and the exact same `content.*`
// fields, links, and card structure as before — nothing textual, no CTA
// destination, and no card's underlying content changed, only the visual
// presentation around it. The gallery-wall images on the right are purely
// decorative (`aria-hidden`, empty `alt`) since the same three images
// with real, meaningful alt text already appear in the cards below;
// duplicating non-empty alt text for a decorative repeat would be noise
// for screen reader users, not new information. Added `.gold-card-hover`
// (defined in app/globals.css) to each of the three cards per Roy's
// explicit request for "a golden effect hover" on them specifically.
export default function Paths({ content = HOME_CONTENT_FALLBACK }: { content?: HomeContent }) {
  const cards = [
    { title: content.card1Title, description: content.card1Description, ctaLabel: content.card1CtaLabel, ctaLink: content.card1CtaLink },
    { title: content.card2Title, description: content.card2Description, ctaLabel: content.card2CtaLabel, ctaLink: content.card2CtaLink },
    { title: content.card3Title, description: content.card3Description, ctaLabel: content.card3CtaLabel, ctaLink: content.card3CtaLink },
  ];

  return (
    <section aria-labelledby="paths-heading" className="relative overflow-hidden">
      {/* Gold hero band — Phase 47. Phase 70 removed this band's text
          (eyebrow/headline/subtitle/trust badges) and the decorative
          "gallery wall" of the three path artworks entirely, leaving the
          band as a plain color-transition strip. Phase 80 — Roy sent the
          original reference design again and asked for that hero content
          restored: the eyebrow chip, headline, subtitle, and trust badges
          on the left, and the three-artwork gallery wall on the right. The
          `content.eyebrow`/`title`/`subtitle`/`badge*Label` fields were
          never removed from the data model (Phase 70 only stopped
          rendering them), so this simply re-renders the exact same,
          already-editable Content Manager fields — no new content, no new
          Supabase columns. The gallery wall reuses the same three artwork
          files already shown, non-decoratively, in the cards below
          (Phase 41/47), rendered here `aria-hidden` with empty `alt` since
          the meaningful alt text for these images already lives on the
          cards — a duplicated non-empty alt would be noise for screen
          reader users, not new information. The band's `pb-[210px]` (added
          Phase 72 to match the card row's `-mt-[210px]` overlap) is
          untouched — the new hero content simply renders in the band's
          existing top padding/flow, so the gold/light seam the cards
          straddle is unaffected. */}
      <div className="gold-banner relative pt-16 pb-[210px] md:pt-20 md:pb-[210px]">
        <ParallaxLayer speed={50} className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute left-[8%] top-0 h-[420px] w-[560px] rounded-full bg-white/25 blur-[110px]" />
          {/* Phase 67 — same faint line-art watermark texture as About's
              gold Hero band and the gold PageHero banners (Our Therapists,
              Support Groups), for consistency across every gold section. */}
          <GoldWatermarks />
        </ParallaxLayer>

        <div className="wrap relative z-10">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <Reveal type="fade-up">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-espresso">
                  <Sparkle size={15} className="text-clay" aria-hidden="true" />
                  {content.eyebrow}
                </span>
                <h1
                  id="paths-heading"
                  className="mt-6 max-w-xl font-serif text-[clamp(38px,5vw,60px)] leading-[1.08] text-espresso"
                >
                  {content.title}
                </h1>
                <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-espresso/75">{content.subtitle}</p>
                <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-[14px] font-medium text-espresso/80">
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck size={17} className="text-espresso/60" aria-hidden="true" />
                    {content.badge1Label}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <HeartHandshake size={17} className="text-espresso/60" aria-hidden="true" />
                    {content.badge2Label}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Users size={17} className="text-espresso/60" aria-hidden="true" />
                    {content.badge3Label}
                  </span>
                </div>
              </div>
            </Reveal>

            {/* Gallery wall — three overlapping framed artworks, hidden below
                the md breakpoint (same treatment the pre-Phase-70 version
                used) since there isn't room for a decorative image stack
                next to the text on narrow viewports. */}
            <Reveal type="image">
              <div className="relative mx-auto hidden h-[340px] w-full max-w-md md:block" aria-hidden="true">
                <div className="absolute left-0 top-2 h-[210px] w-[210px] -rotate-6 overflow-hidden rounded-2xl border-[6px] border-white shadow-2xl">
                  <Image src={PATH_IMAGES[0]} alt="" fill className="object-cover" />
                </div>
                <div className="absolute right-0 top-20 h-[230px] w-[250px] rotate-3 overflow-hidden rounded-2xl border-[6px] border-espresso shadow-2xl">
                  <Image src={PATH_IMAGES[1]} alt="" fill className="object-cover" />
                </div>
                <div className="absolute bottom-0 left-16 h-[190px] w-[230px] -rotate-3 overflow-hidden rounded-2xl border-[6px] border-clay-soft shadow-xl">
                  <Image src={PATH_IMAGES[2]} alt="" fill className="object-cover" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Cards float up over the gold/light seam — Phase 47, repositioned
          Phase 72 (see the gold band comment above for the -mt-[210px]
          math). */}
      <div className="wrap relative z-10 -mt-[210px] pb-16">
        <StaggerGroup className="grid gap-x-6 gap-y-14 md:grid-cols-3">
          {cards.map((p, i) => {
            const BadgeIcon = PATH_BADGE_ICONS[i] ?? PATH_BADGE_ICONS[PATH_BADGE_ICONS.length - 1];
            const style = CARD_STYLES[i] ?? CARD_STYLES[CARD_STYLES.length - 1];
            return (
              /* Phase 95 — Roy sent a reference image restyling these as
                 framed artwork with a small gold badge + serif title
                 overlapping the frame's bottom edge, replacing the previous
                 3D flip card (painting on the front, description/CTA
                 revealed on hover-flip). The whole card is one link — same
                 "the description lives in the aria-label, not as visible
                 card text" pattern this section used originally (Phase 19),
                 before Phase 42 added visible description text — since the
                 reference design has no description or button on the card
                 face itself, only the artwork, badge, and title. */
              <StaggerItem key={i}>
                <Link
                  href={p.ctaLink}
                  aria-label={`${p.title}: ${p.description}`}
                  className="gold-card-hover group block"
                >
                  <div className={`relative aspect-[4/5] w-full overflow-hidden rounded-2xl border-[6px] shadow-lg transition-transform duration-300 group-hover:-translate-y-1 ${style.mat} ${style.frame}`}>
                    <div className="absolute inset-4 overflow-hidden rounded-md bg-white/50">
                      <Image src={PATH_IMAGES[i]} alt="" aria-hidden="true" fill className="object-contain" />
                    </div>
                  </div>
                  {/* Badge — a small dome overlapping the frame's bottom
                      edge, matching the reference: line-art gold icon near
                      the top, serif title beneath it, both inside the
                      dome shape. */}
                  <div className="relative z-10 mx-auto -mt-9 flex w-[76%] flex-col items-center rounded-t-full bg-[#e7d6a6] px-4 pb-4 pt-6 text-center shadow-md">
                    <BadgeIcon size={26} strokeWidth={1.75} className="mb-1.5 text-clay" aria-hidden="true" />
                    <h3 className="font-serif text-[17px] leading-tight text-espresso">{p.title}</h3>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerGroup>

        {/* Phase 79 — Roy flagged this caption ("The path to emotional
            recovery begins here." — the current published `footerNote`
            value) as too small to read comfortably below the cards.
            Bumped from 13px to 18px and darkened from `text-muted-fg` to
            `text-foreground` with a touch of weight, for real visibility
            rather than reading as fine print. */}
        <Reveal type="fade">
          <p className="mt-8 text-center text-[18px] font-medium text-foreground">{content.footerNote}</p>
        </Reveal>
      </div>
    </section>
  );
}
