"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { LifeBuoy, Shield, Heart, Users, ArrowRight } from "lucide-react";

// Phase 11 — same four paths, same copy, same links as before. Only the
// presentation changed: a scroll-pinned, crossfading showcase modeled on the
// reference video Roy shared.
//
// Phase 11.1 fix: the first version drove opacity from React state and then
// layered a CSS `transition` on top of it. Every scroll tick restarted that
// transition mid-flight, so the crossfade never caught up to the actual
// scroll position — that's what read as "staggering." Fixed by removing the
// CSS transition entirely and instead running a continuous
// requestAnimationFrame loop that smooths (lerps) the progress value itself
// and writes opacity/transform straight to the DOM via refs, bypassing React
// re-renders. This is the standard technique behind smooth scroll-scrubbed
// effects (it's what libraries like GSAP ScrollTrigger do internally) — one
// continuously-updated number driving the animation, no competing timers.
//
// Images: one real, on-theme stock photo per path (Unsplash). This
// sandbox's outbound network is proxied and explicitly blocks
// images.unsplash.com for me, so I still can't preview-load these myself —
// confirmed via a direct connectivity test, not a guess. Production
// (Vercel) has normal internet access, and the Hero section's photo from
// this same domain has been live and working since Phase 7, so the domain
// itself is not the risk — only whether these specific photo ids still
// exist. Flag me immediately if any path's image doesn't load and I'll
// swap it same-session.
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
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1200&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function Paths() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rawProgress = useRef(0);
  const smoothProgress = useRef(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    function updateRawProgress() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollableHeight = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(scrollableHeight, 0));
      rawProgress.current = scrollableHeight > 0 ? (scrolled / scrollableHeight) * (PATHS.length - 1) : 0;
    }

    function tick() {
      // Lerp toward the real scroll position every frame — this is the
      // smoothing, done once, in one place, instead of via CSS transitions
      // that fight the next scroll update.
      smoothProgress.current += (rawProgress.current - smoothProgress.current) * 0.18;
      const p = smoothProgress.current;

      PATHS.forEach((_, i) => {
        const distance = Math.abs(p - i);
        const textEl = textRefs.current[i];
        const imgEl = imageRefs.current[i];

        if (textEl) {
          const textOpacity = Math.max(0, 1 - distance * 1.6);
          textEl.style.opacity = String(textOpacity);
          textEl.style.pointerEvents = textOpacity > 0.5 ? "auto" : "none";
        }
        if (imgEl) {
          const imgOpacity = Math.max(0, 1 - distance);
          const scale = 1.06 - Math.min(distance, 1) * 0.06;
          imgEl.style.opacity = String(imgOpacity);
          imgEl.style.transform = `scale(${scale})`;
        }
      });

      rafRef.current = requestAnimationFrame(tick);
    }

    function onScroll() {
      updateRawProgress();
    }

    updateRawProgress();
    smoothProgress.current = rawProgress.current;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
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
              {PATHS.map((p, i) => (
                <div
                  key={p.id}
                  ref={(el) => {
                    textRefs.current[i] = el;
                  }}
                  className="absolute inset-0 flex flex-col justify-center"
                  style={{ opacity: i === 0 ? 1 : 0 }}
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
              ))}
            </div>

            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[26px] shadow-2xl">
              {PATHS.map((p, i) => (
                <div
                  key={p.id}
                  ref={(el) => {
                    imageRefs.current[i] = el;
                  }}
                  className="absolute inset-0"
                  style={{ opacity: i === 0 ? 1 : 0, willChange: "opacity, transform" }}
                >
                  <Image src={p.image} alt={p.title} fill className="object-cover" priority={i === 0} />
                </div>
              ))}
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
