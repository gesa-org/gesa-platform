import { PRIMARY_NAVIGATION, resolveNavHref } from "@/lib/navigation";
import { HEADER_CONTENT_FALLBACK } from "@/components/Header";

// Phase 215 — Roy flagged that the "About" nav link pointing at "/" made
// About indistinguishable from Home. Locks in the fix: "About" now resolves
// to a real, distinct "/about" route, and "Find Support" is untouched.
describe("PRIMARY_NAVIGATION", () => {
  it("routes the 'About' item to /about, not /", () => {
    const about = PRIMARY_NAVIGATION.find((item) => item.key === "about");
    expect(about).toBeTruthy();
    expect(resolveNavHref(about!, HEADER_CONTENT_FALLBACK)).toBe("/about");
  });

  it("leaves the 'Find Support' item pointing at /find-your-therapist, unchanged", () => {
    const findSupport = PRIMARY_NAVIGATION.find((item) => item.key === "findSupport");
    expect(findSupport).toBeTruthy();
    expect(resolveNavHref(findSupport!, HEADER_CONTENT_FALLBACK)).toBe("/find-your-therapist");
  });
});
