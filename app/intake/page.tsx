import Link from "next/link";
import { Phone, MessageCircle, Globe2, ExternalLink, HeartPulse, ShieldCheck, HandHeart, Users } from "lucide-react";
import { getCrisisResources, getActiveTherapists } from "@/lib/queries";
import { matchTherapists } from "@/lib/ai/matchTherapists";
import { getPageContent } from "@/lib/content";
import { INTAKE_FLOW_CONTENT_FALLBACK } from "@/app/intake/intakeContent";
import IntakeMatchFlow from "@/components/intake/IntakeMatchFlow";
import PageHero from "@/components/ui/PageHero";
import { resolveEditorPreview } from "@/lib/ui-builder/pageContentResolver";
import EditorPreviewBridge from "@/components/ui-builder/public/EditorPreviewBridge";
import EditableText from "@/components/ui-builder/public/EditableText";

const PATH_ICON: Record<string, typeof HeartPulse> = {
  crisis: HeartPulse,
  veteran: ShieldCheck,
  general: HandHeart,
  helpers: Users,
};

const PATH_ENTRY_ROUTE: Record<string, string> = {
  crisis: "crisis",
  veteran: "veteran_reservist_family",
  general: "seeking_help",
  helpers: "helpers",
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
  searchParams: { path?: string; editorPreview?: string };
}) {
  const pathKey = searchParams.path && PATH_ENTRY_ROUTE[searchParams.path] ? searchParams.path : "general";
  const contentRaw = await getPageContent("component_intake_flow", INTAKE_FLOW_CONTENT_FALLBACK);
  const { resolved, isEditorPreview } = await resolveEditorPreview("intake", contentRaw as unknown as Record<string, unknown>, searchParams);
  const content = resolved as unknown as typeof contentRaw;
  const PATH_LABEL: Record<string, string> = {
    crisis: content.pathCrisisLabel,
    veteran: content.pathVeteranLabel,
    general: content.pathGeneralLabel,
    helpers: content.pathHelpersLabel,
  };
  const label = PATH_LABEL[pathKey];

  const therapists = await getActiveTherapists();
  const hint = PATH_MATCH_HINT[pathKey];
  const outcome =
    therapists.length > 0
      ? await matchTherapists({ symptoms: hint.symptoms, treatmentType: hint.treatmentType, genderPreference: "no_preference" }, therapists)
      : { matches: [], genderPreferenceHonored: true };
  const matches = outcome.matches
    .map((r) => {
      const therapist = therapists.find((t) => t.id === r.therapistId);
      return therapist ? { therapist, reasoning: r.reasoning } : null;
    })
    .filter((m): m is { therapist: (typeof therapists)[number]; reasoning: string } => m !== null);

  const crisisResources = pathKey === "crisis" ? await getCrisisResources() : [];

  const pathLabelContentId: Record<string, string> = {
    crisis: "intake.paths.crisisLabel",
    veteran: "intake.paths.veteranLabel",
    general: "intake.paths.generalLabel",
    helpers: "intake.paths.helpersLabel",
  };

  const page = (
    <>
      <PageHero
        icon={PATH_ICON[pathKey]}
        eyebrow={<EditableText contentId={pathLabelContentId[pathKey]} label="Path label" value={label} as="span" />}
        title={
          pathKey === "crisis" ? (
            <EditableText contentId="intake.hero.crisisTitle" label="Crisis path hero heading" value={content.crisisHeroTitle} as="span" />
          ) : (
            <EditableText contentId="intake.hero.defaultTitle" label="Default hero heading" value={content.defaultHeroTitle} as="span" />
          )
        }
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
            <EditableText contentId="intake.crisis.disclaimer" label="Crisis disclaimer" value={content.crisisDisclaimer} as="span" />
          </div>
          <Link href="/" className="mx-auto mt-2 text-[12px]">
            <Globe2 size={14} className="inline mr-1" />
            <EditableText contentId="intake.crisis.moreHelplinesText" label="More helplines text" value={content.moreHelplinesText} as="span" />{" "}
            <a href="https://findahelpline.com" target="_blank" rel="noreferrer" className="underline">
              findahelpline.com
            </a>
          </Link>
        </div>
      )}

      <div className="mt-8">
        {pathKey === "crisis" && (
          <p className="mb-4 text-center text-[14.5px] text-muted-fg">
            <EditableText contentId="intake.crisis.ongoingSupportPrompt" label="Ongoing-support prompt" value={content.ongoingSupportPrompt} as="span" />
          </p>
        )}
        {matches.length > 0 ? (
          <IntakeMatchFlow pathKey={pathKey} matches={matches} matchListIntro={content.matchListIntro} />
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

  return isEditorPreview ? <EditorPreviewBridge>{page}</EditorPreviewBridge> : page;
}
