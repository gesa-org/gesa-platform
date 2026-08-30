"use client";

import FlatFieldsEditor from "@/components/admin/content/FlatFieldsEditor";
import type { IntakeFlowContent } from "@/lib/content";

export default function IntakeFlowEditor({ initial }: { initial: IntakeFlowContent }) {
  return (
    <FlatFieldsEditor<IntakeFlowContent>
      contentKey="component_intake_flow"
      initial={initial}
      note="Covers the fast 'Reach out now' intake path (Home's four path cards land here) — the per-path labels, hero titles, and the crisis path's safety copy. The booking modal's own step-by-step copy is not yet covered here (see CONTENT_GUIDE.md)."
      groups={[
        {
          heading: "Path labels",
          fields: [
            { key: "pathCrisisLabel", label: "Crisis" },
            { key: "pathVeteranLabel", label: "Veterans, reservists & families" },
            { key: "pathGeneralLabel", label: "Seeking support" },
            { key: "pathHelpersLabel", label: "Helping the helpers" },
          ],
        },
        {
          heading: "Hero titles",
          fields: [
            { key: "crisisHeroTitle", label: "Crisis path" },
            { key: "defaultHeroTitle", label: "All other paths" },
          ],
        },
        {
          heading: "Crisis path copy",
          fields: [
            { key: "crisisDisclaimer", label: "Safety disclaimer", multiline: true },
            { key: "moreHelplinesText", label: "\"More helplines at\" link text" },
            { key: "ongoingSupportPrompt", label: "Ongoing-support prompt" },
          ],
        },
        {
          heading: "Match list",
          fields: [{ key: "matchListIntro", label: "Intro line above matched therapists", multiline: true }],
        },
      ]}
    />
  );
}
