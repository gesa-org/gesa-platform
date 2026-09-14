// Phase 192 — extracted from PageHero.tsx (the shared secondary-page hero
// used by Our Therapists, Support Groups, FAQ, Contact, and legal pages) so
// the exact same decorative background layer — same ParallaxLayer speed,
// same blob size/blur/opacity/position, same conditional GoldWatermarks
// texture, same layering/z-index/pointer-events approach, and (via the
// `.gold-banner` class each caller already applies to its own <section>)
// the same animated `gold-sheen` sweep and `prefers-reduced-motion` handling
// from globals.css — can be reused verbatim on the About/"Our Specialists"
// hero (components/Hero.tsx) instead of a bespoke, differently-sized copy.
//
// This renders only the decorative layer itself. The caller is still
// responsible for: putting `.gold-banner` (plus `relative overflow-hidden`)
// on its hero <section>, and keeping its actual content in a `relative z-10`
// layer above this one — see PageHero.tsx and Hero.tsx for the pattern.
import ParallaxLayer from '@/components/motion/ParallaxLayer';
import GoldWatermarks from '@/components/ui/GoldWatermarks';

export default function GoldHeroGlow({ gold = false }: { gold?: boolean }) {
  return (
    <ParallaxLayer speed={30} className="pointer-events-none absolute inset-0 z-0">
      <div
        className={`absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/4 translate-x-1/3 rounded-full blur-[100px] ${
          gold ? "bg-white/25" : "bg-accent-soft opacity-60"
        }`}
      />
      {gold && <GoldWatermarks />}
    </ParallaxLayer>
  );
}
