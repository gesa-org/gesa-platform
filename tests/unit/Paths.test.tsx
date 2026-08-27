import { render, screen } from "@testing-library/react";
import Paths from "@/components/home/Paths";

// Phase 70 — Roy asked to remove the Home page's gold-band hero text
// (eyebrow/headline/subtitle/trust badges) and the decorative "gallery
// wall" of the three path artworks. No unit test previously covered this
// component at all; this is a minimal smoke test confirming the removed
// text/images are actually gone and the three real path cards (which carry
// the same three artwork images, just as real content further down) still
// render correctly.
describe("Paths (Home)", () => {
  it("no longer renders the gold-band hero text or the decorative gallery wall", () => {
    render(<Paths />);

    expect(screen.queryByText("A global volunteer support alliance")).not.toBeInTheDocument();
    expect(screen.queryByText("Two clicks to a therapist who understands")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/GESA \(Global Emotional Support Alliance\) connects you with a verified volunteer therapist/)
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Verified Professionals")).not.toBeInTheDocument();
    expect(screen.queryByText("100% Free Sessions")).not.toBeInTheDocument();
    expect(screen.queryByText("Global Community")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("still renders the three real path cards", () => {
    render(<Paths />);

    expect(screen.getByText("In crisis right now")).toBeInTheDocument();
    expect(screen.getByText("Veterans, reservists & families")).toBeInTheDocument();
    expect(screen.getByText("Seeking support")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /reach out now/i })).toHaveLength(3);
  });
});
