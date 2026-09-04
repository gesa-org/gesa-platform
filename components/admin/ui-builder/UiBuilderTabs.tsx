"use client";

import { useState } from "react";
import UIBuilderShell from "@/components/admin/ui-builder/UIBuilderShell";
import PageEditorShell from "@/components/admin/ui-builder/PageEditorShell";

// Phase 133 — the only change to the existing Phase 132 global builder is
// this wrapper: UIBuilderShell itself is untouched, still fully functional,
// just now one of two tabs instead of the page's only content. Mounting
// both shells (rather than conditionally rendering) would mean two iframes
// loading the site at once; only rendering the active tab's shell avoids
// that and matches "no duplicated ... rendering" for the preview canvas.
type Tab = "theme" | "page";

export default function UiBuilderTabs() {
  const [tab, setTab] = useState<Tab>("theme");

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-full bg-secondary/50 p-1 w-fit">
        <TabButton active={tab === "theme"} onClick={() => setTab("theme")}>
          Global Theme
        </TabButton>
        <TabButton active={tab === "page"} onClick={() => setTab("page")}>
          Page Content
        </TabButton>
      </div>
      {tab === "theme" ? <UIBuilderShell /> : <PageEditorShell />}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
        active ? "bg-white text-primary shadow-sm" : "text-muted-fg hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
