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
        { key: "ctaLabel", label: "Button label" },
        { key: "ctaHref", label: "Button link" },
      ]}
    />
  );
}
