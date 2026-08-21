"use client";

import FlatFieldsEditor from "@/components/admin/content/FlatFieldsEditor";
import type { HomeContent } from "@/lib/content";

// Home's hero/landing content is a flat shape (no arrays), so this is a
// thin config wrapper around the generic FlatFieldsEditor rather than a
// bespoke form. The three path cards' visible on-photo text can't change
// here without new artwork — flagged inline in the "Path cards" group's
// note so it isn't a silent trap for whoever edits this.
export default function HomeEditor({ initial }: { initial: HomeContent }) {
  return (
    <FlatFieldsEditor<HomeContent>
      contentKey="page_home"
      initial={initial}
      groups={[
        {
          heading: "Hero",
          fields: [
            { key: "eyebrow", label: "Eyebrow label" },
            { key: "title", label: "Hero title" },
            {
              key: "highlight",
              label: "Highlighted title text",
              help: "Must exactly match a substring of the title above to be highlighted. Leave blank for no highlight.",
            },
            { key: "subtitle", label: "Subtitle", multiline: true },
          ],
        },
        {
          heading: "Trust badges",
          fields: [
            { key: "badge1Label", label: "Badge 1" },
            { key: "badge2Label", label: "Badge 2" },
            { key: "badge3Label", label: "Badge 3" },
          ],
        },
        {
          heading: "Path cards",
          fields: [
            {
              key: "card1Title",
              label: "Card 1 — title (crisis)",
              help: "Note: the visible headline/description on the homepage card is baked into its photo and won't change here — this field and the description below only affect screen-reader text. The CTA link is the one field that changes what visitors actually experience.",
            },
            { key: "card1Description", label: "Card 1 — description", multiline: true },
            { key: "card1CtaLabel", label: "Card 1 — CTA label (screen-reader only)" },
            { key: "card1CtaLink", label: "Card 1 — CTA link (this one is real — where the card navigates to)" },
            { key: "card2Title", label: "Card 2 — title (veterans)" },
            { key: "card2Description", label: "Card 2 — description", multiline: true },
            { key: "card2CtaLabel", label: "Card 2 — CTA label (screen-reader only)" },
            { key: "card2CtaLink", label: "Card 2 — CTA link (this one is real)" },
            { key: "card3Title", label: "Card 3 — title (general support)" },
            { key: "card3Description", label: "Card 3 — description", multiline: true },
            { key: "card3CtaLabel", label: "Card 3 — CTA label (screen-reader only)" },
            { key: "card3CtaLink", label: "Card 3 — CTA link (this one is real)" },
          ],
        },
        {
          heading: "Closing note",
          fields: [{ key: "footerNote", label: "Note under the path cards" }],
        },
      ]}
    />
  );
}
