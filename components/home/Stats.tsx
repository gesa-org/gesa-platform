import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";
import AnimatedCounter from "@/components/motion/AnimatedCounter";
import { getPageContent, type HomeStatsContent } from "@/lib/content";

// Phase 80 round 2 — these four value/label pairs were hardcoded with no
// Content Manager wiring. Values are content here too (not just labels) —
// an admin should be able to update "200+ Verified therapists" to a real,
// current count without a code change.
export const HOME_STATS_CONTENT_FALLBACK: HomeStatsContent = {
  published: true,
  stat1Value: "200+",
  stat1Label: "Verified therapists",
  stat2Value: "6",
  stat2Label: "Free sessions each",
  stat3Value: "20+",
  stat3Label: "Languages supported",
  stat4Value: "Global",
  stat4Label: "Support circles",
};

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
export default async function Stats() {
  const content = await getPageContent("component_home_stats", HOME_STATS_CONTENT_FALLBACK);
  const stats = [
    { value: content.stat1Value, label: content.stat1Label },
    { value: content.stat2Value, label: content.stat2Label },
    { value: content.stat3Value, label: content.stat3Label },
    { value: content.stat4Value, label: content.stat4Label },
  ];

  return (
    <section className="border-y border-border bg-sage-soft py-14">
      <StaggerGroup className="mx-auto grid max-w-[1160px] grid-cols-2 gap-6 px-6 text-center md:grid-cols-4">
        {stats.map((s) => (
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
