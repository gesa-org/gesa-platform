"use client";

import FlatFieldsEditor from "@/components/admin/content/FlatFieldsEditor";
import type { FooterContent } from "@/lib/content";

export default function FooterEditor({ initial }: { initial: FooterContent }) {
  return (
    <FlatFieldsEditor<FooterContent>
      contentKey="page_footer"
      initial={initial}
      note="Link destinations for the first four columns (About, Our Therapists, legal pages, etc.) stay fixed — only their visible label text is editable, so the site's core navigation can't be broken from here. The Connect column, social links, and Join Our Global Network button below are new (Phase 56) and have no fixed 'correct' destination yet, so both their label and destination/URL are editable."
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
          heading: "Connect column (new)",
          fields: [
            { key: "connectHeading", label: "Column heading" },
            { key: "connectNewsletterLabel", label: "Newsletter Signup — label" },
            {
              key: "connectNewsletterHref",
              label: "Newsletter Signup — destination",
              help: "There's no real newsletter-signup mechanism yet, so this defaults to the Contact form. Point it somewhere real once one exists.",
            },
            { key: "connectPressLabel", label: "Press Inquiries — label" },
            { key: "connectPressHref", label: "Press Inquiries — destination" },
            { key: "connectPartnershipsLabel", label: "Partnerships — label" },
            { key: "connectPartnershipsHref", label: "Partnerships — destination" },
            {
              key: "connectBlogLabel",
              label: "Blog — label",
              help: "Shown disabled with a \"Soon\" badge, same as the Explore column's Blog link, since the blog has no posts yet.",
            },
          ],
        },
        {
          heading: "Social links (new)",
          fields: [
            {
              key: "socialFollowLabel",
              label: "\"Follow our journey\" text",
              help: "Only shown if at least one social URL below is filled in.",
            },
            {
              key: "socialLinkedinHref",
              label: "LinkedIn URL",
              help: "Leave blank to hide this icon entirely — an unfilled-in link never shows as a dead link on the live site.",
            },
            { key: "socialTwitterHref", label: "Twitter / X URL", help: "Leave blank to hide this icon." },
            { key: "socialFacebookHref", label: "Facebook URL", help: "Leave blank to hide this icon." },
          ],
        },
        {
          heading: "Accreditations & Partners (new)",
          fields: [
            { key: "accreditationsHeading", label: "Row heading" },
            { key: "accreditation1Label", label: "Accreditation / partner 1" },
            { key: "accreditation2Label", label: "Accreditation / partner 2" },
            { key: "accreditation3Label", label: "Accreditation / partner 3" },
          ],
        },
        {
          heading: "Join Our Global Network CTA (new)",
          fields: [
            { key: "joinNetworkLabel", label: "Button label" },
            { key: "joinNetworkHref", label: "Button destination" },
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
