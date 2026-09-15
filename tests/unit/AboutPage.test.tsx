import { render, screen } from "@testing-library/react";
import AboutPage from "@/app/about/page";
import { ABOUT_SECTIONS_FALLBACK } from "@/lib/content";

// Phase 218 — reverting Phase 217 (Roy asked to undo it entirely). This
// page's Find Support content (moved briefly to /find-your-therapist per
// Phase 217) is back here, so these assertions are restored to their
// pre-217 form.
jest.mock("@/lib/content", () => {
  const actual = jest.requireActual("@/lib/content");
  return {
    ...actual,
    getPageContent: jest.fn(async (_key: string, fallback: unknown) => fallback),
  };
});

jest.mock("@/lib/queries", () => ({
  getActiveClinicLocations: jest.fn(async () => []),
  getActiveTherapists: jest.fn(async () => []),
}));

// Phase 84 — DonateBand is an async Server Component; nesting its unawaited
// JSX inside this page's own async body throws "Objects are not valid as a
// React child (found: [object Promise])" the moment render() is called.
jest.mock("@/components/home/DonateBand", () => ({
  __esModule: true,
  default: () => null,
}));

describe("AboutPage", () => {
  it("shows the initials block when no founder has a photoUrl (today's real content)", async () => {
    const jsx = await AboutPage({});
    render(jsx);

    expect(screen.getByText("IO")).toBeInTheDocument(); // Ilana O'Malley
    expect(screen.getByText("KH")).toBeInTheDocument(); // Karin Horen
  });

  it("no longer renders the volunteer CTA band or the legal/tax-note section (Phase 85)", async () => {
    const jsx = await AboutPage({});
    render(jsx);

    expect(screen.queryByText(ABOUT_SECTIONS_FALLBACK.volunteerHeading)).not.toBeInTheDocument();
    expect(screen.queryByText(ABOUT_SECTIONS_FALLBACK.taxNote)).not.toBeInTheDocument();
    expect(screen.queryByText(ABOUT_SECTIONS_FALLBACK.legalBlurb)).not.toBeInTheDocument();
  });

  it("no longer renders the 'Why GESA exists' mission section (Phase 77)", async () => {
    const jsx = await AboutPage({});
    render(jsx);

    expect(screen.queryByText(ABOUT_SECTIONS_FALLBACK.missionParagraphs[0])).not.toBeInTheDocument();
  });
});
