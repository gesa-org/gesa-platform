import { render, screen } from "@testing-library/react";
import Badge from "@/components/ui/Badge";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Mental Health Resources</Badge>);
    expect(screen.getByText("Mental Health Resources")).toBeInTheDocument();
  });

  it("uses the clay tone classes when tone='clay'", () => {
    render(<Badge tone="clay">Volunteer</Badge>);
    expect(screen.getByText("Volunteer")).toHaveClass("text-clay");
  });
});
