"use client";

import FlatFieldsEditor from "@/components/admin/content/FlatFieldsEditor";
import type { CrisisButtonContent } from "@/lib/content";

export default function CrisisButtonEditor({ initial }: { initial: CrisisButtonContent }) {
  return (
    <FlatFieldsEditor<CrisisButtonContent>
      contentKey="component_crisis_button"
      initial={initial}
      note="The fixed 'In crisis? Get help' button appears on every page of the site. Phase 169 — the four hardcoded resource cards that used to live here (Resource 1-4) were replaced by a country selector that shows verified, country-specific emergency/crisis numbers instead of always showing US-only resources to every visitor worldwide. Those resource fields still exist on this content row for backward compatibility but are no longer rendered — to add, update, or verify a country's crisis numbers now, edit lib/crisisResources.ts (see MAINTAINING_CRISIS_RESOURCES.md at the repo root), not this form."
      groups={[
        {
          heading: "Button & modal",
          fields: [
            { key: "triggerLabel", label: "Button label" },
            { key: "modalHeading", label: "Modal heading" },
            { key: "modalSubtitle", label: "Modal subtitle", multiline: true },
          ],
        },
        {
          heading: "Disclaimer",
          fields: [{ key: "disclaimer", label: "Disclaimer text (shown below the resource list)", multiline: true }],
        },
      ]}
    />
  );
}
