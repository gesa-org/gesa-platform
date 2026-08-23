import "@testing-library/jest-dom";

// Phase 45 — jsdom (Jest's test DOM) has no real IntersectionObserver,
// which framer-motion's `whileInView` (used by the new
// components/motion/Reveal.tsx and StaggerReveal.tsx primitives) requires
// to even mount without throwing. Without this stub, any test that renders
// a component using those primitives — e.g. TherapistsDirectory's results
// grid — crashed with "ReferenceError: IntersectionObserver is not
// defined" before this was added. This is a minimal stub (never actually
// fires an intersection callback), which is fine here: none of the
// existing tests assert anything about scroll-triggered animation state,
// only about real DOM content/visibility, which this doesn't affect.
if (typeof window !== "undefined" && !("IntersectionObserver" in window)) {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  // @ts-expect-error — assigning a minimal test-only stub, not a full spec-compliant implementation
  window.IntersectionObserver = MockIntersectionObserver;
  // `global` (Node's ambient type) already types this loosely enough that
  // the assignment above needs the suppression but this one doesn't.
  global.IntersectionObserver = MockIntersectionObserver;
}
