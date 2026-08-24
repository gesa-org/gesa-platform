import { render, screen } from "@testing-library/react";
import AboutPage from "@/app/about/page";
import { HERO_CONTENT_FALLBACK } from "@/components/Hero";
import { ABOUT_SECTIONS_FALLBACK } from "@/lib/content";

// Phase 58 — About is an async Server Component (it awaits getPageContent
// twice). Mocking that module lets us await AboutPage() directly here and
// render the resolved JSX, the same way Next does on the server, rather than
// needing a real Supabase call. This is the first test for this page —
// added per the Phase 57 lesson that a passing `tsc --noEmit` alone didn't
// catch a real rendering break, so anything beyond a trivial change now
// gets an actual render check too.
jest.mock("@/lib/content", () => {
  const actual = jest.requireActual("@/lib/content");
  return {
    ...actual,
    getPageContent: jest.fn(async (_key: string, fallback: unknown) => fallback),
  };
});

describe("AboutPage", () => {
  it("renders the hero, the new full-bleed image band, the asymmetric mission layout, and every existing section", async () => {
    const jsx = await AboutPage();
    render(jsx);

    // Existing sections still present, untouched.
    expect(screen.getByText(ABOUT_SECTIONS_FALLBACK.howItWorksHeading)).toBeInTheDocument();
    expect(screen.getByText(ABOUT_SECTIONS_FALLBACK.foundersIntro)).toBeInTheDocument();
    expect(screen.getByText(ABOUT_SECTIONS_FALLBACK.volunteerBody)).toBeInTheDocument();

    // Phase 58 — full-bleed breather band image renders with real alt text.
    const bandImg = screen.getByAltText(
      "A painting of hands cradling a glowing form within layered leaves"
    );
    expect(bandImg).toBeInTheDocument();
    expect(bandImg).toHaveAttribute("src", "/images/about/hero-painting.jpg");

    // Phase 58 — mission section: first paragraph as the big statement...
    const statement = screen.getByRole("heading", {
      level: 2,
      name: ABOUT_SECTIONS_FALLBACK.missionParagraphs[0],
    });
    expect(statement).toBeInTheDocument();

    // ...every subsequent paragraph rendered as its own offset secondary <p>.
    ABOUT_SECTIONS_FALLBACK.missionParagraphs.slice(1).forEach((p) => {
      expect(screen.getByText(p)).toBeInTheDocument();
    });

    // Hero content still rendered too (nothing before it was disturbed).
    expect(screen.getByText(HERO_CONTENT_FALLBACK.eyebrow)).toBeInTheDocument();
  });
});
