import { render } from "@testing-library/react";
import EarthHorizonHeroBackground from "@/components/therapists/EarthHorizonHeroBackground";

let mockReducedMotion = false;

jest.mock("d3-geo", () => ({
  geoOrthographic: () => {
    const projection = {
      translate: jest.fn(),
      scale: jest.fn(),
      clipAngle: jest.fn(),
      precision: jest.fn(),
      rotate: jest.fn(),
    };
    Object.values(projection).forEach((method) => method.mockReturnValue(projection));
    return projection;
  },
  geoPath: () => () => "M0,0",
}));

jest.mock("topojson-client", () => ({
  feature: () => ({ type: "FeatureCollection", features: [] }),
  mesh: () => ({ type: "MultiLineString", coordinates: [] }),
}));

jest.mock("@/components/motion/useSafeReducedMotion", () => ({
  useSafeReducedMotion: () => mockReducedMotion,
}));

describe("EarthHorizonHeroBackground", () => {
  beforeEach(() => {
    mockReducedMotion = false;
    jest.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it("renders a decorative globe with country-border paths instead of video or location markers", () => {
    const { container } = render(<EarthHorizonHeroBackground />);

    expect(container.querySelector("svg.earth-horizon-globe")).toBeInTheDocument();
    expect(container.querySelectorAll(".earth-horizon-borders")).toHaveLength(2);
    expect(container.querySelector("video")).not.toBeInTheDocument();
    expect(container.querySelector(".earth-coverage-light")).not.toBeInTheDocument();
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it("keeps the globe and its borders static when reduced motion is requested", () => {
    mockReducedMotion = true;
    const { container } = render(<EarthHorizonHeroBackground />);

    expect(container.querySelectorAll(".earth-horizon-borders")).toHaveLength(2);
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });
});
