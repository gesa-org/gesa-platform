import { NextResponse } from "next/server";

// Phase 150 — CRM inquiry-architecture cleanup. This route backed
// components/match/BookingModal.tsx, itself unused since Phase 142
// (match results now book through the shared <BookSessionButton>
// component instead). A repo-wide grep confirmed nothing calls this route
// anymore. It was in scope to remove outright as a legacy duplicate
// submission path, but this environment's shell sandbox refused to delete
// the file (permissions error) — so instead of leaving a working endpoint
// that could silently create a new match_requests row if anything ever
// called it again, the route is neutered here: it always returns 410 Gone
// and performs no database write and sends no email, regardless of what's
// posted to it. The original implementation (insert into match_requests +
// confirmation/notification emails) is preserved in git history if this
// ever needs restoring for reference.
export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has been retired. Find Support requests now go through /api/support-match." },
    { status: 410 }
  );
}
