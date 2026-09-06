import Link from "next/link";
import { Phone, MessageCircle, Globe2, ExternalLink, HeartPulse, ShieldCheck, HandHeart, Users } from "lucide-react";
import { getCrisisResources, getTherapistsByPathway } from "@/lib/queries";
import { getPageContent } from "@/lib/content";
import { INTAKE_FLOW_CONTENT_FALLBACK } from "@/app/intake/intakeContent";
import TherapistsDirectory, { THERAPISTS_DIRECTORY_CONTENT_FALLBACK } from "@/components/TherapistsDirectory";
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

// Phase 152 — the page heading changes based on the selected pathway card
// (components/home/Paths.tsx). Not Content-Manager-backed like the eyebrow/
// hero title above it — a fixed, structural heading tied 1:1 to the pathway
// key itself, not page-specific marketing copy an admin would rewrite.
const PATHWAY_HEADING: Record<string, string> = {
  crisis: "Available Resilience Support Professionals",
  veteran: "Available Veterans Support Professionals",
  general: "Available Support Professionals",
  helpers: "Available Support Professionals for Helpers",
};

// Phase 152 — replaced the old AI/rule-based fuzzy matching approach (each
// path fed a hardcoded { treatmentType, symptoms } hint into
// lib/ai/matchTherapists.ts, capped at MAX_MATCHES = 3) with a direct
// database filter on the new therapists.support_pathways column (see
// getTherapistsByPathway() in lib/queries.ts and the
// add_support_pathways_to_therapists migration). Every eligible therapist
// now shows, not just up to 3 AI-picked ones — reusing the same
// TherapistsDirectory component (with its filter sidebar, result count, and
// TherapistCard grid) that the Our Professionals page uses, rather than a
// second, parallel results UI.
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

  // Phase 152 — is_active is already enforced by the therapists_public view
  // this reads from; is_verified is additionally hard-filtered inside
  // getTherapistsByPathway() itself (see that function's own comment for why
  // that's a scoped exception to the general directory's usual stance).
  const therapists = await getTherapistsByPathway(pathKey);

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
          <div className="mb-4 text-center text-[14.5px] text-muted-fg">
            <EditableText contentId="intake.crisis.ongoingSupportPrompt" label="Ongoing-support prompt" value={content.ongoingSupportPrompt} as="span" />
          </div>
        )}

        <h2 className="mb-1.5 text-center text-[22px]">
          {PATHWAY_HEADING[pathKey] ?? PATHWAY_HEADING.general}
        </h2>
        <p className="mb-6 text-center text-[14.5px] text-muted-fg" aria-live="polite">
          {therapists.length} professional{therapists.length === 1 ? "" : "s"} available.
        </p>

        {therapists.length > 0 ? (
          <TherapistsDirectory therapists={therapists} content={THERAPISTS_DIRECTORY_CONTENT_FALLBACK} pathKey={pathKey} />
        ) : (
          // Phase 152 — every eligible pathway starts with whichever
          // therapists an admin has explicitly assigned (see
          // support_pathways/TherapistEditForm's new "Intake pathways"
          // checkboxes) — "general" was backfilled for every active
          // therapist, but "crisis"/"veteran"/"helpers" start empty until an
          // admin opts specific professionals in. This is the honest,
          // no-results state for that case, not an error.
          <div className="rounded-[var(--radius)] border border-border bg-card p-7 text-center text-muted-fg">
            <p className="mb-1.5 font-semibold text-foreground">No therapists were found for this pathway.</p>
            <p className="mb-5 text-[13.5px]">
              We don&apos;t have a verified professional assigned to this pathway yet — please check back soon, browse
              every professional, or reach out and we&apos;ll help you directly.
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              <Link
                href="/"
                className="rounded-full border border-border bg-card px-5 py-2.5 text-[13.5px] font-semibold text-primary transition-colors hover:border-primary-600 hover:bg-accent-soft"
              >
                Change filters
              </Link>
              <Link
                href="/therapists"
                className="rounded-full border border-border bg-card px-5 py-2.5 text-[13.5px] font-semibold text-primary transition-colors hover:border-primary-600 hover:bg-accent-soft"
              >
                View all professionals
              </Link>
              <Link
                href="/contact"
                className="rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-primary-600"
              >
                Contact GESA support
              </Link>
            </div>
          </div>
        )}
      </div>
      </section>
    </>
  );

  return isEditorPreview ? <EditorPreviewBridge>{page}</EditorPreviewBridge> : page;
}
