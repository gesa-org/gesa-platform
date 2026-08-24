"use client";

import FlatFieldsEditor from "@/components/admin/content/FlatFieldsEditor";
import type { FooterContent } from "@/lib/content";

export default function FooterEditor({ initial }: { initial: FooterContent }) {
  return (
    <FlatFieldsEditor<FooterContent>
      contentKey="page_footer"
      initial={initial}
      note="Link destinations for the four main columns (About, Our Therapists, legal pages, etc.) stay fixed — only their visible label text is editable. The social links, trusted partners, and non-profit status line below (Phase 57) have no fixed destination/wording of their own, so both label and URL/text are editable there."
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
          heading: "Connect with Us (social links)",
          fields: [
            { key: "connectWithUsLabel", label: "Row label" },
            {
              key: "socialLinkedinHref",
              label: "LinkedIn URL",
              help: "Defaults to # — replace with your real profile URL when you have one.",
            },
            { key: "socialTwitterHref", label: "Twitter / X URL", help: "Defaults to #." },
            { key: "socialInstagramHref", label: "Instagram URL", help: "Defaults to #." },
            { key: "socialFacebookHref", label: "Facebook URL", help: "Defaults to #." },
          ],
        },
        {
          heading: "Our Trusted Partners",
          fields: [
            { key: "trustedPartnersHeading", label: "Row heading" },
            { key: "partner1Label", label: "Partner / accreditation 1" },
            { key: "partner2Label", label: "Partner / accreditation 2" },
            { key: "partner3Label", label: "Partner / accreditation 3" },
          ],
        },
        {
          heading: "Bottom bar",
          fields: [
            {
              key: "copyrightLine",
              label: "Copyright line",
              help: "Use {year} anywhere you want the current year inserted automatically.",
            },
            {
              key: "nonprofitStatusLine",
              label: "Non-profit status line",
              help: "Roy owns the exact legal wording here — this codebase doesn't verify or assert it.",
            },
            { key: "madeWithLine", label: "Second line" },
          ],
        },
      ]}
    />
  );
}
