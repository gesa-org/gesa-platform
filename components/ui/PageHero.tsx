import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";

interface PageHeroProps {
  icon?: LucideIcon;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  narrow?: boolean;
  maxWidth?: string;
  className?: string;
  children?: ReactNode;
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
export default function PageHero({
  icon: Icon,
  eyebrow,
  title,
  description,
  narrow = false,
  maxWidth,
  className = "",
  children,
}: PageHeroProps) {
  return (
    <section className={`hero relative overflow-hidden ${className}`}>
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/4 translate-x-1/3 rounded-full bg-accent-soft opacity-60 blur-[100px]" />
      </div>
      <StaggerGroup
        className={`relative z-10 text-center ${narrow ? "narrow" : "wrap"}`}
        style={maxWidth ? { maxWidth } : undefined}
        staggerDelay={0.08}
      >
        <StaggerItem>
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-4 py-1.5 text-[13px] font-semibold text-primary">
            {Icon && <Icon size={13} />} {eyebrow}
          </span>
        </StaggerItem>
        <StaggerItem>
          <h1 className="mx-auto mb-2.5 mt-1 max-w-[760px] text-[clamp(32px,4.5vw,44px)]">{title}</h1>
        </StaggerItem>
        {description && (
          <StaggerItem>
            <p className="mx-auto max-w-[620px] text-muted-fg">{description}</p>
          </StaggerItem>
        )}
        {children}
      </StaggerGroup>
    </section>
  );
}
