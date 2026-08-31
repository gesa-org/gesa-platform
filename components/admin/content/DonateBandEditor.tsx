"use client";

import FlatFieldsEditor from "@/components/admin/content/FlatFieldsEditor";
import type { DonateBandContent } from "@/lib/content";

export default function DonateBandEditor({ initial }: { initial: DonateBandContent }) {
  return (
    <FlatFieldsEditor<DonateBandContent>
      contentKey="component_donate_band"
      initial={initial}
      note="This band appears identically on Home, About, Our Therapists, and Support Groups — one save here updates all four pages at once."
      fields={[
        { key: "headline", label: "Headline" },
        { key: "subtitle", label: "Subtitle", multiline: true },
        { key: "cta1Label", label: "First button label" },
        { key: "cta1Href", label: "First button link" },
        { key: "cta2Label", label: "Second button label" },
        { key: "cta2Href", label: "Second button link" },
        { key: "crisisText", label: "Crisis line text" },
        { key: "crisisLinkLabel", label: "Crisis line link label" },
        { key: "crisisLinkHref", label: "Crisis line link" },
      ]}
    />
  );
}
