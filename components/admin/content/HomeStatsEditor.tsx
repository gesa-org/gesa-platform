"use client";

import FlatFieldsEditor from "@/components/admin/content/FlatFieldsEditor";
import type { HomeStatsContent } from "@/lib/content";

export default function HomeStatsEditor({ initial }: { initial: HomeStatsContent }) {
  return (
    <FlatFieldsEditor<HomeStatsContent>
      contentKey="component_home_stats"
      initial={initial}
      note="The heading, subtitle, and four icon badges below the Home page's hero band. Icons are fixed (shield, globe, dollar sign, people) — only the text is editable here."
      fields={[
        { key: "heading", label: "Heading (above the badges)" },
        { key: "subtitle", label: "Subtitle (above the badges)", multiline: true },
        { key: "badge1Label", label: "Badge 1 label (shield icon)" },
        { key: "badge2Label", label: "Badge 2 label (globe icon)" },
        { key: "badge3Label", label: "Badge 3 label (dollar sign icon)" },
        { key: "badge4Label", label: "Badge 4 label (people icon)" },
      ]}
    />
  );
}
