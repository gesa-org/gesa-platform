"use client";

import FlatFieldsEditor from "@/components/admin/content/FlatFieldsEditor";
import type { FooterContent } from "@/lib/content";

export default function FooterEditor({ initial }: { initial: FooterContent }) {
  return (
    <FlatFieldsEditor<FooterContent>
      contentKey="page_footer"
      initial={initial}
      note="Link destinations (About, Our Therapists, legal pages, etc.) stay fixed — only the visible label text below is editable, so the site's navigation structure can't be broken from here."
      groups={[
        {
          heading: "Tagline",
          fields: [{ key: "tagline", label: "Tagline under the GESA wordmark", multiline: true }],
        },
        {
          heading: "Explore column",
          fields: [
            { key: "exploreHeading", label: "Column heading" },
            { key: "exploreAboutLabel", label: "About link label" },
            { key: "exploreTherapistsLabel", label: "Our Therapists link label" },
            { key: "exploreSupportGroupsLabel", label: "Support Groups link label" },
            { key: "exploreBlogLabel", label: "Blog label" },
            { key: "exploreBlogBadge", label: "Blog badge text", help: "Shown next to the disabled Blog label, e.g. \"Soon\"." },
            { key: "exploreFaqLabel", label: "FAQ link label" },
            { key: "exploreContactLabel", label: "Contact link label" },
          ],
        },
        {
          heading: "Support column",
          fields: [
            { key: "supportHeading", label: "Column heading" },
            { key: "supportFindTherapistLabel", label: "Find a Therapist link label" },
            { key: "supportJoinGroupLabel", label: "Join a Group link label" },
            { key: "supportDonateLabel", label: "Donate link label" },
            { key: "supportVolunteerLabel", label: "Volunteer link label" },
            { key: "supportEmergencyLabel", label: "Emergency Contact link label" },
          ],
        },
        {
          heading: "Legal column",
          fields: [{ key: "legalHeading", label: "Column heading" }],
        },
        {
          heading: "Bottom bar",
          fields: [
            {
              key: "copyrightLine",
              label: "Copyright line",
              help: "Use {year} anywhere you want the current year inserted automatically.",
            },
            { key: "madeWithLine", label: "Second line" },
          ],
        },
      ]}
    />
  );
}
