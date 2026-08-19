import Link from "next/link";
import { Phone, MessageCircle, Globe2, ExternalLink, HeartPulse, ShieldCheck, HandHeart, Users } from "lucide-react";
import { getCrisisResources, getActiveTherapists } from "@/lib/queries";
import { matchTherapists } from "@/lib/ai/matchTherapists";
import IntakeMatchFlow from "@/components/intake/IntakeMatchFlow";
import PageHero from "@/components/ui/PageHero";

const PATH_ICON: Record<string, typeof HeartPulse> = {
  crisis: HeartPulse,
  veteran: ShieldCheck,
  general: HandHeart,
  helpers: Users,
};

const PATH_MAP: Record<string, { label: string; entryRoute: string }> = {
  crisis: { label: "In crisis right now", entryRoute: "crisis" },
  veteran: { label: "Veterans, reservists & families", entryRoute: "veteran_reservist_family" },
  general: { label: "Seeking support", entryRoute: "seeking_help" },
  helpers: { label: "Helping the helpers", entryRoute: "helpers" },
};

// Phase 20 — each path now feeds the same AI matching engine used by the
// Find Your Therapist wizard (lib/ai/matchTherapists.ts) with a hint
// describing what that path is about, instead of picking one therapist at
// random. This is what lets "Reach out now" show a short, relevant list of
// therapists to choose from rather than assigning just one.
const PATH_MATCH_HINT: Record<string, { treatmentType: string; symptoms: string[] }> = {
  crisis: {
    treatmentType: "Crisis support",
    symptoms: ["shaken by war, terror, or disaster", "needs fast, gentle help"],
  },
  veteran: {
    treatmentType: "Veteran, reservist, and military family support",
    symptoms: ["military service adjustment", "trauma from service", "strain on military families"],
  },
  general: {
    treatmentType: "General emotional support",
    symptoms: ["anxiety", "ongoing stress", "weight of antisemitism"],
  },
  helpers: {
    treatmentType: "Support for helpers and caregivers",
    symptoms: ["caregiver burnout", "compassion fatigue"],
  },
};

export default async function IntakePage({
  searchParams,
}: {
  searchParams: { path?: string };
}) {
  const pathKey = searchParams.path && PATH_MAP[searchParams.path] ? searchParams.path : "general";
  const { label } = PATH_MAP[pathKey];

  const therapists = await getActiveTherapists();
  const hint = PATH_MATCH_HINT[pathKey];
  const results =
    therapists.length > 0
      ? await matchTherapists({ symptoms: hint.symptoms, treatmentType: hint.treatmentType, genderPreference: "no_preference" }, therapists)
      : [];
  const matches = results
    .map((r) => {
      const therapist = therapists.find((t) => t.id === r.therapistId);
      return therapist ? { therapist, reasoning: r.reasoning } : null;
    })
    .filter((m): m is { therapist: (typeof therapists)[number]; reasoning: string } => m !== null);

  const crisisResources = pathKey === "crisis" ? await getCrisisResources() : [];

  return (
    <>
      <PageHero
        icon={PATH_ICON[pathKey]}
        eyebrow={label}
        title={pathKey === "crisis" ? "Help is available right now" : "You're one step from support"}
        narrow
      />
      <section className="section narrow pt-0">
      {pathKey === "crisis" && crisisResources.length > 0 && (
        <div className="mt-8 flex flex-col gap-2.5">
          {crisisResources.slice(0, 4).map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-3.5"
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] bg-accent-soft text-primary">
                {r.hotline.startsWith("http") ? (
                  <ExternalLink size={18} />
                ) : r.hotline.toLowerCase().includes("text") ? (
                  <MessageCircle size={18} />
                ) : (
                  <Phone size={18} />
                )}
              </span>
              <span>
                <strong className="block">{r.region}</strong>
                <span className="text-sm text-muted-fg">
                  {r.hotline} {r.hours ? `· ${r.hours}` : ""}
                </span>
              </span>
            </div>
          ))}
          <div className="mt-1 rounded-xl bg-accent-soft px-3.5 py-3 text-sm text-primary-600">
            GESA is not an emergency service. If you are in immediate danger, call your local emergency
            number.
          </div>
          <Link href="/" className="mx-auto mt-2 text-[12px]">
            <Globe2 size={14} className="inline mr-1" />
            More helplines at{" "}
            <a href="https://findahelpline.com" target="_blank" rel="noreferrer" className="underline">
              findahelpline.com
            </a>
          </Link>
        </div>
      )}

      <div className="mt-8">
        {pathKey === "crisis" && (
          <p className="mb-4 text-center text-[14.5px] text-muted-fg">
            You can also connect with a volunteer therapist for ongoing, free support.
          </p>
        )}
        {matches.length > 0 ? (
          <IntakeMatchFlow pathKey={pathKey} matches={matches} />
        ) : (
          <p className="text-center text-muted-fg">
            We don&apos;t have any verified therapists available right now — please check back soon or{" "}
            <Link href="/contact" className="underline">
              contact us
            </Link>
            .
          </p>
        )}
      </div>
      </section>
    </>
  );
}
