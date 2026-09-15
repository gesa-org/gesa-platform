import { render, screen } from "@testing-library/react";
import FindYourTherapistPage from "@/app/find-your-therapist/page";
import { ABOUT_SECTIONS_FALLBACK, SUPPORT_GROUPS_CONTENT_FALLBACK } from "@/lib/content";

// Phase 217 — this page now renders both the original Find Support content
// (moved back from /about, where it briefly lived per Phase 216) and the
// full former Community/support-groups content, appended after it. This
// file merges what used to be AboutPage.test.tsx's founders/mission
// assertions (that content, unchanged) with new assertions for the
// transferred Community sections and the transition heading between them.
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
  getSupportGroups: jest.fn(async () => []),
  getTestimonials: jest.fn(async () => []),
}));

// Same latent-bug workaround AboutPage.test.tsx used to carry (Phase 84):
// DonateBand is an async Server Component, and nesting its unawaited JSX
// inside this page's own async body throws "Objects are not valid as a
// React child (found: [object Promise])" the moment render() is called.
// Wrapped in a jest.fn so the test below can assert it was only ever
// mounted once on this page, not twice (see that test's own comment).
const donateBandMock = jest.fn(() => null);
jest.mock("@/components/home/DonateBand", () => ({
  __esModule: true,
  default: (...args: unknown[]) => donateBandMock(...args),
}));

// SupportGroupsInteractive calls createClient() from a submit handler, not
// on mount, but this stub keeps the test fully offline regardless — no
// real Supabase env vars exist in this test run.
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}));

describe("FindYourTherapistPage — original Find Support content (moved back from /about)", () => {
  it("shows the initials block when no founder has a photoUrl (today's real content)", async () => {
    const jsx = await FindYourTherapistPage({});
    render(jsx);

    expect(screen.getByText("IO")).toBeInTheDocument(); // Ilana O'Malley
    expect(screen.getByText("KH")).toBeInTheDocument(); // Karin Horen
  });

  it("no longer renders the volunteer CTA band or the legal/tax-note section (Phase 85)", async () => {
    const jsx = await FindYourTherapistPage({});
    render(jsx);

    expect(screen.queryByText(ABOUT_SECTIONS_FALLBACK.volunteerHeading)).not.toBeInTheDocument();
    expect(screen.queryByText(ABOUT_SECTIONS_FALLBACK.taxNote)).not.toBeInTheDocument();
    expect(screen.queryByText(ABOUT_SECTIONS_FALLBACK.legalBlurb)).not.toBeInTheDocument();
  });

  // Note: ABOUT_SECTIONS_FALLBACK.missionHeading and the Community content's
  // own missionHeading (rendered further down this same page, see the next
  // describe block) are coincidentally both literally "Why GESA exists" —
  // real, different content objects, only one of which actually renders.
  // Asserting on the heading text alone would collide with that legitimate
  // Community heading, so this checks the About-specific body paragraph
  // instead, which has no such collision.
  it("no longer renders the About page's own 'Why GESA exists' mission paragraph (Phase 77)", async () => {
    const jsx = await FindYourTherapistPage({});
    render(jsx);

    expect(screen.queryByText(ABOUT_SECTIONS_FALLBACK.missionParagraphs[0])).not.toBeInTheDocument();
  });
});

// Phase 217 — the newly-transferred Community content, plus the transition
// section Roy's spec asked for between the two halves of this page.
describe("FindYourTherapistPage — transferred Community content", () => {
  it("renders the transition heading and supporting copy before the Community content", async () => {
    const jsx = await FindYourTherapistPage({});
    render(jsx);

    expect(screen.getByRole("heading", { name: "Explore More Ways to Receive Support" })).toBeInTheDocument();
    expect(
      screen.getByText("Choose the support option that best fits your needs, from charity-supported services to professional care.")
    ).toBeInTheDocument();
  });

  it("renders the Community banner content (PageHero eyebrow/title/description)", async () => {
    const jsx = await FindYourTherapistPage({});
    render(jsx);

    expect(screen.getByText(SUPPORT_GROUPS_CONTENT_FALLBACK.eyebrow)).toBeInTheDocument();
    expect(screen.getByText(SUPPORT_GROUPS_CONTENT_FALLBACK.title)).toBeInTheDocument();
  });

  it("renders the 'Why GESA exists' Community mission section and pathway cards", async () => {
    const jsx = await FindYourTherapistPage({});
    render(jsx);

    expect(screen.getByText("Why GESA exists")).toBeInTheDocument();
    expect(screen.getByText("Choose your pathway")).toBeInTheDocument();
  });

  it("renders the support-groups-list section id for the group listing/registration flow", async () => {
    const jsx = await FindYourTherapistPage({});
    render(jsx);

    expect(document.getElementById("support-groups-list")).toBeInTheDocument();
  });

  it("renders exactly one DonateBand, not a duplicate from the transferred Community content", async () => {
    donateBandMock.mockClear();
    const jsx = await FindYourTherapistPage({});
    render(jsx);

    // Community's own page.tsx used to call <DonateBand /> a second time at
    // its own end; that call was deliberately dropped when moving this
    // content here (see this page's own header comment), so only the one
    // DonateBand already at the bottom of this page should mount.
    expect(donateBandMock).toHaveBeenCalledTimes(1);
  });
});
