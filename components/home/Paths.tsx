import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LifeBuoy, Award, Sparkles, Sparkle, ShieldCheck, HeartHandshake, Users, Sprout, Tags, Waves } from "lucide-react";
import GoldWatermarks from "@/components/ui/GoldWatermarks";
import Reveal from "@/components/motion/Reveal";
import ParallaxLayer from "@/components/motion/ParallaxLayer";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";
import GesaMark, { type GesaMarkColors } from "@/components/home/GesaMark";
import FrameBox, { FRAME_BOX_RECESS_RECT } from "@/components/home/FrameBox";
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
  title: "Two clicks to a professional who understands",
  highlight: "",
  subtitle:
    "GESA (Global Emotional Support Alliance) connects you with a verified volunteer professional for a free, confidential session — no forms, no accounts, no questions upfront. Choose the path below that fits you and confirm.",
  badge1Label: "Verified Professionals",
  badge2Label: "100% Free Sessions",
  badge3Label: "Global Community",
  footerNote: "Free, confidential sessions · verified volunteer professionals · secure communication",
  purposeTicker:
    "Because no one should face emotional pain alone\nVerified volunteer professionals, giving their time freely\nUp to six free sessions — cost is never why someone goes without care\nA global community of care, across borders and languages\nConfidential, dignified support, always free at the point of need",
  card1Title: "In crisis right now",
  card1Description:
    "For anyone shaken by war, terror, or disaster. Fast, gentle help when you can't wait — approximately six free sessions to start.",
  card1CtaLabel: "Reach out now",
  card1CtaLink: "/intake?path=crisis",
  card2Title: "Veterans, reservists & families",
  card2Description:
    "For the long shadow of service — adjustment, ongoing stress, trauma, and the strain on families. Unlimited free sessions for veterans and reservists; families receive a structured package of sessions.",
  card2CtaLabel: "Reach out now",
  // Phase 242 — Roy asked for this card (TERROR / "I serve or support
  // someone who serves") to go straight into the AI Matching flow instead
  // of the general intake pathway listing. AI Matching only exists as a
  // client-side modal (FindSupportModal, opened via HeroFindSupportCta's
  // `#how-it-works` sentinel-href pattern), mounted only on the About page
  // Hero — there is no standalone `/ai-matching` route or `/#ai-matching`
  // anchor anywhere in this codebase. Rather than build a new route for a
  // flow that already exists elsewhere, this now points at that existing
  // entry point with a query flag (`openMatch=terror`) that app/about/
  // page.tsx reads to auto-open the modal on arrival and pass a "Terror"
  // context label into it — see that page and HeroFindSupportCta.tsx's own
  // Phase 242 comments for the full mechanism. Cards 1 and 3 are untouched.
  card2CtaLink: "/about?openMatch=terror",
  card3Title: "Seeking support",
  card3Description: "For anyone carrying anxiety, ongoing stress, or the weight of antisemitism. Start here — more is coming.",
  card3CtaLabel: "Reach out now",
  // Phase 155 — Roy's live-edited version of this card (published content,
  // not this fallback) relabeled it "DISASTER" / "OPEN TO EVERYONE — Find
  // professional support" with a "BROWSE THE DIRECTORY" CTA meant to route
  // browsers to the real, bookable Our Professionals directory (paid
  // sessions, fees shown up front — not the free-session intake/onboarding
  // flow the other two cards use). That published row's own `card3CtaLink`
  // was still the original "/intake?path=general" from before this card was
  // repurposed, so clicking "Browse the Directory" wrongly sent visitors
  // into the intake flow instead. Fixed directly in the published
  // `page_home` site_content row (this card's actual live destination), and
  // fixed here in the fallback too so a fresh/reset install doesn't
  // reintroduce the same mismatch — cards 1 and 2's `/intake?path=crisis`
  // and `/intake?path=veteran` are genuinely intake-flow destinations and
  // are untouched.
  // Phase 248 — Roy asked for this card's destination to carry a source
  // marker so /therapists can show paid-session-appropriate hero copy for
  // visitors arriving specifically from here (see app/therapists/page.tsx's
  // own Phase 248 comment) rather than the general "verified volunteer
  // therapists" framing every other entry point to this page sees. Still
  // the same real, bookable directory this card always pointed at — just
  // `?source=disaster` appended, following this project's existing
  // `?path=`-style query-param convention (cards 1/2's `/intake?path=`
  // links) rather than a new route.
  card3CtaLink: "/therapists?source=disaster",
  // Phase 97 — front-face badge labels (see the HomeContent type comment
  // in lib/content.ts).
  // Phase 100 — Roy sent a new reference image for the front face (see the
  // GesaMark component below) whose own gold badges read "CRISIS,"
  // "VETERANS," and "SJPPORT" (a typo for "SUPPORT") — matching each card's
  // actual category rather than an abstract art-piece name, so these three
  // labels changed to match that reference exactly, corrected for the typo.
  // Phase 154 — Roy sent a revised reference restyling the front face's
  // category badge: instead of "Crisis"/"Veterans"/"Support" (this card's
  // own general category), the badge now names the specific hardship each
  // card addresses — "War"/"Terror"/"Disaster" — matching card1's own back-
  // face description ("For anyone shaken by war, terror, or disaster.")
  // rather than the abstract category name. Card 2 and 3's back faces keep
  // their existing Veterans/Support titles and copy untouched — only the
  // front badge label changed, same "front label is independent of the back
  // face's own heading" precedent Phase 97 already established.
  // Phase 210 — Roy sent yet another reference image (a recessed colored
  // "shadow box" alcove holding the GesaMark swirl, with the gold badge
  // below it reading CRISIS/VETERANS/SUPPORT) and asked for it copied
  // exactly, superseding Phase 209's door artwork and its "Resilience"
  // relabel. This wording is actually identical to the very first Phase 100
  // labels ("CRISIS"/"VETERANS"/"SUPPORT," typo-corrected) — the field has
  // now round-tripped through War/Terror/Disaster (154) and
  // Resilience/Veterans/Support (209) and landed back where it started.
  // Phase 213 — Roy's "copy exactly" message this round also named the
  // badge text as "war, terror, disaster," which conflicts with his own
  // immediately prior message ("I have no problem with the text, ... All i
  // want is to copy exactly the frames") and with "New Design Frames.png"
  // itself, whose badges visibly read CRISIS/VETERANS/SUPPORT — the same
  // wording already here. Read as a slip back to Phase 154's old wording
  // rather than a new instruction, since the explicit, scope-narrowing
  // message ("I have no problem with the text") is the one that directly
  // answered this exact ambiguity. Left this field untouched; flagged for
  // Roy to confirm directly rather than silently overriding either message.
  card1FrontLabel: "Crisis",
  card2FrontLabel: "Veterans",
  card3FrontLabel: "Support",
  // Phase 154 — new short caption line under each card's frame, per Roy's
  // reference. Cards 1 and 2 share identical wording on purpose (both are
  // "gifted professional support" pathways); card 3 reads differently
  // ("Global Professional Directory") since it points to the general,
  // browsable Our Professionals directory rather than a gifted-session path.
  // Phase 209 — captions relabeled to match that phase's door reference
  // image ("Global Crisis Directory" / "Veterans & Carer Directory" /
  // "Well Being Directory"). Phase 210 — Roy's newest reference image shows
  // no caption line at all (frame, then badge below it, nothing more), so
  // this field is no longer rendered on the front face as of Phase 210 —
  // see the front-face JSX below. Left in the data model rather than
  // deleted (still a real, CMS-editable `home.*-card.caption` field) in
  // case a future design brings a caption line back, consistent with how
  // this file keeps other superseded fields (e.g. `frame`/`door` in
  // PATH_FRONT_STYLES below) rather than removing them.
  card1FrontCaption: "Global Crisis Directory",
  card2FrontCaption: "Veterans & Carer Directory",
  card3FrontCaption: "Well Being Directory",
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
// Phase 210 — Roy's newest reference image shows each card as a recessed,
// colored "shadow box" alcove (the card's own bg tone, with a darker inset
// border and a soft depth shadow — not a door, not a wood-grain frame) with
// the GesaMark swirl centered inside, and the gold badge sitting *below*
// the box with a visible gap (reverting Phase 154's "badge above" layout).
// `mark` is back (identical values to the pre-Phase-209 Phase 162 palette,
// since this reference's three swirl colors are the same sage/tan/
// terracotta, white/peach/terracotta, and lavender/teal/peach this app has
// used since Phase 97/162) — brought back rather than re-deriving new
// values, since nothing about the swirl's own coloring changed in the new
// reference. `door`/`doorFrame` (Phase 209) are kept, unused, in case a
// future design reverts to the door treatment — same "don't delete a
// superseded style, just stop reading it" precedent already set for `frame`
// by Phase 124's own comment.
// Phase 211 — Roy saved a new reference ("New Design Frames.png") showing
// each card's box as a real recessed wall niche rather than a flat inset
// color: a visible frame trim around the opening, and the top/right
// interior walls shaded darker to read as receding into the wall (subtle
// 3D depth), not just a drop shadow around a flat rectangle. `boxHex` is
// the exact hex of each card's own established color (matching `bg` — for
// card1 this is the true `#aed0e9`, distinct from `door`'s slightly lighter
// `#c7dced` tint from Phase 209's door artwork) so the niche's flat face
// reads as precisely this card's color, and `doorFrame` (already a darker
// shade per card from Phase 209) is reused as both the frame trim and the
// interior-wall shading tone, rather than deriving a third color.
// Phase 213 — Roy sent "New Design Frames.png" a third time and was
// explicit the earlier attempts still weren't a real "3D" copy: two flat
// colors (Phase 212) still reads as a flat rectangle with a drop shadow,
// not the reference's actual recessed shadowbox (a visible top face and a
// visible right face, each their own flat plane, receding into the wall).
// Added `top`/`side` per card for FrameBox's three-plane SVG below — `top`
// close to `boxHex` (same light hitting the top edge as the front trim),
// `side` a further-darkened step past `doorFrame` (the deepest, most
// shadowed plane, at the wall's inside corner) — sampled by eye against the
// reference's own top/right shading on each of its three boxes.
// Phase 237 — per-card override: when set, this card's front face renders
// the given uploaded photo directly instead of the code-drawn FrameBox +
// GesaMark shadowbox. Roy is replacing these one card at a time with real
// framed-artwork photos (see the front-face render block below for the full
// reasoning) — `undefined` means "not updated yet, keep the shadowbox."
// Index 0 = WAR/crisis card (Phase 237 round 1), 1 = Veterans/center card
// (Phase 237 round 2), 2 = Support/disaster card (Phase 237 round 3).
const CARD_FRONT_IMAGE_OVERRIDES: (string | undefined)[] = [
  "/images/paths/war-framed-swirl-v3.png",
  "/images/paths/war-framed-swirl-v3.png",
  "/images/paths/support-framed-swirl-v2.png",
];

// The portal fronts use fixed approved treatments. This prevents older CMS
// labels ("WAR" / "TERROR" / "DISASTER") from changing their visual design;
// every card retains its normal flipped content and destination.
const CARD_FRONT_LABEL_OVERRIDES: (string | undefined)[] = ["CRISIS", "VETARANS", "SUPPORT"];

const PATH_FRONT_STYLES: { bg: string; boxHex: string; frame: string; door: string; doorFrame: string; top: string; side: string; mark: GesaMarkColors }[] = [
  {
    bg: "bg-[#aed0e9]",
    boxHex: "#aed0e9",
    frame: "border-clay",
    door: "#c7dced",
    doorFrame: "#8fa9c2",
    top: "#96b8d4",
    side: "#6f89a3",
    mark: { outerRing: "#9db99f", middleRing: "#d9a98c", innerRing: "#c1694f", dot: "#c1694f" },
  },
  {
    bg: "bg-accent",
    boxHex: "#9ba283",
    frame: "border-clay",
    door: "#9ba283",
    doorFrame: "#767c62",
    top: "#838a6e",
    side: "#5d6250",
    mark: { outerRing: "#dbe2e7", middleRing: "#e8c9a0", innerRing: "#c1694f", dot: "#c1694f" },
  },
  {
    bg: "bg-[#5f7a91]",
    boxHex: "#5f7a91",
    frame: "border-clay",
    door: "#5f7a91",
    doorFrame: "#425364",
    top: "#4f6478",
    side: "#34424f",
    mark: { outerRing: "#a99bc9", middleRing: "#8ad4c2", innerRing: "#4a9d92", dot: "#f2b385" },
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
    { title: content.card1Title, description: content.card1Description, ctaLabel: content.card1CtaLabel, ctaLink: content.card1CtaLink, frontLabel: content.card1FrontLabel, frontCaption: content.card1FrontCaption },
    { title: content.card2Title, description: content.card2Description, ctaLabel: content.card2CtaLabel, ctaLink: content.card2CtaLink, frontLabel: content.card2FrontLabel, frontCaption: content.card2FrontCaption },
    { title: content.card3Title, description: content.card3Description, ctaLabel: content.card3CtaLabel, ctaLink: content.card3CtaLink, frontLabel: content.card3FrontLabel, frontCaption: content.card3FrontCaption },
  ];

  // Phase 167 — Roy sent his Home-page reference image again and asked
  // for the page's background to match it, specifically calling out that
  // this shouldn't be a revert of the Phase 165/166 work he'd undone
  // earlier. Re-examined the reference itself: the hero band and the
  // card-grid area below it are one continuous warm-ivory field with no
  // visible seam, so this section gets its own `bg-clay-soft` (the same
  // ivory the hero band already uses) as new Phase 167 work — the sheen
  // sweep on the hero itself is untouched (still the shared white sweep,
  // not the gold-tinted Phase 166 version Roy asked not to bring back).
  //
  // Phase 170 — Roy sent a new reference mockup replacing that ivory wash
  // with a cool neutral gray across this same continuous field (hero band
  // + this section, no seam between them, same as Phase 167 established).
  // `bg-clay-soft` is a shared Tailwind utility used by buttons/badges/
  // admin-nav elsewhere in the app, so swapped for the new page-scoped
  // `--home-gray` token (app/globals.css) via an arbitrary-value class
  // instead of retuning that shared utility.
  // Phase 194 — Roy flagged that the animated parallax/sheen background
  // only covered the upper hero sub-div (`pt-16 pb-[210px]`), while this
  // whole section (the hero band AND the card-grid area below it) shares
  // one continuous slate-blue/gray field (`--home-gray`, same color used
  // on both, no seam between them per Phase 167/170). So the decorative
  // layer needed to live on this outer, full-height wrapper, not the
  // shorter hero div nested inside it. Moved `.gold-banner.home-hero`
  // (background + the `::before` sheen animation) up to this outer
  // section itself, and moved the ParallaxLayer decorative blob/watermarks
  // block (previously inside the hero div below) to be this section's own
  // direct child, sized `absolute inset-0` so it always matches this
  // section's real rendered height — including on mobile, where the same
  // content stacks taller. No shapes, colors, motion, or opacity changed;
  // only which element owns/sizes the layer did.
  // Phase 210 (build-fix note) — this comment block was moved from just
  // inside `return (` (directly before the JSX) to here, above `return`.
  // A `//` comment in that position naming an HTML tag by name — this
  // block used to read "whole <section> — hero band..." — reliably tripped
  // the Vercel build's SWC parser with "Unexpected token `section`.
  // Expected jsx identifier," even though the tag mention was plain
  // comment text, not real markup. Rewording the mention (now "whole
  // section" with no angle brackets) and relocating the comment block
  // outside the parenthesized JSX expression both independently avoid the
  // trigger; both are applied here so this can't recur if a future edit
  // reintroduces a literal `<tag>` inside a comment in this position.
  return (
    <section aria-labelledby="paths-heading" className="gold-banner home-hero relative overflow-hidden">
      {/* Phase 194 — decorative sheen/blob/watermark layer, now sized to
          this entire section (see comment above) rather than only the hero
          sub-div. `pointer-events-none` keeps it fully non-interactive;
          `z-0` keeps every piece of real content (hero text below, and the
          card grid further down, both already `relative z-10`) stacked
          above it. */}
      <ParallaxLayer speed={50} className="pointer-events-none absolute inset-0 z-0 h-full w-full">
        {/* Phase 171 — Roy flagged a hard seam where this band's gold
            tone met the flat gray section below it — caused by the sheen
            overlay being sized to only the hero sub-div while the real
            slate-blue field continued below it. Phase 194 fixes the actual
            cause (this layer now spans the full slate-blue section, so
            there's no shorter box for the overlay to be clipped against
            mid-sweep) rather than the Phase 171/193 workarounds. */}
        <div className="absolute left-1/2 top-0 h-[420px] w-[560px] -translate-x-1/2 rounded-full bg-clay/30 blur-[110px]" />
        {/* Phase 67 — same faint line-art watermark texture as About's
            gold Hero band and the gold PageHero banners (Our Therapists,
            Support Groups), for consistency across every gold section. */}
        <GoldWatermarks />
      </ParallaxLayer>

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
          literal `/about` URL is labeled "About Us" in the nav — "Find
          Support" now links to `/find-your-therapist` instead — and is a
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
          Phase 72 to set the gold/light color seam the card row below
          straddles) is untouched by this change or by Phase 139's gap
          adjustment below — only the cards' own negative margin changed,
          not this padding, so the seam's position is unaffected either
          time. */}
      {/* Phase 159 — briefly switched the headline/subtitle/badge row (and
          their icons) below the eyebrow chip to white/white-with-opacity to
          stay legible on a deep-navy `.gold-banner` background; reverted
          alongside the rest of that phase once Roy said the new color
          didn't work on the live site.
          Phase 163 — added the `home-hero` class (app/globals.css) so this
          one page's hero band reads as solid gold ("gold owns the hero band
          outright," per Roy's Home-page palette spec), while every other
          `.gold-banner` page keeps the shared light slate-gray
          `--slate-banner` background untouched. The existing `text-espresso`
          headline/subtitle/badge colors below already read as dark text on
          a light background, which stays legible on gold too (same
          combination the very first gold-banner design used, before Phase
          130's slate-gray retune) — no text-color changes needed here. */}
      <div className="relative pt-16 pb-[210px] md:pt-20 md:pb-[210px]">
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
          rather than only shrinking each card's own fixed height.
          Phase 139 — Roy flagged the cards sitting flush against the trust
          badges above (the negative margin exactly canceled the gold
          band's own `pb-[210px]`, so the cards' top edge landed exactly at
          the badges' bottom edge with zero gap). The gold band's own
          `pb-[210px]` is untouched — that originally kept a gold/white
          color seam with the cards floating up to straddle it; Phase 167
          gave this outer section the same warm-ivory background as the
          hero band, so that seam no longer reads as two different tones —
          this padding/negative-margin math (and the "cards float up
          slightly over the hero's bottom edge" effect itself) is
          untouched. Only the cards' own negative margin got less negative, by
          the size of the new gap at each breakpoint (210 minus the gap), so
          the cards now sit lower relative to the badges while still
          floating up over the same seam: 24px gap on mobile, 32px on
          tablet (sm), 48px on desktop (md+) — within Roy's requested
          40-64px desktop range, scaled down for smaller screens. */}
      <div className="wrap relative z-10 -mt-[186px] sm:-mt-[178px] md:-mt-[162px] pb-16">
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
              {/* Phase 172 — Roy sent a screen recording of the Community
                  page ("Choose your pathway" cards, components/support-
                  groups/CommunityIntro.tsx) and asked for that section's
                  hover feel copied here. Those cards use the shared `Card`
                  component's hover treatment (components/ui/Card.tsx):
                  `hover:-translate-y-0.5 hover:shadow-lg`, a lift + shadow
                  on top of whatever content is already showing — no flip.
                  This card is a different shape (a 3D flip revealing a back
                  face, via `.gold-card-hover` + `group-hover:rotateY`), so
                  copying the shadow half isn't safe as a plain Tailwind
                  utility: `.gold-card-hover:hover` already sets its own
                  gold-tinted `box-shadow` in globals.css, and stacking
                  Tailwind's plain-black `hover:shadow-lg` on the same
                  element risks an unpredictable which-one-wins fight
                  between the two same-specificity rules. The lift has no
                  such conflict (`.gold-card-hover` never touches
                  `transform`, only `.group-hover:[transform:rotateY(180deg)]`
                  one element deeper), so it's added here directly:
                  `transition-transform duration-300 hover:-translate-y-1`
                  gives this card the same "lifts toward you on hover" motion
                  Community's cards have, layered on top of the existing
                  flip and gold sweep, both left untouched. */}
              <div tabIndex={0} className="gold-card-hover group h-[300px] [perspective:1400px] transition-transform duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-clay">
                <div className="relative h-full w-full transition-transform duration-700 ease-out [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-focus:[transform:rotateY(180deg)] group-focus-within:[transform:rotateY(180deg)]">
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
                    const cardKey = CARD_CONTENT_KEYS[i] ?? CARD_CONTENT_KEYS[CARD_CONTENT_KEYS.length - 1];
                    const frontLabel = CARD_FRONT_LABEL_OVERRIDES[i] ?? p.frontLabel;
                    const isReferenceFrontCard = CARD_FRONT_LABEL_OVERRIDES[i] !== undefined;
                    const isSupportCard = i === 2;
                    return (
                      /* Phase 210 — Roy sent a new reference image (a
                         recessed colored "shadow box" holding the GesaMark
                         swirl, with the gold badge below it — no caption
                         line at all) and asked for it copied exactly. This
                         moves the badge back below the frame, the layout
                         Phase 97 originally used before Phase 154 moved it
                         above, and drops the Phase 154 caption line from the
                         front face entirely (kept in the data model, not
                         rendered — see the caption field's own Phase 210
                         comment in HOME_CONTENT_FALLBACK above). Same flex
                         column as before, now just frame then badge, one
                         gap-3 between them. */
                      <div className={`absolute inset-0 flex flex-col items-center justify-center [backface-visibility:hidden]${isReferenceFrontCard ? " gap-2" : " gap-3"}`}>
                        {/* Recessed wall niche — Phase 213. Roy sent "New
                            Design Frames.png" again and said Phase 212's flat
                            two-tone box still wasn't a real "3D" copy — it
                            read as one flat rectangle with a drop shadow, not
                            an actual shadowbox recessed into a wall. The
                            reference itself shows three distinct flat planes
                            (front trim, a lit top edge, a shadowed right
                            edge) receding at an angle, which no CSS box can
                            draw on its own — so that geometry now comes from
                            FrameBox, a small SVG that draws the front/top/
                            side faces as explicit flat polygons (see its own
                            Phase 213 header comment) plus a blurred ground
                            shadow, using this card's `boxHex`/`top`/`side`
                            colors for the three planes. The recess itself is
                            drawn inside that same SVG (`frontStyle.doorFrame`
                            passed as `recess`); GesaMark is layered on top,
                            absolutely positioned over `FRAME_BOX_RECESS_RECT`
                            (the percentages FrameBox exports for exactly
                            where its own recess sits) so the swirl still
                            renders as a real, recolorable React component
                            rather than being redrawn as more inline SVG. */}
                        <div className={`relative w-full flex-1 min-h-0${isSupportCard ? " mx-auto max-w-[176px] overflow-hidden" : ""}`}>
                          {CARD_FRONT_IMAGE_OVERRIDES[i] ? (
                            // Phase 237 — Roy started sending, one card at a
                            // time, a new reference photo for that card's
                            // front face only: a real sage-green wood frame
                            // around a tan mat holding a crescent-moon/wave
                            // mark, asked to replace just that card's front
                            // artwork — the recessed shadowbox treatment
                            // (FrameBox + GesaMark) any not-yet-updated card
                            // still uses, the flip effect, and every card's
                            // own back face (title/description/CTA) are all
                            // untouched. Each reference image already has its
                            // own frame/mat baked in (unlike GesaMark, which
                            // is a bare recolorable mark meant to sit inside
                            // FrameBox's drawn recess), so it renders directly
                            // here rather than being placed inside another
                            // frame — object-contain keeps the whole framed
                            // piece visible without cropping, same convention
                            // Phase 42 used for the original uploaded card
                            // artwork before Phase 121 switched to GesaMark.
                            // See CARD_FRONT_IMAGE_OVERRIDES above for which
                            // cards have been updated so far.
                            <Image
                              src={CARD_FRONT_IMAGE_OVERRIDES[i]!}
                              alt=""
                              fill
                              sizes="(max-width: 768px) 33vw, 220px"
                              className={`object-contain drop-shadow-lg${isSupportCard ? " scale-[1.15]" : ""}`}
                            />
                          ) : (
                            <>
                              <FrameBox
                                front={frontStyle.boxHex}
                                top={frontStyle.top}
                                side={frontStyle.side}
                                recess={frontStyle.doorFrame}
                                className="h-full w-full"
                              />
                              <div
                                className="absolute flex items-center justify-center"
                                style={{
                                  top: FRAME_BOX_RECESS_RECT.top,
                                  left: FRAME_BOX_RECESS_RECT.left,
                                  width: FRAME_BOX_RECESS_RECT.width,
                                  height: FRAME_BOX_RECESS_RECT.height,
                                }}
                              >
                                <GesaMark colors={frontStyle.mark} className="h-[72%] w-[72%]" />
                              </div>
                            </>
                          )}
                        </div>
                        {/* Gold label pill — back below the frame (Phase 97's
                            original position), with the same visible gap the
                            column's own `gap-3` already provides. Icon +
                            label are separate from the back face's badge/
                            title (PATH_BADGE_ICONS / p.title) since they show
                            at different flip states. */}
                        <div
                          className={`flex flex-none items-center gap-1.5 rounded-full px-4 py-2 text-center shadow-md${isReferenceFrontCard ? " w-[164px] justify-center" : ""}`}
                          style={{ background: "linear-gradient(135deg, #ecd48f 0%, var(--clay) 45%, var(--amber) 100%)" }}
                        >
                          <FrontIcon size={14} className="text-espresso" aria-hidden="true" />
                          <EditableText
                            contentId={`home.${cardKey}.label`}
                            label="Card badge label"
                            value={frontLabel}
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
                      // Phase 163 — Roy's Home-page palette spec calls for "the 3px
                      // rule on a pathway card": this ivory/`bg-clay-soft` back
                      // face's own border went from a muted `border border-clay/30`
                      // (1px, 30% opacity) to a full-strength 3px gold rule framing
                      // the whole card. The card's colors otherwise (frame, mat,
                      // canvas, mark, corner brackets) are the "three cards' color
                      // palette" Roy explicitly said to keep — untouched.
                      <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[20px] border-[3px] border-clay bg-clay-soft p-5 text-center shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
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
                        {/* Phase 163 — Roy's Home-page palette spec calls for gold
                            to "fill the primary button on an ivory card": this
                            button's fill went from `bg-espresso` (dark navy) to a
                            solid `bg-clay` gold, with `text-espresso` instead of
                            white — matching this codebase's established
                            "dark text on gold, never white text on gold" pattern
                            (see Button.tsx's Phase 36 comment on the "clay"
                            variant) rather than repeating the low-contrast
                            combination that pattern was deliberately moved away
                            from. Border stays gold (now matching the fill) and
                            hover darkens to --amber, the same gold family. */}
                        <Link
                          href={p.ctaLink}
                          // Phase 242 — explicit accessible label for the
                          // TERROR card (i === 1) only, per Roy's request,
                          // since its visible label ("Reach out now") no
                          // longer describes where it actually goes now that
                          // it opens AI Matching directly. Cards 1 and 3 are
                          // untouched — their visible CTA text is still an
                          // accurate accessible name on its own.
                          aria-label={i === 1 ? "Start AI matching for support related to terror." : undefined}
                          className="relative z-10 mt-3.5 inline-flex min-h-11 w-fit items-center justify-center gap-1.5 rounded-full border-2 border-clay bg-clay px-[18px] py-2 text-[12.5px] font-semibold text-espresso transition-colors hover:bg-amber hover:text-white"
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
