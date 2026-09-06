"use client";

import FlatFieldsEditor from "@/components/admin/content/FlatFieldsEditor";
import type { HeaderContent } from "@/lib/content";

export default function HeaderEditor({ initial }: { initial: HeaderContent }) {
  return (
    <FlatFieldsEditor<HeaderContent>
      contentKey="site_header"
      initial={initial}
      note={
        'This controls the sticky header shown on every page. Nav link destinations stay fixed — only the visible labels and the Donate button are editable. "Find Support" links to /find-your-therapist, which now shows the former About page content — there is no separate "About Us" nav item anymore (Phase 145).'
      }
      groups={[
        {
          heading: "Navigation labels",
          fields: [
            { key: "homeLabel", label: "Home" },
            { key: "aboutLabel", label: "Find Support" },
            { key: "therapistsLabel", label: "Our Therapists" },
            { key: "supportGroupsLabel", label: "Support Groups" },
          ],
        },
        {
          heading: "Donate button",
          fields: [
            { key: "donateLabel", label: "Label" },
            { key: "donateHref", label: "Link" },
          ],
        },
      ]}
    />
  );
}
