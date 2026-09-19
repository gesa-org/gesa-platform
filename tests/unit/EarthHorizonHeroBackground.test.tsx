import { render } from "@testing-library/react";
import EarthHorizonHeroBackground, {
  CINEMATIC_EARTH_PLAYBACK_RATE,
} from "@/components/therapists/EarthHorizonHeroBackground";

let mockReducedMotion = false;

jest.mock("@/components/motion/useSafeReducedMotion", () => ({
  useSafeReducedMotion: () => mockReducedMotion,
}));

describe("EarthHorizonHeroBackground", () => {
  beforeEach(() => {
    mockReducedMotion = false;
    jest.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    jest.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it("renders the supplied cinematic Earth footage in a decorative horizon composition", () => {
    const { container } = render(<EarthHorizonHeroBackground />);

    expect(container.querySelector(".earth-cinematic-planet video")).toBeInTheDocument();
    expect(container.querySelector(".earth-cinematic-rim")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
    expect(container.querySelector(".earth-coverage-light")).not.toBeInTheDocument();
    expect(container.querySelector("video")?.playbackRate).toBe(CINEMATIC_EARTH_PLAYBACK_RATE);
  });

  it("holds the first frame static when reduced motion is requested", () => {
    mockReducedMotion = true;
    render(<EarthHorizonHeroBackground />);

    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });
});
