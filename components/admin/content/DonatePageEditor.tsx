"use client";

import FlatFieldsEditor from "@/components/admin/content/FlatFieldsEditor";
import type { DonatePageContent } from "@/lib/content";

// Phase 98 — flat-fields CMS editor for the new /donate page, same generic
// pattern as HomeEditor.tsx. amount1/2/3 are stored as numbers in the type
// but edited as plain text inputs here (FlatFieldsEditor's fields are all
// text/multiline) — DonateForm.tsx does `Number(...)` on read where it
// matters, so a saved value like "25" still behaves correctly.
export default function DonatePageEditor({ initial }: { initial: DonatePageContent }) {
  return (
    <FlatFieldsEditor<DonatePageContent>
      contentKey="page_donate"
      initial={initial}
      groups={[
        {
          heading: "Hero",
          fields: [
            { key: "eyebrow", label: "Eyebrow label" },
            { key: "title", label: "Hero title", multiline: true },
            { key: "subtitle", label: "Subtitle", multiline: true },
            { key: "boldLine", label: "Bold line under the subtitle" },
            { key: "heroCtaLabel", label: "Hero CTA label (scrolls down to the giving box)" },
          ],
        },
        {
          heading: "Giving box",
          fields: [
            { key: "givingHeading", label: "Giving box heading" },
            { key: "onceLabel", label: "\"Give once\" toggle label" },
            { key: "monthlyLabel", label: "\"Give monthly\" toggle label" },
            { key: "amount1", label: "Preset amount 1 (€, numbers only)" },
            { key: "amount2", label: "Preset amount 2 (€, numbers only)" },
            { key: "amount3", label: "Preset amount 3 (€, numbers only)" },
            { key: "customLabel", label: "Custom amount button label" },
            { key: "giftNote", label: "Note under the amount tiles" },
            { key: "giftCtaLabel", label: "Gift submit button label" },
          ],
        },
        {
          heading: "Impact row",
          fields: [
            { key: "impactHeading", label: "Section heading" },
            { key: "impact1Title", label: "Card 1 — title" },
            { key: "impact1Description", label: "Card 1 — description", multiline: true },
            { key: "impact2Title", label: "Card 2 — title" },
            { key: "impact2Description", label: "Card 2 — description", multiline: true },
            { key: "impact3Title", label: "Card 3 — title" },
            { key: "impact3Description", label: "Card 3 — description", multiline: true },
          ],
        },
        {
          // Phase 224 — relabeled from "Movement band" to "Final CTA" and
          // the CTA link's help text updated: this band was repurposed
          // from a volunteer-recruitment ask (opening the volunteer
          // application modal) to a donation ask that scrolls back up to
          // the giving box, per Roy's required narrative flow. Field keys
          // (movementHeading/movementSubtitle/movementCtaLabel/
          // movementCtaHref) are unchanged — only these display labels.
          // Phase 233 — this button now always opens the same donation
          // modal every other donation CTA on this page uses (see
          // DonatePage.tsx's own Phase 233 comment on this section — a
          // stale published `movementCtaHref` value was silently sending
          // real visitors to the Contact page instead of the donation
          // flow). The link field itself is left in place, unused, per the
          // site's standing "don't delete a field a section stopped
          // reading" precedent — help text updated so it doesn't read as
          // still controlling where this button goes.
          heading: "Final CTA",
          fields: [
            { key: "movementHeading", label: "Heading" },
            { key: "movementSubtitle", label: "Subtitle", multiline: true },
            { key: "movementCtaLabel", label: "Button label" },
            {
              key: "movementCtaHref",
              label: "Button link (currently unused)",
              help: "This button always opens the donation form modal now, regardless of this value — kept in case a future redesign needs a plain link here again.",
            },
          ],
        },
        {
          heading: "Trust badges",
          fields: [
            { key: "trustBadge1Label", label: "Badge 1" },
            { key: "trustBadge2Label", label: "Badge 2" },
            { key: "trustBadge3Label", label: "Badge 3" },
            { key: "trustBadge4Label", label: "Badge 4" },
          ],
        },
        {
          heading: "Closing crisis line",
          fields: [
            { key: "crisisText", label: "Text" },
            { key: "crisisLinkLabel", label: "Link label" },
            { key: "crisisLinkHref", label: "Link URL" },
          ],
        },
      ]}
    />
  );
}
