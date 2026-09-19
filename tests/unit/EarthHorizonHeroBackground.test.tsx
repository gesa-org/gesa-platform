import { act, render } from "@testing-library/react";
import EarthHorizonHeroBackground, {
  EARTH_HORIZON_ROTATION_PLAYBACK_RATE,
  THERAPIST_COVERAGE_LIGHT_SEQUENCE,
  THERAPIST_LIGHT_FADE_MS,
  THERAPIST_LIGHT_HOLD_MS,
} from "@/components/therapists/EarthHorizonHeroBackground";

let mockReducedMotion = false;

jest.mock("@/components/motion/useSafeReducedMotion", () => ({
  useSafeReducedMotion: () => mockReducedMotion,
}));

describe("EarthHorizonHeroBackground", () => {
  beforeEach(() => {
    mockReducedMotion = false;
    jest.useFakeTimers();
    jest.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    jest.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("uses a calm deterministic five-second coverage-light sequence", () => {
    const { container } = render(<EarthHorizonHeroBackground />);
    const lights = container.querySelectorAll(".earth-coverage-light");

    expect(lights).toHaveLength(THERAPIST_COVERAGE_LIGHT_SEQUENCE.length);
    expect(lights[0]).toHaveClass("is-active");

    act(() => jest.advanceTimersByTime(THERAPIST_LIGHT_HOLD_MS));
    expect(lights[0]).toHaveClass("is-fading");
    expect(lights[1]).toHaveClass("is-active");

    act(() => jest.advanceTimersByTime(THERAPIST_LIGHT_FADE_MS));
    expect(lights[0]).toHaveClass("is-hidden");
  });

  it("keeps a static decorative visual without coverage beacons when reduced motion is requested", () => {
    mockReducedMotion = true;
    const { container } = render(<EarthHorizonHeroBackground />);

    expect(container.querySelectorAll(".earth-coverage-light")).toHaveLength(0);
    expect(container.querySelector("video")?.playbackRate).toBe(EARTH_HORIZON_ROTATION_PLAYBACK_RATE);
  });
});
