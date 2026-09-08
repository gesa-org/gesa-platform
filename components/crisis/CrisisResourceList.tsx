import { ExternalLink } from "lucide-react";
import { getResourcesForCountry, hasVerifiedResources } from "@/lib/crisisResources";
import CrisisResourceCard from "./CrisisResourceCard";

// Phase 169 — renders one of four states below the country selector:
// 1) no country picked yet — neutral prompt, no cards.
// 2) a country with verified data — its resources, emergency-first.
// 3) a country with NO verified data — the safe fallback (never a guessed
//    number): a plain statement plus a Befrienders Worldwide directory link.
// 4) (loading state) — this dataset is a static import, not a network
//    fetch, so there's no real async gap to show a spinner for; the prop
//    is accepted anyway so a future API-backed version of
//    crisisResourcesService can add one without changing this component's
//    contract.
export default function CrisisResourceList({
  countryCode,
  loading = false,
}: {
  countryCode: string | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <p role="status" className="rounded-2xl border border-border p-4 text-sm text-muted-fg">
        Loading resources…
      </p>
    );
  }

  if (!countryCode) {
    return (
      <p role="status" className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-fg">
        Select your country or region to find verified local crisis and emergency support.
      </p>
    );
  }

  const resources = getResourcesForCountry(countryCode);
  const verified = hasVerifiedResources(countryCode);

  if (!verified || resources.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col gap-2.5 rounded-2xl border border-border bg-secondary/40 p-4 text-sm"
      >
        <p className="font-medium text-foreground">
          We couldn&apos;t verify a local crisis line for this location.
        </p>
        <p className="text-muted-fg">If you are in immediate danger, call your local emergency number now.</p>
        <a
          href="https://www.befrienders.org/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-semibold text-primary underline"
        >
          Find a helpline worldwide <ExternalLink size={13} aria-hidden="true" />
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* Announced to screen readers whenever the country (and therefore
          this list) changes — a sighted user sees the cards swap, this is
          the equivalent cue for someone using assistive tech. aria-live
          "polite" so it doesn't interrupt whatever they're doing, same as
          the fallback state's own status region above. */}
      <p role="status" aria-live="polite" className="sr-only">
        Showing {resources.length} verified resource{resources.length === 1 ? "" : "s"} for{" "}
        {resources[0]?.countryName ?? countryCode}.
      </p>
      {resources.map((r) => (
        <CrisisResourceCard key={`${r.countryCode}-${r.serviceName}`} resource={r} />
      ))}
    </div>
  );
}
