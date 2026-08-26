import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";
import AnimatedCounter from "@/components/motion/AnimatedCounter";

const STATS = [
  { value: "200+", label: "Verified therapists" },
  { value: "6", label: "Free sessions each" },
  { value: "20+", label: "Languages supported" },
  { value: "Global", label: "Support circles" },
];

// Phase 45 — spec section 8 ("Statistics / Metrics"): the numbers count up
// from 0 when this row scrolls into view, via AnimatedCounter. That
// component already handles the one non-numeric value here ("Global")
// gracefully — it just renders the word statically, no animation — so no
// special-casing is needed in this file. Card-style stagger entrance on
// the four columns themselves, same primitive used everywhere else.
// Phase 68 — background changed from --card (pale blue-gray) to the new
// --sage-soft token (light sage green), matched consistently with the
// About page's legal/tax-note section, per Roy's request to unify both
// under one light sage green rather than two unrelated pale tones.
export default function Stats() {
  return (
    <section className="border-y border-border bg-sage-soft py-14">
      <StaggerGroup className="mx-auto grid max-w-[1160px] grid-cols-2 gap-6 px-6 text-center md:grid-cols-4">
        {STATS.map((s) => (
          <StaggerItem key={s.label}>
            <div className="font-serif text-[46px] font-semibold tracking-tight text-primary">
              <AnimatedCounter value={s.value} />
            </div>
            <div className="text-muted-fg">{s.label}</div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
