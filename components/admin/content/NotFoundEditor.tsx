"use client";

import FlatFieldsEditor from "@/components/admin/content/FlatFieldsEditor";
import type { NotFoundPageContent } from "@/lib/content";

// Phase 204 — app/not-found.tsx. The "back home" link's destination is
// fixed to "/" in that file; only its label is editable here, same
// "label editable, destination fixed" shape as DonateThankYouEditor's own
// backLinkLabel field.
export default function NotFoundEditor({ initial }: { initial: NotFoundPageContent }) {
  return (
    <FlatFieldsEditor<NotFoundPageContent>
      contentKey="page_not_found"
      initial={initial}
      note="Shown whenever a visitor hits a page that doesn't exist (a mistyped URL, a stale bookmark, a dead link)."
      fields={[
        { key: "eyebrow", label: "Eyebrow" },
        { key: "heading", label: "Heading" },
        { key: "body", label: "Body", multiline: true },
        { key: "ctaLabel", label: '"Back home" button label' },
      ]}
    />
  );
}
