// Phase 201 — split out of lib/media.ts deliberately. That file imports
// lib/supabase/server.ts and lib/supabase/admin.ts (the service-role
// client, which reads SUPABASE_SERVICE_ROLE_KEY) — safe for Server
// Components and API routes, but components/admin/content/MediaLibrary.tsx
// is a "use client" component that also needs these labels. Importing
// lib/media.ts from a Client Component would pull the service-role client
// into the browser bundle, which Next.js may or may not catch at build time
// depending on tree-shaking — not a risk worth taking. This file has zero
// server-only imports, so it's safe from either side.

// Human-readable label for a (pageKey, sectionKey) pair, shown in the Media
// Library's usage list and its "assign to section" dropdown. A plain lookup
// table rather than a database column — these labels are an admin-UI
// concern, not data, so adding a new assignable slot is a one-line change
// here plus wherever the slot is actually read (see lib/media.ts's
// getMediaAssetForSlot/getMediaAssetsForPage).
export const MEDIA_SLOT_LABELS: Record<string, string> = {
  "page_donate:whySupport.photo1": "Donate > Why your support matters > Photo 1 (Therapy)",
  "page_donate:whySupport.photo2": "Donate > Why your support matters > Photo 2 (Education)",
  "page_donate:whySupport.photo3": "Donate > Why your support matters > Photo 3 (Wellbeing)",
};

export function mediaSlotLabel(pageKey: string, sectionKey: string): string {
  return MEDIA_SLOT_LABELS[`${pageKey}:${sectionKey}`] ?? `${pageKey} > ${sectionKey}`;
}
