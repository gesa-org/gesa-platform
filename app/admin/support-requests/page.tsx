import { getAllSupportRequests } from "@/lib/queries";
import SupportRequestsTable from "@/components/admin/SupportRequestsTable";

export const dynamic = "force-dynamic";

// Phase 142 — the unified CRM view for the "Find Support" flow, over the
// new support_requests table (both AI Support and Manual Support rows —
// see /api/support-pathway). Replaces app/admin/match-requests/page.tsx as
// the primary view for new requests going forward; that page is now
// unlinked from the sidebar (Phase 150) and kept only for historical
// match_requests rows from before this phase.
//
// Phase 150 — table markup moved into SupportRequestsTable.tsx (a Client
// Component) so the new Delete action can manage local list state.
export default async function AdminSupportRequestsPage() {
  const requests = await getAllSupportRequests();
  return <SupportRequestsTable initialRequests={requests} />;
}
