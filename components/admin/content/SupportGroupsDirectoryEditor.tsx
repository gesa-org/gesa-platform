"use client";

import FlatFieldsEditor from "@/components/admin/content/FlatFieldsEditor";
import type { SupportGroupsDirectoryContent } from "@/lib/content";

export default function SupportGroupsDirectoryEditor({ initial }: { initial: SupportGroupsDirectoryContent }) {
  return (
    <FlatFieldsEditor<SupportGroupsDirectoryContent>
      contentKey="component_support_groups_directory"
      initial={initial}
      note="The group list itself (titles, schedules, facilitators) comes from the Support Groups table, not here — this covers the registration flow's fixed labels."
      fields={[
        { key: "noGroupsMessage", label: "No groups open message", multiline: true },
        { key: "registerButtonLabel", label: "\"Register\" button" },
        { key: "confirmButtonLabel", label: "\"Confirm registration\" button" },
        { key: "successHeading", label: "Success heading after registering" },
      ]}
    />
  );
}
