"use client";

import FlatFieldsEditor from "@/components/admin/content/FlatFieldsEditor";
import type { DonateThankYouContent } from "@/lib/content";

export default function DonateThankYouEditor({ initial }: { initial: DonateThankYouContent }) {
  return (
    <FlatFieldsEditor<DonateThankYouContent>
      contentKey="page_donate_thank_you"
      initial={initial}
      note="Mollie redirects a donor here right after checkout, before the webhook may have confirmed the payment — so all three states below can appear, not just 'Paid'."
      groups={[
        { heading: "Paid", fields: [{ key: "paidHeading", label: "Heading" }, { key: "paidBody", label: "Body", multiline: true }] },
        {
          heading: "Failed / canceled / expired",
          fields: [{ key: "failedHeading", label: "Heading" }, { key: "failedBody", label: "Body", multiline: true }],
        },
        {
          heading: "Still processing",
          fields: [{ key: "pendingHeading", label: "Heading" }, { key: "pendingBody", label: "Body", multiline: true }],
        },
        { heading: "Link", fields: [{ key: "backLinkLabel", label: "Back link label" }] },
      ]}
    />
  );
}
