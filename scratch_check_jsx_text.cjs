// This was a one-off ad-hoc QA script used during Phase 152's build-fix
// (verifying no other literal quote/apostrophe characters existed inside
// JSX text nodes, after a Vercel build failure surfaced one in
// TherapistEditForm.tsx that a simpler grep-based check had missed). It's
// not part of the app — nothing imports or runs it. The sandbox's shell
// couldn't delete this file (permissions error, same limitation noted
// elsewhere in EXECUTION_PLAN.md), so it's emptied out instead. Safe to
// delete manually if you'd like it gone.
