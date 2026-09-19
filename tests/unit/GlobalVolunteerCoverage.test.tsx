import { render, screen } from "@testing-library/react";
import GlobalVolunteerCoverage from "@/components/home/GlobalVolunteerCoverage";
import { GLOBAL_VOLUNTEER_COVERAGE_MARKERS } from "@/lib/globalVolunteerCoverage";

describe("GlobalVolunteerCoverage", () => {
  it("renders the worldwide support message, safe metric placeholders, and keyboard-reachable regional markers", () => {
    render(<GlobalVolunteerCoverage />);

    expect(screen.getByRole("heading", { name: "Support That Reaches Around the World" })).toBeInTheDocument();
    expect(screen.getByText("Countries represented")).toBeInTheDocument();
    expect(screen.getByText(/supporters across multiple world regions and time zones/i)).toBeInTheDocument();

    for (const marker of GLOBAL_VOLUNTEER_COVERAGE_MARKERS) {
      expect(screen.getByRole("button", { name: marker.label })).toHaveClass("h-11", "w-11");
    }
  });
});
