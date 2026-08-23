import Link from 'next/link';
import { ArrowRight, HeartHandshake, ShieldCheck, Users, Sparkle, Globe2, Link2 } from 'lucide-react';
import HighlightedText from '@/components/ui/HighlightedText';
import Reveal from '@/components/motion/Reveal';
import ScrollText from '@/components/motion/ScrollText';
import ParallaxMedia from '@/components/motion/ParallaxMedia';
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
  backgroundImage: "/images/about/hero-painting.jpg",
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
export default function Hero({ content = HERO_CONTENT_FALLBACK }: { content?: HeroContent }) {
  return (
    <section className="relative bg-background border-b border-border pt-16 pb-20">
      {/* Decorative Background — overflow-hidden lives here rather than on the
          section itself, so the glow/doodle layer stays clipped to the hero
          while the media card below is free to bleed past the section's own
          top edge and tuck under the sticky header. */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent-soft rounded-full blur-[100px] opacity-60 translate-x-1/3 -translate-y-1/4"></div>

        {/* Faint line-art doodles for texture, matching the reference mockup */}
        <Globe2 className="absolute left-[6%] top-[38%] h-24 w-24 text-foreground opacity-[0.05]" strokeWidth={1} />
        <Globe2 className="absolute left-[28%] top-[6%] h-14 w-14 text-foreground opacity-[0.05]" strokeWidth={1} />
        <Link2 className="absolute left-[2%] top-[10%] h-16 w-16 -rotate-12 text-foreground opacity-[0.05]" strokeWidth={1} />
        <Link2 className="absolute left-[22%] top-[70%] h-12 w-12 rotate-45 text-foreground opacity-[0.05]" strokeWidth={1} />

        {/* Soft multi-color glow behind the headline */}
        <div className="absolute left-[10%] top-[24%] h-[260px] w-[420px] rounded-full bg-[radial-gradient(circle,var(--clay)_0%,var(--accent)_45%,transparent_75%)] opacity-25 blur-[70px]" />
      </div>

      <div className="max-w-[1160px] mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.12fr] gap-12 items-center">
          {/* Text Content */}
          <div className="max-w-2xl relative">
            <Reveal type="fade-up" distance="sm" duration={0.5}>
              <span className="relative inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary bg-accent-soft rounded-full px-4 py-1.5 mb-5">
                <Sparkle size={13} /> {content.eyebrow}
              </span>
            </Reveal>
            <ScrollText distance={22}>
              <h1 className="relative font-serif text-[clamp(38px,5vw,60px)] font-semibold text-foreground leading-[1.08] tracking-[-0.025em] mb-6">
                <HighlightedText text={content.title} highlight={content.highlight} />
              </h1>
            </ScrollText>
            <Reveal type="fade-up" delay={0.08}>
              <p className="text-[20px] text-muted-fg leading-[1.55] mb-8 max-w-[34rem]">{content.subtitle}</p>
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
            <StaggerGroup className="flex flex-wrap gap-6 mt-10 text-muted-fg text-[14px] font-medium">
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

          {/* Hero Image / Media — contained card on mobile/tablet, and on large
              screens (see the twin block below) replaced by a version that
              bleeds to the viewport's right edge. Hidden at lg+ to avoid
              rendering the media twice. */}
          <div className="relative rounded-[26px] overflow-hidden shadow-2xl aspect-[9/10] bg-gradient-to-br from-primary to-accent lg:hidden">
            <div className="absolute inset-0 bg-black/10 z-10"></div>
            <ParallaxMedia intensity={14} scale={1.05} className="absolute inset-0 z-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.backgroundImage}
                alt="A painting of hands cradling a glowing form within layered leaves"
                className="w-full h-full object-cover relative"
              />
            </ParallaxMedia>
            <div className="absolute left-6 bottom-6 bg-[#e3e8ef]/95 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 shadow-soft z-20">
              <div className="w-10 h-10 rounded-xl bg-accent-soft text-primary flex items-center justify-center shadow-inner">
                <HeartHandshake size={20} />
              </div>
              <div className="text-[13px] font-semibold text-foreground">
                Over <span className="text-primary font-bold">5,000+</span><br/>
                Sessions Completed
              </div>
            </div>
          </div>
          {/* Spacer to reserve the second grid track's width so the text column
              doesn't stretch full-width once the real media card (below,
              positioned relative to the section rather than this max-width
              wrapper) bleeds off to the side. */}
          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      </div>

      {/* Hero Image / Media, large screens only — bleeds to the right edge of
          the viewport and tucks slightly under the sticky header, matching
          the editorial "breaking the frame" look from the reference. It's
          positioned relative to this full-width <section>, not the max-width
          wrapper above, which is what lets it reach the actual browser edge
          instead of stopping at the 1160px content boundary. The header's
          z-index (40) sits above this block's (10), so the overlap at the
          top resolves cleanly with no stacking bug. */}
      <div className="hidden lg:block absolute right-0 top-[-56px] bottom-0 z-10 w-[48vw] max-w-[760px] min-h-[560px] overflow-hidden rounded-l-[26px] shadow-2xl bg-gradient-to-br from-primary to-accent">
        <div className="absolute inset-0 bg-black/10 z-10"></div>
        {/* Phase 18 — swapped the looping video back for a static photo. Roy's
            reference mockup showed a still image, not motion, and asked for an
            exact match — a playing video is a real, meaningful difference from
            a static mockup, so a still photo fits the ask better here.
            Phase 43 — this <img> was still hardcoded to the old Pexels photo
            URL directly rather than reading `content.backgroundImage` like
            its mobile/tablet twin above did, so swapping the image via the
            Content Manager wouldn't have updated this large-screen version.
            Fixed to read the same field, and replaced the photo itself (real
            people's faces) with a painting for the reason described below. */}
        <ParallaxMedia intensity={22} scale={1.06} className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content.backgroundImage}
            alt="A painting of hands cradling a glowing form within layered leaves"
            className="w-full h-full object-cover relative"
          />
        </ParallaxMedia>

        {/* Trust Chip Overlay */}
        <div className="absolute left-6 bottom-6 bg-[#e3e8ef]/95 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 shadow-soft z-20">
          <div className="w-10 h-10 rounded-xl bg-accent-soft text-primary flex items-center justify-center shadow-inner">
            <HeartHandshake size={20} />
          </div>
          <div className="text-[13px] font-semibold text-foreground">
            Over <span className="text-primary font-bold">5,000+</span><br/>
            Sessions Completed
          </div>
        </div>
      </div>
    </section>
  );
}
