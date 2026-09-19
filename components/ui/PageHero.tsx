import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";
import GoldHeroGlow from "@/components/ui/GoldHeroGlow";

interface PageHeroProps {
  icon?: LucideIcon;
  // Phase 135 — widened from `string` to `ReactNode` (matching `title`/
  // `description` below) so a page's own server component can pass an
  // `<EditableText>` element here for the Visual Page Editor's click-to-
  // select canvas. Every existing caller keeps passing a plain string,
  // which renders exactly as before — this is a strictly additive change.
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  narrow?: boolean;
  maxWidth?: string;
  className?: string;
  children?: ReactNode;
  /** Optional decorative media layer for a single page-specific hero. */
  backgroundMedia?: ReactNode;
  /** Turns off the shared glow/watermarks when page-specific media owns the background. */
  showDecorativeGlow?: boolean;
  /** Phase 47 — opt-in gold banner background (see app/globals.css's
   * `.gold-banner`). Defaults to false so FAQ, Contact, and the legal
   * pages — which also render through this component — keep their
   * existing light banner exactly as before; only the pages Roy named
   * (Our Therapists, Support Groups) pass this explicitly. */
  gold?: boolean;
}

// Phase 12 — shared intro-band treatment so every page reads as one
// consistent brand, matching the homepage Hero's polish: a soft blurred
// decorative accent behind the text and a pill-shaped eyebrow badge with an
// icon, instead of the plain flat `.eyebrow` text every secondary page used
// before. Pages pass their existing copy in unchanged — this only replaces
// the wrapper markup, never the words.
//
// Phase 45 — since this one component is the entry heading for nearly
// every secondary page (Our Therapists, Support Groups, FAQ, Contact,
// legal pages, etc. — anything built on SimplePageContent), giving it the
// same short staggered fade+rise entrance as Home/About's hero text is
// the single highest-leverage way to make the scroll-motion system feel
// consistent site-wide rather than only on the two pages with a bespoke
// Hero component.
//
// Phase 46 — added the same ParallaxLayer background drift used on
// Home/About to this component's decorative blob too, which — since
// nearly every secondary page shares this one banner — means Our
// Therapists, Support Groups, FAQ, and Contact all picked up that depth
// cue from one file, not three separate integrations.
//
// Phase 47 — added the opt-in `gold` prop (see the interface comment
// above). Same reasoning as Hero.tsx: on the gold background, the
// eyebrow chip and description text needed a higher-contrast color than
// the pale-background defaults, so those two are conditional on `gold`;
// everything else (copy, icon, layout, the non-gold pages' appearance) is
// unchanged.
//
// Phase 67 — Roy asked for the same faint line-art watermark texture on
// About's gold Hero band to appear on every other gold-background section
// site-wide, for consistency. Since this one component is the shared gold
// banner for Our Therapists and Support Groups (the two other pages Roy
// named), rendering <GoldWatermarks /> here — gated behind the existing
// `gold` prop, same as the other gold-only styling above — picks both of
// them up from one change. FAQ/Contact/legal pages pass `gold={false}` (or
// omit it) and are completely unaffected.
//
// Phase 159 — briefly made the title/description switch to white/white-80
// when `gold` is true, to stay legible on a deep-navy banner background;
// reverted alongside the rest of that phase once Roy said the new color
// didn't work on the live site.
//
// Phase 232 — Roy sent 2 reference screenshots (Our Professionals' and
// Find Support's gold-banner heroes, both showing a white title on the
// light `--slate-banner` background) and asked the text to switch to black,
// "same with the other text color" — i.e. matching the dark text every
// non-gold PageHero page (Contact, FAQ, legal pages) already uses. That
// white styling actually predates this file's Phase 159 revert note above:
// this component's `gold ? "text-white" : ...` conditional was never
// actually reverted alongside the rest of that phase (only Hero.tsx/Paths.tsx
// were, per their own Phase 159 comments) — `--slate-banner` is a light
// blue-gray, not the dark navy that reverted white-text change was tuned
// for, so white-on-slate-banner has been low-contrast on every gold
// PageHero page (Our Professionals, Find Support) since. Fixed by dropping
// the `gold` branch entirely for both title and description — both pages
// affected already have a dark `text-primary` eyebrow reading fine against
// this same background, so the title (now unset, inheriting the site's
// default dark heading color) and description (now `text-muted-fg`, the
// same non-gold default) read the same way.
export default function PageHero({
  icon: Icon,
  eyebrow,
  title,
  description,
  narrow = false,
  maxWidth,
  className = "",
  children,
  backgroundMedia,
  showDecorativeGlow = true,
  gold = false,
}: PageHeroProps) {
  return (
    <section className={`hero relative overflow-hidden ${gold ? "gold-banner" : ""} ${className}`}>
      {backgroundMedia}
      {showDecorativeGlow && <GoldHeroGlow gold={gold} />}
      <StaggerGroup
        className={`relative z-10 text-center ${narrow ? "narrow" : "wrap"}`}
        style={maxWidth ? { maxWidth } : undefined}
        staggerDelay={0.08}
      >
        <StaggerItem>
          <span
            className={`mb-5 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-semibold text-primary ${
              gold ? "bg-[#fff8ea]/85 shadow-sm" : "bg-accent-soft"
            }`}
          >
            {Icon && <Icon size={13} />} {eyebrow}
          </span>
        </StaggerItem>
        <StaggerItem>
          <h1 className="mx-auto mb-2.5 mt-1 max-w-[760px] text-[clamp(32px,4.5vw,44px)]">{title}</h1>
        </StaggerItem>
        {description && (
          <StaggerItem>
            <div className="mx-auto max-w-[620px] text-muted-fg">{description}</div>
          </StaggerItem>
        )}
        {children}
      </StaggerGroup>
    </section>
  );
}
