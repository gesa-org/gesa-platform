import { act, renderHook } from "@testing-library/react";
import { useSafeReducedMotion } from "@/components/motion/useSafeReducedMotion";

// Phase 176 — direct regression test for the actual root cause behind the
// "Load more does nothing" report: framer-motion's own `useReducedMotion()`
// reads `window.matchMedia(...)` synchronously during render, so it can
// return a real boolean on the client's very first render while the server
// (no `window`) always returns `null` — a guaranteed hydration mismatch on
// any visitor/browser reporting `prefers-reduced-motion: reduce`, on every
// route (Reveal/StaggerGroup/StaggerItem render in the global Footer). This
// hook is the fix: it must report `false` (matching the server's
// `Boolean(null)`) on first render regardless of the real OS preference,
// and only switch to the real value after an effect has run — by which
// point hydration has already succeeded.
function mockMatchMedia(matches: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

describe("useSafeReducedMotion", () => {
  it("reports false on the very first render even when the OS prefers reduced motion", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useSafeReducedMotion());
    // Synchronously after render, before any effect has committed — this is
    // the exact value React's hydration pass would compare against the
    // server's output, and it must match the server's `false`.
    expect(result.current).toBe(false);
  });

  it("switches to the real preference once mounted", async () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useSafeReducedMotion());
    await act(async () => {});
    expect(result.current).toBe(true);
  });

  it("stays false after mount when the OS does not prefer reduced motion", async () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useSafeReducedMotion());
    await act(async () => {});
    expect(result.current).toBe(false);
  });
});
