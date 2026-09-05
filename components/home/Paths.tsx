import Link from "next/link";
import { ArrowRight, LifeBuoy, Award, Sparkles, Sparkle, ShieldCheck, HeartHandshake, Users, Sprout, Tags, Waves } from "lucide-react";
import GoldWatermarks from "@/components/ui/GoldWatermarks";
import Reveal from "@/components/motion/Reveal";
import ParallaxLayer from "@/components/motion/ParallaxLayer";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";
import GesaMark, { type GesaMarkColors } from "@/components/home/GesaMark";
import type { HomeContent } from "@/lib/content";
import EditableText from "@/components/ui-builder/public/EditableText";

// Phase 133 — content-ID prefixes for the three path cards, matching
// lib/ui-builder/pageRegistry.ts's HOME_EDITABLE_FIELDS exactly (e.g.
// "home.crisis-card.title"). Indexed the same way `cards`/`PATH_FRONT_STYLES`
// already are (0 = crisis, 1 = veterans, 2 = support) so adding a fourth
// card later just means extending both this array and the registry in
// lockstep, in the same order.
const CARD_CONTENT_KEYS = ["crisis-card", "veterans-card", "support-card"];

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
  // Phase 97 — front-face badge labels (see the HomeContent type comment
  // in lib/content.ts).
  // Phase 100 — Roy sent a new reference image for the front face (see the
  // GesaMark component below) whose own gold badges read "CRISIS,"
  // "VETERANS," and "SJPPORT" (a typo for "SUPPORT") — matching each card's
  // actual category rather than an abstract art-piece name, so these three
  // labels changed to match that reference exactly, corrected for the typo.
  card1FrontLabel: "Crisis",
  card2FrontLabel: "Veterans",
  card3FrontLabel: "Support",
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
//
// Phase 121 — the three actual card faces below use GesaMark (an abstract
// recolored mark, see PATH_FRONT_STYLES further down), not photos — the
// only place these three artwork files (crisis/veterans/seeking-support)
// ever actually rendered was a separate, purely decorative "gallery wall"
// in the gold hero band above this grid. Roy asked for that hero band's
// artwork removed entirely and the hero text centered instead, so the
// `PATH_IMAGES` array that fed that gallery wall, and the `next/image`
// import it was the only user of, are both gone along with it.

// Phase 76 — one badge icon per card back face, fixed by position (same
// "code-managed, not editable" treatment used elsewhere on this page) —
// chosen to match each card's own context: a life ring for the crisis path
// (urgent, keep-afloat help), a service medal for veterans/reservists/
// families, and a sparkling sprig for general/seeking support (closest
// available lucide icon to the laurel-sprig badge in Roy's reference
// design).
const PATH_BADGE_ICONS = [LifeBuoy, Award, Sparkles];

// Phase 97 — Roy sent a reference image restyling each card's *front* face
// (visible before hover/flip) as framed artwork with a small gold badge
// overlapping the frame's bottom edge — explicitly keeping the flip effect
// and the back face's existing content untouched, only the front face's
// look changes. Icons here are separate from PATH_BADGE_ICONS above (which
// stay on the unchanged back face).
// Phase 100 — front labels changed from art-piece names to each card's own
// category ("Crisis"/"Veterans"/"Support" — see HOME_CONTENT_FALLBACK), so
// the icons were re-picked to match: a sprouting plant stays for "Crisis"
// (matches the reference badge's small leaf glyph), swapped footprints for
// "Tags" on "Veterans" (the reference badge shows two overlapping tag/
// dog-tag shapes — closer to actual military dog tags than footprints
// were), and waves stays for "Support" (matches the reference's tilde/wave
// glyph and that card's own artwork).
const PATH_FRONT_BADGE_ICONS = [Sprout, Tags, Waves];

// Phase 97 — each card's mat/frame color loosely followed Roy's first
// reference (cream, sage, and a cool slate-blue mat around a painting).
// Phase 100 — Roy sent a new reference replacing the painting entirely with
// an abstract "swirl" mark (see components/home/GesaMark.tsx) recolored per
// card on a solid, more saturated background — cream, a true olive-green
// (this site's existing `--accent` token, described in globals.css as
// "Sage/Olive," is exactly this tone and was previously only used for small
// accents, not a full card background), and a deeper slate-blue. All three
// cards use the same gold border in the new reference (not alternating
// clay/espresso like Phase 97's mat), so `frame` is now one shared value.
// `mark` supplies GesaMark's four ring/dot colors, picked to echo each
// card's own background the way the reference's three mark recolors do —
// none of these four-per-card tones exist as design tokens already, so
// (consistent with Phase 97's own precedent of hardcoding the one color no
// token fit) they're hardcoded here rather than force-fit to existing ones.
//
// Phase 106 — GesaMark's shape changed from the Phase 100 approximation to
// a real trace of the actual site logo, which has one ring fewer visual
// "gap" than the approximation did — recolored these four-per-card values
// (verified by rendering each card's own palette to PNG before landing on
// these) so every ring still reads as a distinct tone against its own
// card's background, not just carried over from the old shape unchanged.
// Phase 131 — Roy sent a reference image of the Crisis card with a light
// sky-blue mat instead of the cream `bg-clay-soft` it had been using, and
// asked for that exact color matched. Sampled directly from his image
// (#aed0e9) rather than reusing an existing token — none of the site's blue
// tokens (--secondary/--muted #b7c3d6, --slate-banner #aab8c5) are this
// light/saturated a sky blue, and he was explicit about matching the
// picture, not approximating. Hardcoded as an arbitrary Tailwind value,
// consistent with card 3 below (`bg-[#5f7a91]`) already doing the same
// thing for a color with no existing token. The mark's ring colors
// (sage/tan/terracotta) were already a close match to the reference and
// were left untouched — only the card's background changed.
const PATH_FRONT_STYLES: { bg: string; frame: string; mark: GesaMarkColors }[] = [
  {
    bg: "bg-[#aed0e9]",
    frame: "border-clay",
    mark: { outerRing: "#9db99f", middleRing: "#d9a98c", innerRing: "#c1694f", dot: "#c1694f" },
  },
  {
    bg: "bg-accent",
    frame: "border-clay",
    mark: { outerRing: "#dbe2e7", middleRing: "#e8c9a0", innerRing: "#c1694f", dot: "#c1694f" },
  },
  {
    bg: "bg-[#5f7a91]",
    frame: "border-clay",
    mark: { outerRing: "#f0d9e8", middleRing: "#f5e08a", innerRing: "#e0955c", dot: "#e0955c" },
  },
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
    { title: content.card1Title, description: content.card1Description, ctaLabel: content.card1CtaLabel, ctaLink: content.card1CtaLink, frontLabel: content.card1FrontLabel },
    { title: content.card2Title, description: content.card2Description, ctaLabel: content.card2CtaLabel, ctaLink: content.card2CtaLink, frontLabel: content.card2FrontLabel },
    { title: content.card3Title, description: content.card3Description, ctaLabel: content.card3CtaLabel, ctaLink: content.card3CtaLink, frontLabel: content.card3FrontLabel },
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
          Supabase columns.
          Phase 121 — Roy sent a screenshot of this exact section (referring
          to it as "the About page" — this is the page the header's "About"
          nav item actually links to, `/`, a Phase 88 relabeling; the
          literal `/about` URL is labeled "Find Support" in the nav and is a
          different component, `components/Hero.tsx`) and asked for the
          gallery-wall artwork removed entirely and the remaining text
          centered, with no replacement image content. The old
          `grid md:grid-cols-2` (text column left, gallery wall right) is
          now a single centered column, `mx-auto max-w-[52rem] text-center`
          — same centering approach used on `/about`'s own hero for the
          same kind of request. The gallery wall `<div>`, its three
          `next/image` calls, the `PATH_IMAGES` array that fed them, and the
          `next/image` import are all gone (see this file's Phase 121
          comment above `PATH_BADGE_ICONS`). The band's `pb-[210px]` (added
          Phase 72 to match the card row's `-mt-[210px]` overlap) is
          untouched — the gold/light seam the cards below straddle is
          unaffected by this change. */}
      <div className="gold-banner relative pt-16 pb-[210px] md:pt-20 md:pb-[210px]">
        <ParallaxLayer speed={50} className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute left-1/2 top-0 h-[420px] w-[560px] -translate-x-1/2 rounded-full bg-white/25 blur-[110px]" />
          {/* Phase 67 — same faint line-art watermark texture as About's
              gold Hero band and the gold PageHero banners (Our Therapists,
              Support Groups), for consistency across every gold section. */}
          <GoldWatermarks />
        </ParallaxLayer>

        <div className="wrap relative z-10">
          <Reveal type="fade-up" as="div" className="mx-auto max-w-[52rem] text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-espresso">
              <Sparkle size={15} className="text-clay" aria-hidden="true" />
              <EditableText contentId="home.hero.eyebrow" label="Hero eyebrow" value={content.eyebrow} as="span" />
            </span>
            <h1
              id="paths-heading"
              className="mx-auto mt-6 max-w-[18ch] font-serif text-[clamp(38px,5.5vw,64px)] leading-[1.08] text-espresso"
            >
              <EditableText contentId="home.hero.heading" label="Hero heading" value={content.title} as="span" />
            </h1>
            <EditableText
              contentId="home.hero.description"
              label="Hero description"
              value={content.subtitle}
              as="div"
              html
              className="mx-auto mt-5 max-w-[42rem] text-[16px] leading-relaxed text-espresso/75"
            />
            <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-3 text-[14px] font-medium text-espresso/80">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={17} className="text-espresso/60" aria-hidden="true" />
                <EditableText contentId="home.hero.badge1" label="Trust badge 1" value={content.badge1Label} as="span" />
              </span>
              <span className="inline-flex items-center gap-2">
                <HeartHandshake size={17} className="text-espresso/60" aria-hidden="true" />
                <EditableText contentId="home.hero.badge2" label="Trust badge 2" value={content.badge2Label} as="span" />
              </span>
              <span className="inline-flex items-center gap-2">
                <Users size={17} className="text-espresso/60" aria-hidden="true" />
                <EditableText contentId="home.hero.badge3" label="Trust badge 3" value={content.badge3Label} as="span" />
              </span>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Cards float up over the gold/light seam — Phase 47, repositioned
          Phase 72 (see the gold band comment above for the -mt-[210px]
          math). Phase 101 — Roy flagged the cards (420px tall, spanning the
          full `wrap` width) as overpowering the section once the Phase 100
          GesaMark redesign made them visually heavier. Narrowed the row
          itself (`max-w-[860px] mx-auto`, on top of `wrap`'s own max-width)
          so three columns render as smaller cards even on wide screens,
          rather than only shrinking each card's own fixed height. */}
      <div className="wrap relative z-10 -mt-[210px] pb-16">
        <StaggerGroup className="mx-auto grid max-w-[860px] gap-5 md:grid-cols-3">
          {cards.map((p, i) => (
            /* Phase 72 — Roy asked for the paintings to display in full by
               default (previously only a small 200px-tall sliver of each
               card was image, with the title/description/CTA always
               visible underneath) and for the text/CTA to only appear when
               the card is flipped on hover. Rebuilt as a real 3D flip
               card: a fixed-height, perspective wrapper holding two
               absolutely-positioned, backface-hidden faces — the front is
               the full painting (matted the same way the old small image
               box was, just filling the entire card now), the back is the
               title/description/"Reach out now" button that used to sit
               statically below the image. `group-hover` on the outer
               `.gold-card-hover` wrapper drives the rotateY(180deg)
               flip; keyboard/focus users get the same flip via
               `focus-within` on that wrapper (Tailwind's `group-focus-
               within`), since the card's only interactive element (the
               CTA link) needs to be reachable and visible on focus, not
               just mouse hover. */
            <StaggerItem key={i}>
              <div className="gold-card-hover group h-[300px] [perspective:1400px]">
                <div className="relative h-full w-full transition-transform duration-700 ease-out [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-focus-within:[transform:rotateY(180deg)]">
                  {/* Front face — Phase 97 first restyled this as framed/
                      matted artwork with a gold badge dome overlapping the
                      frame's bottom edge, explicitly keeping the flip effect
                      and the back face's own content untouched. Phase 100:
                      Roy sent a new reference replacing the painting itself
                      with an abstract recolored "swirl" mark
                      (GesaMark) centered on a solid card background —
                      same gold border, same overlapping badge dome
                      mechanism, only what's inside the frame changed.
                      Phase 124 (round 1) approximated a new reference photo
                      (a wall-hung picture frame) as a rounded, overlapping-
                      badge treatment. Phase 124 (round 2) — Roy sent the same
                      reference again asking for an exact match, so this now
                      follows it literally: square (not rounded) corners on
                      the frame/mat/canvas, a textured wood-grain frame
                      (layered gradients, not a flat one), a directional
                      drop shadow like a hung painting, and — the biggest
                      change — the gold label is no longer a dome overlapping
                      the frame's bottom edge; it's the reference's own
                      separate pill sitting below the frame with a real gap,
                      so the face is now a column (frame, then gap, then
                      pill) instead of one absolutely-positioned image with
                      an overlay. `frontStyle.frame` (the old gold border
                      color) is still unused here, kept in PATH_FRONT_STYLES
                      in case a future design reverts to a plain border. */}
                  {(() => {
                    const FrontIcon = PATH_FRONT_BADGE_ICONS[i] ?? PATH_FRONT_BADGE_ICONS[PATH_FRONT_BADGE_ICONS.length - 1];
                    const frontStyle = PATH_FRONT_STYLES[i] ?? PATH_FRONT_STYLES[PATH_FRONT_STYLES.length - 1];
                    return (
                      <div className="absolute inset-0 flex flex-col items-center gap-3 [backface-visibility:hidden]">
                        {/* Wood frame — layered gradients approximate grain
                            instead of one flat tone, sharp corners (no
                            border-radius) to match the reference exactly,
                            and an offset directional shadow so it reads as
                            hanging on a wall rather than sitting flush. */}
                        <div
                          className="relative w-full flex-1 min-h-0"
                          style={{
                            background:
                              "repeating-linear-gradient(95deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 2px, transparent 2px, transparent 7px), linear-gradient(120deg, #e0c193 0%, #cea877 50%, #c39a6c 100%)",
                            boxShadow: "10px 14px 22px -8px rgba(35,25,15,0.4)",
                          }}
                        >
                          {/* Mat — Phase 124 (round 3): Roy flagged the live
                              cards as not matching the reference photo. Pixel-
                              sampled the reference directly: the wood frame is
                              ~4% of the frame's own width/height thick and the
                              cream mat a further ~9% — both far thicker than
                              this had (a flat 10px each, which read as barely
                              a hairline on an actual card-sized box). Switched
                              both to percentage-based sizing so the border
                              stays proportional at any card size, and lightened
                              the wood gradient to match the reference's fairly
                              uniform honey-oak tone (sampled ~#d2b494) instead
                              of trending into a dark espresso-brown corner. */}
                          <div className="absolute inset-[6%] flex items-center justify-center bg-[#f4efe3] p-[9%]">
                            {/* Canvas */}
                            <div className={`flex h-full w-full items-center justify-center overflow-hidden ${frontStyle.bg} p-4`}>
                              <GesaMark colors={frontStyle.mark} className="h-[64%] w-[64%]" />
                            </div>
                          </div>
                        </div>
                        {/* Gold label pill — sits below the frame with a
                            visible gap, per the reference, rather than
                            overlapping it. Icon + label are separate from
                            the back face's badge/title (PATH_BADGE_ICONS /
                            p.title) since they show at different flip
                            states. */}
                        <div className="flex flex-none items-center gap-1.5 rounded-full px-4 py-2 text-center shadow-md" style={{ background: "linear-gradient(135deg, #ecd48f 0%, var(--clay) 45%, var(--amber) 100%)" }}>
                          <FrontIcon size={14} className="text-espresso" aria-hidden="true" />
                          <EditableText
                            contentId={`home.${CARD_CONTENT_KEYS[i] ?? CARD_CONTENT_KEYS[CARD_CONTENT_KEYS.length - 1]}.label`}
                            label="Card badge label"
                            value={p.frontLabel}
                            as="span"
                            className="text-[11px] font-semibold uppercase tracking-wide text-espresso"
                          />
                        </div>
                      </div>
                    );
                  })()}
                  {/* Back face — Phase 76: Roy generated a new "certificate"
                      style design (cream card, gold corner brackets, a
                      circular gold badge icon, serif heading, and a dark
                      navy/gold-ringed pill button) for the Seeking Support
                      card and asked for the same treatment on the other
                      two, each with its own contextually relevant badge
                      icon (see PATH_BADGE_ICONS above) rather than reusing
                      one icon for all three. */}
                  {(() => {
                    const BadgeIcon = PATH_BADGE_ICONS[i] ?? PATH_BADGE_ICONS[PATH_BADGE_ICONS.length - 1];
                    return (
                      <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[20px] border border-clay/30 bg-clay-soft p-5 text-center shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        {/* Gold corner brackets */}
                        <span className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 rounded-tl-md border-l-2 border-t-2 border-clay" />
                        <span className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 rounded-tr-md border-r-2 border-t-2 border-clay" />
                        <span className="pointer-events-none absolute bottom-2.5 left-2.5 h-3.5 w-3.5 rounded-bl-md border-b-2 border-l-2 border-clay" />
                        <span className="pointer-events-none absolute bottom-2.5 right-2.5 h-3.5 w-3.5 rounded-br-md border-b-2 border-r-2 border-clay" />

                        <div
                          className="mb-2.5 flex h-11 w-11 flex-none items-center justify-center rounded-full shadow-md"
                          style={{ background: "linear-gradient(135deg, #ecd48f 0%, var(--clay) 45%, var(--amber) 100%)" }}
                        >
                          <BadgeIcon size={19} className="text-white" />
                        </div>
                        <EditableText
                          contentId={`home.${CARD_CONTENT_KEYS[i] ?? CARD_CONTENT_KEYS[CARD_CONTENT_KEYS.length - 1]}.title`}
                          label="Card heading"
                          value={p.title}
                          as="h3"
                          className="font-serif text-[17px] leading-tight text-foreground"
                        />
                        <EditableText
                          contentId={`home.${CARD_CONTENT_KEYS[i] ?? CARD_CONTENT_KEYS[CARD_CONTENT_KEYS.length - 1]}.description`}
                          label="Card description"
                          value={p.description}
                          as="div"
                          html
                          className="mt-1.5 text-[12.5px] leading-snug text-muted-fg"
                        />
                        <Link
                          href={p.ctaLink}
                          className="relative z-10 mt-3.5 inline-flex w-fit items-center justify-center gap-1.5 rounded-full border-2 border-clay bg-espresso px-[18px] py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#141820]"
                        >
                          <EditableText
                            contentId={`home.${CARD_CONTENT_KEYS[i] ?? CARD_CONTENT_KEYS[CARD_CONTENT_KEYS.length - 1]}.cta`}
                            label="Card CTA label"
                            value={p.ctaLabel}
                            as="span"
                          />{" "}
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>

        {/* Phase 79 — Roy flagged this caption ("The path to emotional
            recovery begins here." — the current published `footerNote`
            value) as too small to read comfortably below the cards.
            Bumped from 13px to 18px and darkened from `text-muted-fg` to
            `text-foreground` with a touch of weight, for real visibility
            rather than reading as fine print. */}
        <Reveal type="fade">
          <EditableText
            contentId="home.footer-note"
            label="Closing note"
            value={content.footerNote}
            as="div"
            html
            className="mt-8 text-center text-[18px] font-medium text-foreground"
          />
        </Reveal>
      </div>
    </section>
  );
}
