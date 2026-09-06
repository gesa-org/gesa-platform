import { NextResponse } from "next/server";

// Phase 150 — CRM inquiry-architecture cleanup. This route backed the
// retired 6-step "Find Your Therapist" wizard's own matching step, before
// Phase 142 unified matching into /api/support-match (tied to a
// support_requests row). A repo-wide grep confirmed nothing calls this
// route anymore. It performed no database write (it only read active
// therapists and returned a computed match list), so it carried less risk
// than /api/match-booking, but it's retired the same way for consistency
// and to close it off from ever being called again: this environment's
// shell sandbox refused to delete the file outright (permissions error),
// so it now always returns 410 Gone instead. The original matching
// implementation is preserved in git history if ever needed for reference.
export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has been retired. Find Support requests now go through /api/support-match." },
    { status: 410 }
  );
}
