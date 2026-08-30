"use client";

import FlatFieldsEditor from "@/components/admin/content/FlatFieldsEditor";
import type { CrisisButtonContent } from "@/lib/content";

export default function CrisisButtonEditor({ initial }: { initial: CrisisButtonContent }) {
  return (
    <FlatFieldsEditor<CrisisButtonContent>
      contentKey="component_crisis_button"
      initial={initial}
      note="The fixed 'In crisis? Get help' button and its resource list appear on every page of the site. Resource links are real phone numbers/URLs — keep them working when editing."
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
          heading: "Resource 1",
          fields: [
            { key: "resource1Title", label: "Title" },
            { key: "resource1Description", label: "Description" },
            { key: "resource1Href", label: "Link (tel:, sms:, or https://)" },
          ],
        },
        {
          heading: "Resource 2",
          fields: [
            { key: "resource2Title", label: "Title" },
            { key: "resource2Description", label: "Description" },
            { key: "resource2Href", label: "Link (tel:, sms:, or https://)" },
          ],
        },
        {
          heading: "Resource 3",
          fields: [
            { key: "resource3Title", label: "Title" },
            { key: "resource3Description", label: "Description" },
            { key: "resource3Href", label: "Link (tel:, sms:, or https://)" },
          ],
        },
        {
          heading: "Resource 4",
          fields: [
            { key: "resource4Title", label: "Title" },
            { key: "resource4Description", label: "Description" },
            { key: "resource4Href", label: "Link (tel:, sms:, or https://)" },
          ],
        },
        { heading: "Disclaimer", fields: [{ key: "disclaimer", label: "Disclaimer text", multiline: true }] },
      ]}
    />
  );
}
