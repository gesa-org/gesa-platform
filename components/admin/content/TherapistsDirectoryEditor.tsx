"use client";

import FlatFieldsEditor from "@/components/admin/content/FlatFieldsEditor";
import type { TherapistsDirectoryContent } from "@/lib/content";

export default function TherapistsDirectoryEditor({ initial }: { initial: TherapistsDirectoryContent }) {
  return (
    <FlatFieldsEditor<TherapistsDirectoryContent>
      contentKey="component_therapists_directory"
      initial={initial}
      note="The filter sidebar's option lists (specialties, languages, session lengths) come from real therapist records and aren't editable text — only the fixed labels around them are, below."
      groups={[
        {
          heading: "Search & filter labels",
          fields: [
            { key: "searchLabel", label: "Search field label" },
            { key: "searchPlaceholder", label: "Search field placeholder" },
            { key: "definitionLabel", label: "Specialty filter label" },
            { key: "anyOptionLabel", label: "\"Any\" option label" },
            { key: "languageLabel", label: "Language filter label" },
            { key: "anyLanguageLabel", label: "\"Any language\" option label" },
            { key: "durationLabel", label: "Duration filter label" },
            { key: "genderLabel", label: "Gender filter label" },
            { key: "maleLabel", label: "Male option label" },
            { key: "femaleLabel", label: "Female option label" },
            { key: "nonbinaryLabel", label: "Non-binary option label" },
            { key: "noPreferenceLabel", label: "No preference option label" },
          ],
        },
        {
          heading: "Buttons & messages",
          fields: [
            { key: "joinAsTherapistLabel", label: "\"Join us as a therapist\" button" },
            { key: "applyFiltersLabel", label: "Mobile \"Apply filters\" button" },
            { key: "noResultsMessage", label: "No results message", multiline: true },
          ],
        },
      ]}
    />
  );
}
