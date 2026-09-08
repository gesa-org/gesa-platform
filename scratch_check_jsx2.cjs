// One-off ad-hoc QA script, reused every phase since Phase 152's build-fix
// to re-run the AST-based JSXText quote/apostrophe check on whichever files
// were touched that phase (most recently Phase 167's ivory background
// match) — clean every time it's been run. Not part of the app — nothing
// imports or runs it. The sandbox's shell can't delete this file
// (permissions error, same limitation noted elsewhere in
// EXECUTION_PLAN.md), so it's emptied out instead. Safe to delete manually
// if you'd like it gone.
