// One-off ad-hoc QA script, reused across the Phase 152 build-fix and every
// phase since to re-run the AST-based JSXText quote/apostrophe check on
// whichever files were touched that phase (most recently Phase 156's
// Resilience/Veterans/Support -> War/Terror/Disaster label sync) — clean
// every time it's been run. Not part of the app — nothing imports or runs
// it. The sandbox's shell can't delete this file (permissions error, same
// limitation noted elsewhere in EXECUTION_PLAN.md), so it's emptied out
// instead. Safe to delete manually if you'd like it gone.
