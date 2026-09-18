import { render, screen } from "@testing-library/react";
import ParallaxLayer from "@/components/motion/ParallaxLayer";
import { useSafeReducedMotion } from "@/components/motion/useSafeReducedMotion";

jest.mock("@/components/motion/useSafeReducedMotion", () => ({
  useSafeReducedMotion: jest.fn(),
}));

const mockReducedMotion = useSafeReducedMotion as jest.MockedFunction<typeof useSafeReducedMotion>;

describe("ParallaxLayer", () => {
  afterEach(() => {
    mockReducedMotion.mockReset();
  });

  it("renders a static background layer when reduced motion is requested", () => {
    mockReducedMotion.mockReturnValue(true);
    render(
      <ParallaxLayer className="parallax-fixture" decorative>
        <span>Background artwork</span>
      </ParallaxLayer>
    );

    const layer = screen.getByText("Background artwork").parentElement;
    expect(layer).toHaveClass("parallax-fixture");
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer).not.toHaveStyle({ willChange: "transform" });
  });

  it("uses a transform-promoted layer when motion is allowed", () => {
    mockReducedMotion.mockReturnValue(false);
    render(
      <ParallaxLayer className="parallax-fixture">
        <span>Background artwork</span>
      </ParallaxLayer>
    );

    expect(screen.getByText("Background artwork").parentElement).toHaveStyle({ willChange: "transform" });
  });
});
