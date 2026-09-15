// DEPRECATED — Phase 207.
//
// This component implemented Phase 206's admin-only eye-icon badge +
// popover on therapist cards. Phase 207 replaced that with a public,
// always-visible view counter directly in components/TherapistCard.tsx
// (next to the country line), which conflicts with also showing this
// admin-only badge (two eye icons on one card). Nothing imports this file
// anymore as of Phase 207.
//
// The sandboxed shell was unavailable this session, so this file could not
// be deleted outright — it's been emptied to a no-op stub instead. Safe to
// delete this file from the repo (`components/admin/therapists/TherapistViewBadge.tsx`)
// next time you're doing file cleanup; nothing references it.
export {};
