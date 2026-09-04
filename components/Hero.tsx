import Link from 'next/link';
import { ArrowRight, HeartHandshake, ShieldCheck, Users, Sparkle } from 'lucide-react';
import HighlightedText from '@/components/ui/HighlightedText';
import GoldWatermarks from '@/components/ui/GoldWatermarks';
import Reveal from '@/components/motion/Reveal';
import ScrollText from '@/components/motion/ScrollText';
import ParallaxMedia from '@/components/motion/ParallaxMedia';
import ParallaxLayer from '@/components/motion/ParallaxLayer';
import { StaggerGroup, StaggerItem } from '@/components/motion/StaggerReveal';
import type { HeroContent } from '@/lib/content';

export const HERO_CONTENT_FALLBACK: HeroContent = {
  published: true,
  eyebrow: "A global volunteer support alliance",
  title: "The path to emotional recovery begins here",
  highlight: "",
  subtitle:
    "GESA (Global Emotional Support Alliance) connects you with a verified volunteer therapist for free, culturally sensitive emotional support.",
  ctaPrimaryLabel: "Find your therapist",
  ctaPrimaryHref: "/find-your-therapist",
  ctaSecondaryLabel: "Explore support groups",
  ctaSecondaryHref: "/support-groups",
  backgroundImage: "/images/about/hero-painting-v2.jpg",
};

// Phase 17 — Roy shared a mockup (built with Claude Design) asking to bring
// the Home Hero's look closer to it. Two real, implementable changes came
// out of it: (1) a faint decorative line-art pattern (globe + chain-link
// icons) scattered across the hero background for texture, and (2) a soft
// multi-color glow blob layered behind the headline for warmth. A third
// element in the mockup — the media card bleeding past the right edge of
// the page and slightly under the sticky header — was also implemented,
// since the header's z-index already sits above the hero content, so the
// overlap resolves cleanly instead of causing a stacking bug.
//
// One thing from the mockup was deliberately NOT copied: the trust badges
// ("Verified Professionals" etc.) appeared with a strikethrough in the
// reference image. That reads as a rendering artifact from the AI image
// generator rather than an intended design choice, since the mockup itself
// is a synthesized image, not a real screenshot — its exact photo (hands
// passing papers) doesn't exist as an actual stock photo either. Flagged
// back to Roy rather than silently adding a strikethrough over real,
// accurate claims about the platform.
//
// Phase 18 — Roy asked again for an exact match, specifically the static
// photo instead of the Phase 15 video. Sourced a real, verified-existing
// Pexels photo of a group therapy session (id 7176305, confirmed via
// Pexels' own site before use) as the closest real equivalent to the
// mockup's synthesized image.
//
// Phase 30 — this component moved off the Home page entirely (Home's new
// landing section is Paths — see components/home/Paths.tsx) and now opens
// the About page instead. Also dropped the large 130px Logo mark that used
// to sit above the eyebrow badge: the header already shows the GESA logo on
// every page including About, so repeating it here was pure redundancy, not
// a second, different piece of information.
//
// Phase 35 — every field here (eyebrow, title, highlighted portion,
// subtitle, both CTAs, background image) is now Content Manager-editable
// via site_content key "page_about_hero". The literals in
// HERO_CONTENT_FALLBACK above are exactly today's live copy, so publishing
// the seeded row changes nothing visually until an admin actually edits it.
//
// Phase 43 — Roy asked for this section's photo (a real Pexels photo of a
// group therapy session, i.e. real people's faces sourced from a stock
// site) to be replaced by a painting instead, on privacy grounds: GESA
// doesn't want to put real, scraped/stock human faces on the site at all,
// even in a generic illustrative spot like this one. Initially swapped in
// a generic blue-toned abstract stock painting as a placeholder.
//
// Phase 44 — Roy then sent the actual painting he wanted here: a teal-and-
// gold piece of layered hands cradling a glowing form inside leaves —
// thematically a much better fit (care, protection, many hands supporting
// one center) than the generic placeholder, and no real faces are
// depicted. It arrived as a full-page mockup screenshot rather than a bare
// image file, so the image itself (public/images/about/hero-painting.jpg)
// is cropped from that screenshot down to just the painting, re-saved at
// 1600px wide. Hosted locally rather than as an external URL, unlike the
// two Pexels photos this field held before, since this is now a real
// project asset rather than a stock-site reference.
//
// Phase 45 — layered in the site-wide scroll-motion system: text block
// gets a short staggered fade+rise entrance (eyebrow -> headline -> body
// -> CTAs -> badges, spec section 3's timing), the headline itself gets
// the same subtle ScrollText drift as Home's headline (one of the two
// biggest statements on the site), and both hero photo/painting elements
// get the restrained scale+drift ParallaxMedia effect from spec section 4
// — this is exactly the kind of "major image section" that spec calls
// out, unlike the small path-card thumbnails on Home which were left
// static. No copy, links, or layout structure changed.
//
// Phase 47 — swapped the section's plain `bg-background` for the same
// `.gold-banner` treatment added to Home's hero (app/globals.css), per
// Roy's request to bring that gold background to the About page too.
// Adjusted only the text colors that would otherwise have low contrast on
// gold (the eyebrow chip's background, and the subtitle/badges' color,
// both previously tuned for a pale background) — no copy, links, CTAs, or
// the painting/media panel changed.
export default function Hero({ content = HERO_CONTENT_FALLBACK }: { content?: HeroContent }) {
  return (
    <section className="gold-banner relative border-b border-border pt-16 pb-20">
      {/* Decorative Background — kept as its own absolutely-positioned,
          overflow-hidden layer (rather than putting overflow-hidden on the
          section itself) purely so this glow/doodle texture stays clipped
          to the hero bounds. Phase 50 removed the old media panel that used
          to bleed past the section's top edge, but this layer's own
          structure didn't need to change either way. */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Phase 46 — wrapped in ParallaxLayer for the same background-layer
            drift added to Home's glow blob; the existing translate-x/y
            utility classes on the blob itself are untouched, since the
            parallax transform is applied one level up on the wrapper
            rather than fighting with those Tailwind transforms directly. */}
        <ParallaxLayer speed={35} className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent-soft rounded-full blur-[100px] opacity-60 translate-x-1/3 -translate-y-1/4"></div>

          {/* Faint line-art doodles for texture, matching the reference
              mockup. Phase 67 — extracted into a shared component (now 5
              icon types/7 instances, up from 2 types/4 instances) so this
              same texture also appears on Home, Our Therapists, and
              Support Groups' gold sections, not just here. */}
          <GoldWatermarks />

          {/* Soft multi-color glow behind the headline. Phase 130 — the
              center stop was var(--clay) (gold), which clashed once the
              section behind it switched to the slate-grey `.gold-banner`
              background; swapped to a plain white highlight so the glow
              still reads as "soft light behind the headline" against the
              new background instead of a stray gold patch. --accent (sage
              green) was untouched — it never read as part of the gold
              treatment. */}
          <div className="absolute left-[10%] top-[24%] h-[260px] w-[420px] rounded-full bg-[radial-gradient(circle,white_0%,var(--accent)_45%,transparent_75%)] opacity-25 blur-[70px]" />
        </ParallaxLayer>
      </div>

      <div className="max-w-[1160px] mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.12fr] gap-12 items-center">
          {/* Text Content */}
          <div className="max-w-2xl relative">
            <Reveal type="fade-up" distance="sm" duration={0.5}>
              <span className="relative inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary bg-[#fff8ea]/85 shadow-sm rounded-full px-4 py-1.5 mb-5">
                <Sparkle size={13} /> {content.eyebrow}
              </span>
            </Reveal>
            <ScrollText distance={22}>
              <h1 className="relative font-serif text-[clamp(38px,5vw,60px)] font-semibold text-foreground leading-[1.08] tracking-[-0.025em] mb-6">
                <HighlightedText text={content.title} highlight={content.highlight} />
              </h1>
            </ScrollText>
            <Reveal type="fade-up" delay={0.08}>
              <p className="text-[20px] text-primary/80 leading-[1.55] mb-8 max-w-[34rem]">{content.subtitle}</p>
            </Reveal>

            <StaggerGroup className="flex flex-wrap gap-4 mt-6">
              <StaggerItem className="inline-block">
                <Link href={content.ctaPrimaryHref} className="inline-flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary-600 px-7 py-4 rounded-full text-[15px] font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-[1px]">
                  {content.ctaPrimaryLabel} <ArrowRight size={18} />
                </Link>
              </StaggerItem>
              <StaggerItem className="inline-block">
                <Link href={content.ctaSecondaryHref} className="inline-flex items-center justify-center gap-2 bg-card text-primary border-[1.5px] border-border hover:border-primary px-7 py-4 rounded-full text-[15px] font-semibold transition-all hover:-translate-y-[1px]">
                  {content.ctaSecondaryLabel}
                </Link>
              </StaggerItem>
            </StaggerGroup>

            {/* Badges */}
            <StaggerGroup className="flex flex-wrap gap-6 mt-10 text-primary/85 text-[14px] font-medium">
              <StaggerItem className="inline-block">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="text-accent" size={18} /> Verified Professionals
                </span>
              </StaggerItem>
              <StaggerItem className="inline-block">
                <span className="flex items-center gap-2">
                  <HeartHandshake className="text-accent" size={18} /> 100% Free Sessions
                </span>
              </StaggerItem>
              <StaggerItem className="inline-block">
                <span className="flex items-center gap-2">
                  <Users className="text-accent" size={18} /> Global Community
                </span>
              </StaggerItem>
            </StaggerGroup>
          </div>

          {/* Hero Image / Media — Phase 50: Roy sent a reference screenshot
              showing this painting displayed much smaller and fully
              contained (a modest square box beside the text) rather than
              the large asymmetric panel this used to bleed to the viewport
              edge as. Replaced the old two-block setup (a contained
              mobile/tablet card plus a separate absolute, edge-bleeding
              lg+ panel) with one unified, in-flow square card that's used
              at every breakpoint, capped at 460px so it stays a compact
              square even on wide screens instead of stretching. No text,
              links, or the trust-chip overlay's copy changed — only the
              media container's size/positioning and the image itself
              (the new painting Roy provided, which folds the same hands/
              light motif together with a boot, a seated figure, and a
              small group — echoing the veteran/crisis/community paths
              elsewhere on the site). */}
          <div className="relative mx-auto lg:mx-0 lg:ml-auto w-full max-w-[460px] aspect-square rounded-[26px] overflow-hidden shadow-2xl bg-gradient-to-br from-primary to-accent">
            <div className="absolute inset-0 bg-black/10 z-10"></div>
            <ParallaxMedia intensity={20} scale={1.07} className="absolute inset-0 z-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.backgroundImage}
                alt="A painting of hands cradling a glowing light, with a boot, a seated figure, and a small group woven into the surrounding leaves"
                className="w-full h-full object-cover relative"
              />
            </ParallaxMedia>
            {/* Phase 102 — Roy asked to remove the floating "Over 5,000+
                Sessions Completed" stat badge that used to sit over the
                bottom-left corner of this image, keeping the picture itself
                clean/unobstructed. This was a hardcoded stat (no
                Content-Manager field backed it — HeroContent has no matching
                key), so removing it here is the whole change. */}
          </div>
        </div>
      </div>
    </section>
  );
}
