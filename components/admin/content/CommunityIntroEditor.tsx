"use client";

import FlatFieldsEditor from "@/components/admin/content/FlatFieldsEditor";
import type { CommunityIntroContent } from "@/lib/content";

export default function CommunityIntroEditor({ initial }: { initial: CommunityIntroContent }) {
  return (
    <FlatFieldsEditor<CommunityIntroContent>
      contentKey="component_community_intro"
      initial={initial}
      note="These sit between the banner above and the real group listing/registration flow below. #pathways and #support-groups-list are anchors on this same page — leave them as-is unless you're deliberately repointing a link elsewhere."
      groups={[
        {
          heading: "Hero buttons",
          fields: [
            { key: "heroPrimaryLabel", label: "Primary button label" },
            { key: "heroPrimaryHref", label: "Primary button link" },
            { key: "heroSecondaryLabel", label: "Secondary button label" },
            {
              key: "heroSecondaryHref",
              label: "Secondary button link",
              help: "Leave as /contact?subject=Volunteer to open the volunteer application form automatically.",
            },
          ],
        },
        {
          heading: "Tagline links (below the buttons)",
          fields: [
            { key: "tagline1Label", label: "Link 1 label" },
            { key: "tagline1Href", label: "Link 1 destination" },
            { key: "tagline2Label", label: "Link 2 label" },
            { key: "tagline2Href", label: "Link 2 destination" },
            { key: "tagline3Label", label: "Link 3 label" },
            { key: "tagline3Href", label: "Link 3 destination" },
          ],
        },
        {
          heading: "Why GESA exists",
          fields: [
            { key: "missionHeading", label: "Heading" },
            { key: "missionBody", label: "Body", multiline: true },
          ],
        },
        {
          heading: "Pathway card 1",
          fields: [
            { key: "card1Eyebrow", label: "Eyebrow" },
            { key: "card1Title", label: "Title" },
            { key: "card1Body", label: "Body", multiline: true },
            { key: "card1CtaLabel", label: "Button label" },
            { key: "card1CtaHref", label: "Button link" },
          ],
        },
        {
          heading: "Pathway card 2",
          fields: [
            { key: "card2Eyebrow", label: "Eyebrow" },
            { key: "card2Title", label: "Title" },
            { key: "card2Body", label: "Body", multiline: true },
            { key: "card2CtaLabel", label: "Button label" },
            { key: "card2CtaHref", label: "Button link" },
          ],
        },
        {
          heading: "Pathway card 3",
          fields: [
            { key: "card3Eyebrow", label: "Eyebrow" },
            { key: "card3Title", label: "Title" },
            { key: "card3Body", label: "Body", multiline: true },
            { key: "card3CtaLabel", label: "Button label" },
            { key: "card3CtaHref", label: "Button link" },
          ],
        },
        {
          heading: "Closing band",
          fields: [
            { key: "closingHeading", label: "Heading" },
            { key: "closingSubtitle", label: "Subtitle" },
          ],
        },
      ]}
    />
  );
}
