import { getAllMatchRequests, getAllSessionBookings } from "@/lib/queries";
import MatchRequestsTable from "@/components/admin/MatchRequestsTable";

export const dynamic = "force-dynamic";

// Phase 150 — this page's sidebar link ("Find Your Therapist (legacy)")
// was removed (see app/admin/layout.tsx's NAV comment) since it's fully
// superseded by support_requests/"Find Support requests" and nothing
// writes new rows into match_requests anymore. The page itself is left
// working and reachable by direct URL — historical rows aren't deleted or
// hidden, just no longer a primary nav destination — and table markup
// moved into MatchRequestsTable.tsx (a Client Component) so it can support
// the new Delete action.
export default async function AdminMatchRequestsPage() {
  const [requests, sessionBookings] = await Promise.all([getAllMatchRequests(), getAllSessionBookings()]);
  return <MatchRequestsTable initialRequests={requests} sessionBookings={sessionBookings} />;
}
