"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LifeBuoy, Shield, Heart, Users, ArrowRight } from "lucide-react";

// Phase 11 — same four paths, same copy, same links as before. Only the
// layout changed: a scroll-pinned, crossfading showcase modeled on the
// reference video Roy shared (a pinned split-screen panel where the image
// zooms/crossfades between items as you scroll, in sync with the text).
// Implemented with a plain scroll listener + CSS opacity/transform rather
// than a new animation library, so there's no added dependency and it works
// the same in every modern browser.
//
// Placeholder stock photos (Unsplash) — this sandbox's network restrictions
// meant I couldn't preview-load these before shipping; please confirm they
// render correctly after deploy and swap them for real photos whenever you
// have them.
const PATHS = [
  {
    id: "crisis",
    icon: LifeBuoy,
    title: "In crisis right now",
    description:
      "For anyone shaken by war, terror, or disaster. Fast, gentle help when you can't wait — an initial set of free sessions to start.",
    ctaLink: "/intake?path=crisis",
    ctaLabel: "Reach out now",
    badgeClass: "bg-destructive text-white",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "veteran",
    icon: Shield,
    title: "Veterans, reservists & families",
    description:
      "For the long shadow of service — adjustment, ongoing stress, trauma, and the strain on families. Unlimited access, for as long as you need it.",
    ctaLink: "/intake?path=veteran",
    ctaLabel: "Reach out now",
    badgeClass: "bg-primary-600 text-white",
    image: "https://images.unsplash.com/photo-1516307365426-bea591f05011?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "general",
    icon: Heart,
    title: "Seeking support",
    description:
      "For anyone carrying anxiety, ongoing stress, or the weight of antisemitism. Start here — more is coming.",
    ctaLink: "/intake?path=general",
    ctaLabel: "Reach out now",
    badgeClass: "bg-accent text-white",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "helpers",
    icon: Users,
    title: "Helping the helpers",
    description: "For therapists and caregivers. When you hold others' pain, your care is free too.",
    ctaLink: "/intake?path=helpers",
    ctaLabel: "Book a session",
    badgeClass: "bg-clay text-white",
    image: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function Paths() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;

    function computeProgress() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollableHeight = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(scrollableHeight, 0));
      const next = scrollableHeight > 0 ? (scrolled / scrollableHeight) * (PATHS.length - 1) : 0;
      setProgress(next);
    }

    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(computeProgress);
    }

    computeProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section aria-labelledby="paths-heading">
      <div className="section wrap pb-0">
        <div className="text-center">
          <span className="eyebrow">Four paths to support</span>
          <h2 id="paths-heading" className="mx-auto mt-3 mb-2.5 max-w-[760px] text-[34px]">
            Two clicks to support
          </h2>
          <p className="mx-auto max-w-[620px] text-muted-fg">
            Choose your path and confirm — you&apos;ll be matched with a therapist who understands,
            for a free, confidential session. No forms, no accounts, no questions upfront.
          </p>
        </div>
      </div>

      <div ref={containerRef} className="relative" style={{ height: `${PATHS.length * 100}vh` }}>
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div className="wrap grid w-full items-center gap-10 md:grid-cols-2">
            <div className="relative h-[320px] md:h-[380px]">
              {PATHS.map((p, i) => {
                const distance = Math.abs(progress - i);
                const opacity = Math.max(0, 1 - distance * 1.4);
                return (
                  <div
                    key={p.id}
                    className="absolute inset-0 flex flex-col justify-center transition-opacity duration-150"
                    style={{ opacity, pointerEvents: opacity > 0.5 ? "auto" : "none" }}
                  >
                    <div className={`flex h-[52px] w-[52px] items-center justify-center rounded-[14px] ${p.badgeClass}`}>
                      <p.icon size={24} />
                    </div>
                    <h3 className="mt-3.5 mb-2 text-[24px]">{p.title}</h3>
                    <p className="max-w-[440px] text-[15px] text-muted-fg">{p.description}</p>
                    <Link
                      href={p.ctaLink}
                      className="mt-5 inline-flex w-fit items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[15px] font-semibold text-primary-fg transition-colors hover:bg-primary-600"
                    >
                      {p.ctaLabel} <ArrowRight size={16} />
                    </Link>
                  </div>
                );
              })}
            </div>

            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[26px] shadow-2xl">
              {PATHS.map((p, i) => {
                const distance = Math.abs(progress - i);
                const opacity = Math.max(0, 1 - distance);
                const scale = 1.04 - Math.min(distance, 1) * 0.04;
                return (
                  <div
                    key={p.id}
                    className="absolute inset-0"
                    style={{ opacity, transform: `scale(${scale})`, transition: "opacity 150ms linear" }}
                  >
                    <Image src={p.image} alt={p.title} fill className="object-cover" priority={i === 0} />
                  </div>
                );
              })}
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>

      <div className="section wrap pt-10">
        <p className="text-center text-[13px] text-muted-fg">
          Up to six free sessions · verified volunteer therapists · secure, confidential communication
        </p>
      </div>
    </section>
  );
}
