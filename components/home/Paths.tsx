import Link from "next/link";
import Image from "next/image";
import { ArrowRight, LifeBuoy, Award, Sparkles } from "lucide-react";
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

// Phase 76 — one badge icon per card back face, fixed by position (same
// "code-managed, not editable" treatment as PATH_IMAGES above) — chosen to
// match each card's own context: a life ring for the crisis path (urgent,
// keep-afloat help), a service medal for veterans/reservists/families, and
// a sparkling sprig for general/seeking support (closest available lucide
// icon to the laurel-sprig badge in Roy's reference design).
const PATH_BADGE_ICONS = [LifeBuoy, Award, Sparkles];

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
    <section aria-label="Ways to get support" className="relative overflow-hidden">
      {/* Gold hero band — Phase 47. Phase 70 — Roy asked to remove this
          band's text (eyebrow/headline/subtitle/trust badges) and the
          decorative "gallery wall" of the three path artworks entirely.
          The `content.eyebrow`/`title`/`subtitle`/`badge*Label` fields and
          their Content Manager editor are left untouched — they're just no
          longer rendered here — since removing them from the data model
          wasn't asked for and could break the editor for no reason. The
          gold band itself (background glow + watermark texture) stays, as
          a color transition into the three cards below, since only the
          text and images were asked to go, not the band.
          Phase 72 — Roy flagged that the card row's overlap onto the gold
          band was too shallow: the visible color line inside each old card
          (the blue-gray image box giving way to the light-gray text block)
          sat well below the gold band's own bottom edge, deep in the plain
          light section, instead of "leveling" with it. Grew this band's
          bottom padding (pb-14/16 -> a fixed 210px) to match the new
          card's fixed height's overlap below, so the math is exact rather
          than eyeballed — see the card wrapper's -mt-[210px] below, chosen
          as exactly half of each card's own fixed h-[420px], so the cards
          sit evenly straddling the gold/light seam with noticeably more of
          each card (and more gold overall) visible above it than before. */}
      <div className="gold-banner relative pt-16 pb-[210px] md:pt-20 md:pb-[210px]">
        <ParallaxLayer speed={50} className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute left-[8%] top-0 h-[420px] w-[560px] rounded-full bg-white/25 blur-[110px]" />
          {/* Phase 67 — same faint line-art watermark texture as About's
              gold Hero band and the gold PageHero banners (Our Therapists,
              Support Groups), for consistency across every gold section. */}
          <GoldWatermarks />
        </ParallaxLayer>
      </div>

      {/* Cards float up over the gold/light seam — Phase 47, repositioned
          Phase 72 (see the gold band comment above for the -mt-[210px]
          math). */}
      <div className="wrap relative z-10 -mt-[210px] pb-16">
        <StaggerGroup className="grid gap-6 md:grid-cols-3">
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
              <div className="gold-card-hover group h-[420px] [perspective:1400px]">
                <div className="relative h-full w-full transition-transform duration-700 ease-out [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-focus-within:[transform:rotateY(180deg)]">
                  {/* Front face — full painting, no mat/frame border. Phase
                      73 — Roy sent close crops of the three paintings and
                      asked for the front face to show just the painting
                      itself (no white mat, no gray/clay frame border) on a
                      full gold background instead of the ash-gray
                      `bg-secondary` box the mat used to sit on. Still
                      `object-contain` so the whole painting displays
                      uncropped — only the matting/background around it
                      changed, not how the image itself is fit. */}
                  <div className="gold-banner absolute inset-0 overflow-hidden rounded-[24px] shadow-lg [backface-visibility:hidden]">
                    <Image src={PATH_IMAGES[i]} alt={`${p.title} artwork`} fill className="object-contain" />
                  </div>
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
                      <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[24px] border border-clay/30 bg-clay-soft p-7 text-center shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        {/* Gold corner brackets */}
                        <span className="pointer-events-none absolute left-3 top-3 h-4 w-4 rounded-tl-md border-l-2 border-t-2 border-clay" />
                        <span className="pointer-events-none absolute right-3 top-3 h-4 w-4 rounded-tr-md border-r-2 border-t-2 border-clay" />
                        <span className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 rounded-bl-md border-b-2 border-l-2 border-clay" />
                        <span className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 rounded-br-md border-b-2 border-r-2 border-clay" />

                        <div
                          className="mb-4 flex h-14 w-14 flex-none items-center justify-center rounded-full shadow-md"
                          style={{ background: "linear-gradient(135deg, #ecd48f 0%, var(--clay) 45%, var(--amber) 100%)" }}
                        >
                          <BadgeIcon size={24} className="text-white" />
                        </div>
                        <h3 className="font-serif text-[21px] text-foreground">{p.title}</h3>
                        <p className="mt-2.5 text-[14px] leading-relaxed text-muted-fg">{p.description}</p>
                        <Link
                          href={p.ctaLink}
                          className="relative z-10 mt-6 inline-flex w-fit items-center justify-center gap-2 rounded-full border-2 border-clay bg-espresso px-6 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#141820]"
                        >
                          {p.ctaLabel} <ArrowRight size={15} />
                        </Link>
                      </div>
                    );
                  })()}
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
