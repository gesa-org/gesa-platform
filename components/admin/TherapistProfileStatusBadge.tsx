import type { TherapistProfileStatus } from "@/lib/database.types";

// Phase 186 — shared between TherapistsTable.tsx (the list) and
// TherapistEditForm.tsx (the detail page) so the five profile_status values
// always read the same way everywhere they're shown. Deliberately distinct
// palette from VolunteerApplicationStatusControl's application-status
// badges — the two are shown side by side once a profile has a linked
// application, and must never look like the same kind of status.
const STATUS_STYLES: Record<TherapistProfileStatus, string> = {
  draft: "bg-secondary text-muted-fg",
  pending_publication: "bg-clay-soft text-clay",
  active: "bg-accent-soft text-primary",
  inactive: "bg-secondary text-muted-fg",
  archived: "bg-destructive/10 text-destructive",
};

const STATUS_LABELS: Record<TherapistProfileStatus, string> = {
  draft: "Draft",
  pending_publication: "Pending publication",
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
};

export default function TherapistProfileStatusBadge({ status }: { status: TherapistProfileStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export { STATUS_LABELS as THERAPIST_PROFILE_STATUS_LABELS };
