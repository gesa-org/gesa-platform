"use client";

import FlatFieldsEditor from "@/components/admin/content/FlatFieldsEditor";
import type { VolunteerApplicationModalContent } from "@/lib/content";

export default function VolunteerApplicationModalEditor({ initial }: { initial: VolunteerApplicationModalContent }) {
  return (
    <FlatFieldsEditor<VolunteerApplicationModalContent>
      contentKey="component_volunteer_modal"
      initial={initial}
      note="The 'Become a volunteer therapist' application modal opens from the Volunteer button in the Footer, About page, Our Therapists sidebar, and Donate band. Keep {name} and {email} in the thank-you fields — they're replaced with the applicant's own name/email."
      groups={[
        {
          heading: "Form",
          fields: [
            { key: "heading", label: "Heading" },
            { key: "intro", label: "Intro text", multiline: true },
            { key: "submitLabel", label: "Submit button label" },
            { key: "submittingLabel", label: "Submit button label (while submitting)" },
          ],
        },
        {
          heading: "Thank-you state",
          fields: [
            { key: "thankYouHeading", label: "Heading (use {name})" },
            { key: "thankYouBody", label: "Body (use {email})", multiline: true },
          ],
        },
      ]}
    />
  );
}
