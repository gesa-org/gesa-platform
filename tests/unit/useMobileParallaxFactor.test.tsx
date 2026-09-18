import { act, renderHook } from "@testing-library/react";
import { MOBILE_PARALLAX_MEDIA_QUERY, MOBILE_PARALLAX_SPEED_FACTOR, scaleParallaxScale, scaleParallaxTravel } from "@/components/motion/config";
import { useMobileParallaxFactor } from "@/components/motion/useMobileParallaxFactor";

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

function mockMatchMedia(matches: boolean) {
  let changeListener: (() => void) | undefined;
  const mediaQuery = {
    matches,
    media: MOBILE_PARALLAX_MEDIA_QUERY,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn((_event: string, listener: () => void) => {
      changeListener = listener;
    }),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
  window.matchMedia = jest.fn().mockReturnValue(mediaQuery);
  return {
    setMatches(nextMatches: boolean) {
      mediaQuery.matches = nextMatches;
      changeListener?.();
    },
  };
}

describe("useMobileParallaxFactor", () => {
  it("uses a 50% factor at the shared 767px mobile breakpoint", async () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useMobileParallaxFactor());

    expect(window.matchMedia).toHaveBeenCalledWith(MOBILE_PARALLAX_MEDIA_QUERY);
    expect(result.current).toBe(MOBILE_PARALLAX_SPEED_FACTOR);
    expect(scaleParallaxTravel(50, result.current)).toBe(25);
    expect(scaleParallaxScale(1.08, result.current)).toBeCloseTo(1.04);
  });

  it("restores the unchanged desktop/tablet factor after a breakpoint change", async () => {
    const matchMedia = mockMatchMedia(true);
    const { result } = renderHook(() => useMobileParallaxFactor());

    await act(async () => {});
    act(() => matchMedia.setMatches(false));
    expect(result.current).toBe(1);
    expect(scaleParallaxTravel(30, result.current)).toBe(30);
  });
});
