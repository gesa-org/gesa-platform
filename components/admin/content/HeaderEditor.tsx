"use client";

import FlatFieldsEditor from "@/components/admin/content/FlatFieldsEditor";
import type { HeaderContent } from "@/lib/content";

export default function HeaderEditor({ initial }: { initial: HeaderContent }) {
  return (
    <FlatFieldsEditor<HeaderContent>
      contentKey="site_header"
      initial={initial}
      note={
        'This controls the sticky header shown on every page. Nav link destinations stay fixed — only the visible labels and the Donate button are editable. "Find Support" links to the Find Your Therapist page (the AI/Manual Support entry point); "About Us" links to the About page.'
      }
      groups={[
        {
          heading: "Navigation labels",
          fields: [
            { key: "homeLabel", label: "Home" },
            { key: "aboutLabel", label: "Find Support" },
            { key: "aboutPageLabel", label: "About Us" },
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
