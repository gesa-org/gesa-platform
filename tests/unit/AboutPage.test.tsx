import { render, screen } from "@testing-library/react";
import AboutPage from "@/app/about/page";
import { ABOUT_SECTIONS_FALLBACK } from "@/lib/content";

// Phase 62 — founders can now have a real uploaded photo (photoUrl on
// AboutSectionsContent["founders"]); a founder with none set still falls
// back to the initials block that's always been there. About is an async
// Server Component, so getPageContent is mocked and AboutPage() is awaited
// directly before rendering, same pattern as the rest of this admin/content
// work.
jest.mock("@/lib/content", () => {
  const actual = jest.requireActual("@/lib/content");
  return {
    ...actual,
    getPageContent: jest.fn(async (_key: string, fallback: unknown) => fallback),
  };
});

describe("AboutPage — founders photo/initials fallback", () => {
  it("shows the initials block when no founder has a photoUrl (today's real content)", async () => {
    const jsx = await AboutPage();
    render(jsx);

    // ABOUT_SECTIONS_FALLBACK's founders both have photoUrl: "" today —
    // initials should render, no <img> for either founder's photo slot.
    expect(screen.getByText("IO")).toBeInTheDocument(); // Ilana O'Malley
    expect(screen.getByText("KH")).toBeInTheDocument(); // Karin Horen
  });

  it("shows an uploaded photo instead of initials once photoUrl is set", async () => {
    // AboutPage fetches hero + sections concurrently via Promise.all, so
    // `mockImplementationOnce` would only intercept whichever of those two
    // calls happens to run first (not necessarily the sections one) — a
    // persistent `mockImplementation` that branches on `key` covers both
    // calls correctly regardless of call order.
    const contentModule = jest.requireMock("@/lib/content") as {
      getPageContent: jest.Mock;
    };
    contentModule.getPageContent.mockImplementation(async (key: string, fallback: unknown) => {
      if (key === "page_about_sections") {
        return {
          ...ABOUT_SECTIONS_FALLBACK,
          founders: [
            { ...ABOUT_SECTIONS_FALLBACK.founders[0], photoUrl: "https://cdn.example.com/ilana.jpg" },
            ABOUT_SECTIONS_FALLBACK.founders[1],
          ],
        };
      }
      return fallback;
    });

    const jsx = await AboutPage();
    render(jsx);

    expect(screen.getByAltText("Ilana O'Malley")).toHaveAttribute("src", "https://cdn.example.com/ilana.jpg");
    expect(screen.queryByText("IO")).not.toBeInTheDocument();
    // Karin has no photoUrl in this scenario, so her initials still render.
    expect(screen.getByText("KH")).toBeInTheDocument();
  });

  it("uses the shared light sage green background on the legal/tax-note section (Phase 68)", async () => {
    const jsx = await AboutPage();
    render(jsx);

    const section = screen.getByText(ABOUT_SECTIONS_FALLBACK.taxNote).closest("section");
    expect(section?.className).toContain("bg-sage-soft");
  });

  it("renders the dedicated Mission section (Phase 70)", async () => {
    const jsx = await AboutPage();
    render(jsx);

    expect(screen.getByText(ABOUT_SECTIONS_FALLBACK.ourMissionHeading)).toBeInTheDocument();
    expect(screen.getByText(ABOUT_SECTIONS_FALLBACK.ourMissionBody)).toBeInTheDocument();
  });

  // Phase 77 — Roy asked to remove the "Why GESA exists" section entirely.
  // `missionHeading`/`missionParagraphs` still exist in the content model
  // and its Content Manager editor (not deleted, just unused), so this
  // confirms they're actually not rendered anymore rather than just
  // trusting the removed JSX.
  it("no longer renders the 'Why GESA exists' section (Phase 77)", async () => {
    const jsx = await AboutPage();
    render(jsx);

    expect(screen.queryByText(ABOUT_SECTIONS_FALLBACK.missionHeading)).not.toBeInTheDocument();
    expect(screen.queryByText(ABOUT_SECTIONS_FALLBACK.missionParagraphs[0])).not.toBeInTheDocument();
  });
});
