import { Globe2, Link2, HeartHandshake, Sparkles, Users } from "lucide-react";

// Phase 67 — Roy pointed at the faint globe/chain-link line-art doodles on
// the About page's gold hero band (originally a one-off inline block in
// Hero.tsx, Phase 17) and asked for a few more of them, applied
// consistently across every gold-background section site-wide, not just
// About. Extracted the original 4 instances (2x Globe2, 2x Link2) here so
// the exact same texture is reused rather than re-implemented per page,
// and added 3 new icon types — HeartHandshake, Sparkles, Users — that fit
// GESA's mission (care, hope, community) the same way Globe2/Link2 fit
// "global alliance." Every instance keeps the original's very low
// opacity/strokeWidth so this reads as background texture, never
// competing with real content or text contrast.
//
// Meant to be rendered as a direct child of an existing
// `pointer-events-none overflow-hidden` decorative layer (see Hero.tsx,
// components/ui/PageHero.tsx, components/home/Paths.tsx) — it renders bare
// absolutely-positioned icons, not its own wrapper, so it drops into
// whichever `ParallaxLayer`/glow-blob layer a section already has.
export default function GoldWatermarks() {
  return (
    <>
      <Globe2 className="absolute left-[6%] top-[38%] h-24 w-24 text-foreground opacity-[0.05]" strokeWidth={1} />
      <Globe2 className="absolute left-[28%] top-[6%] h-14 w-14 text-foreground opacity-[0.05]" strokeWidth={1} />
      <Link2 className="absolute left-[2%] top-[10%] h-16 w-16 -rotate-12 text-foreground opacity-[0.05]" strokeWidth={1} />
      <Link2 className="absolute left-[22%] top-[70%] h-12 w-12 rotate-45 text-foreground opacity-[0.05]" strokeWidth={1} />
      <HeartHandshake className="absolute right-[8%] top-[16%] h-20 w-20 -rotate-6 text-foreground opacity-[0.05]" strokeWidth={1} />
      <Sparkles className="absolute right-[22%] top-[64%] h-12 w-12 rotate-12 text-foreground opacity-[0.05]" strokeWidth={1} />
      <Users className="absolute right-[3%] top-[48%] h-16 w-16 text-foreground opacity-[0.05]" strokeWidth={1} />
    </>
  );
}
