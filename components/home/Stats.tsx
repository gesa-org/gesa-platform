import { ShieldCheck, Globe, DollarSign, Users } from "lucide-react";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";
import { getPageContent, type HomeStatsContent } from "@/lib/content";

// Phase 83 — Roy asked for this row to become four icon badges (Verified
// Profiles / Multilingual Support / Clear Session Fees / Global Community)
// instead of the four counted-up numbers it used to show. Icons are fixed
// per position here, same convention as CrisisButton's resource icons —
// only the label text comes from the Content Manager.
const ICONS = [ShieldCheck, Globe, DollarSign, Users];

export const HOME_STATS_CONTENT_FALLBACK: HomeStatsContent = {
  published: true,
  badge1Label: "Verified Profiles",
  badge2Label: "Multilingual Support",
  badge3Label: "Clear Session Fees",
  badge4Label: "Global Community",
};

// Phase 68 — background originally the shared --sage-soft token, matched
// with the About page's legal/tax-note section.
// Later — Roy asked to swap the 4 icon badges' circle color from the pale
// blue-gray --card token to "Sand Brown" (#CBA560) — see --sand-brown in
// app/globals.css.
// Later still — Roy sent a reference swatch ("#9BA689, Green Sage") for
// this row's own band background specifically, a more saturated sage than
// --sage-soft. Moved to its own --green-sage token rather than retuning
// --sage-soft, since that token is still used as-is on Donate's trust-
// badges row, which wasn't part of this request.
// Phase 163 — Roy's Home-page palette spec explicitly rules out sage
// ("no sage, no blue-gray anywhere on this page") in favor of an ivory-
// dominant page with gold reserved for specific accents. This row sits on
// the Home page only (this component isn't shared with any other page,
// unlike DonateBand below it), so `bg-green-sage` → `bg-clay-soft` — the
// site's existing pale gold/ivory wash token, already used elsewhere on
// this same page for the pathway cards' back faces, rather than a brand
// new color. The `--green-sage` token itself is untouched in globals.css
// in case it's wanted again elsewhere; only this one usage changed. The
// icon circles (`bg-sand-brown`) were already gold-family and unaffected.
// Phase 164 — Roy sent a fuller Home-page mockup putting this row on a
// solid deep-navy band instead (matching the "deep blue" share of his
// palette spec), with the rest of the page (hero, closing band) reading
// ivory around it. `bg-clay-soft` → `bg-primary` (the same deep-slate navy
// used by this site's other dark bands, e.g. DonateBand below it). Label
// text flips from `text-primary` to `text-primary-fg` (this token's own
// "readable text on --primary" pairing, see globals.css) since dark-navy
// text on a now-dark-navy background would be invisible — the gold icon
// circles (`bg-sand-brown text-primary`) already read fine against a dark
// band and are untouched.
// Phase 170 — Roy's new reference mockup shows this same badges row sitting
// directly on the page's cool-gray field (see Paths.tsx/globals.css
// `--home-gray`), with no separate navy band around it — only the page's
// closing CTA band stays dark in that reference. `bg-primary` → the new
// `--home-gray` token, and label text flips back from `text-primary-fg` to
// `text-primary` (dark-on-light again, same pairing this row used before
// Phase 164). Gold icon circles (`bg-sand-brown text-primary`) read fine on
// either background and are untouched.
export default async function Stats() {
  const content = await getPageContent("component_home_stats", HOME_STATS_CONTENT_FALLBACK);
  const badges = [
    { icon: ICONS[0], label: content.badge1Label },
    { icon: ICONS[1], label: content.badge2Label },
    { icon: ICONS[2], label: content.badge3Label },
    { icon: ICONS[3], label: content.badge4Label },
  ];

  return (
    <section className="border-y border-border bg-[var(--home-gray)] py-10">
      <StaggerGroup className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-center gap-x-12 gap-y-6 px-6 sm:justify-between">
        {badges.map((b) => (
          <StaggerItem key={b.label} className="flex items-center gap-3.5">
            <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-sand-brown text-primary shadow-sm">
              <b.icon size={22} />
            </span>
            <span className="max-w-[130px] text-left text-[13px] font-semibold uppercase leading-snug tracking-wide text-primary">
              {b.label}
            </span>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
