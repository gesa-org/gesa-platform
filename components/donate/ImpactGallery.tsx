"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Reveal from "@/components/motion/Reveal";
import EditableText from "@/components/ui-builder/public/EditableText";
import EditableImage from "@/components/ui-builder/public/EditableImage";

// Phase 224 — "See the impact" horizontal editorial photo gallery, inserted
// between Testimonials and the donation form per Roy's required narrative
// flow (PHOTO -> STORY -> HUMAN VOICE -> IMPACT -> DONATION -> THANK YOU).
//
// A client component (not the plain server-rendered grid the other photo
// sections use) because the desktop prev/next controls need a scroll-
// container ref and click handlers — DonatePage.tsx itself stays an async
// Server Component and only passes already-resolved strings/contentIds in,
// same boundary EditableImage's own comment documents.
//
// Widths are intentionally varied per item (not a uniform grid) for the
// "editorial" feel Roy's spec asked for; on narrow viewports every item
// falls back to a consistent "~80% of viewport" width so exactly one photo
// reads as the main image with a visible sliver of the next one, signalling
// horizontal scroll. `motion-safe:scroll-smooth` means the smooth-scroll
// animation (both the buttons and native swipe) is skipped entirely under
// `prefers-reduced-motion: reduce` — no autoplay, no motion forced on
// anyone who's asked to avoid it.
export interface ImpactGalleryPhoto {
  src: string;
  alt: string;
  caption: string;
  fallbackSrc: string;
  fallbackAlt: string;
  imageContentId: string;
  altContentId: string;
  captionContentId: string;
  /** Tailwind width classes for the editorial varied-width effect. */
  widthClassName: string;
}

export default function ImpactGallery({
  eyebrow,
  eyebrowContentId,
  heading,
  headingContentId,
  subtitle,
  subtitleContentId,
  photos,
}: {
  eyebrow: string;
  eyebrowContentId: string;
  heading: string;
  headingContentId: string;
  subtitle: string;
  subtitleContentId: string;
  photos: ImpactGalleryPhoto[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByAmount(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({
      left: direction * Math.round(el.clientWidth * 0.7),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  return (
    <section className="section border-t border-border bg-background">
      <div className="wrap">
        <Reveal type="fade-up">
          <div className="mx-auto mb-9 max-w-[620px] text-center">
            <span className="eyebrow">
              <EditableText contentId={eyebrowContentId} label="Impact gallery eyebrow" value={eyebrow} as="span" />
            </span>
            <h2 className="mt-3 font-serif text-[26px] font-semibold text-foreground">
              <EditableText contentId={headingContentId} label="Impact gallery heading" value={heading} as="span" />
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-fg">
              <EditableText contentId={subtitleContentId} label="Impact gallery subtitle" value={subtitle} as="span" />
            </p>
          </div>
        </Reveal>

        <div className="relative">
          {/* Desktop-only prev/next controls — a horizontally scrollable
              region is already usable with a trackpad/mouse wheel/touch, so
              these are a convenience layer, not the only way in; hidden on
              mobile where swiping is the natural interaction. */}
          <button
            type="button"
            aria-label="Scroll gallery left"
            onClick={() => scrollByAmount(-1)}
            className="absolute -left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-soft transition-colors hover:bg-accent-soft lg:flex"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Scroll gallery right"
            onClick={() => scrollByAmount(1)}
            className="absolute -right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-soft transition-colors hover:bg-accent-soft lg:flex"
          >
            <ChevronRight size={18} />
          </button>

          <div
            ref={scrollerRef}
            role="region"
            aria-label="See the impact — photo gallery"
            tabIndex={0}
            className="motion-safe:scroll-smooth flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {photos.map((photo, i) => (
              <figure
                key={photo.imageContentId}
                className={`shrink-0 snap-start ${photo.widthClassName}`}
              >
                <div className="aspect-[4/5] w-full overflow-hidden rounded-[var(--radius)] shadow-soft sm:aspect-[3/4]">
                  <EditableImage
                    contentId={photo.imageContentId}
                    altContentId={photo.altContentId}
                    label={`Impact gallery photo ${i + 1}`}
                    src={photo.src}
                    alt={photo.alt}
                    fallbackSrc={photo.fallbackSrc}
                    fallbackAlt={photo.fallbackAlt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <figcaption className="mt-2.5 text-[13px] font-medium text-muted-fg">
                  <EditableText contentId={photo.captionContentId} label={`Impact gallery photo ${i + 1} caption`} value={photo.caption} as="span" />
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
