"use client";

import FlatFieldsEditor from "@/components/admin/content/FlatFieldsEditor";
import type { HomeStatsContent } from "@/lib/content";

export default function HomeStatsEditor({ initial }: { initial: HomeStatsContent }) {
  return (
    <FlatFieldsEditor<HomeStatsContent>
      contentKey="component_home_stats"
      initial={initial}
      note="The four numbers below the Home page's hero band. Numeric values (like the free-session count) animate by counting up on scroll — non-numeric values (like 'Global') just display as-is."
      groups={[
        { heading: "Stat 1", fields: [{ key: "stat1Value", label: "Value" }, { key: "stat1Label", label: "Label" }] },
        { heading: "Stat 2", fields: [{ key: "stat2Value", label: "Value" }, { key: "stat2Label", label: "Label" }] },
        { heading: "Stat 3", fields: [{ key: "stat3Value", label: "Value" }, { key: "stat3Label", label: "Label" }] },
        { heading: "Stat 4", fields: [{ key: "stat4Value", label: "Value" }, { key: "stat4Label", label: "Label" }] },
      ]}
    />
  );
}
