import { render, screen } from "@testing-library/react";
import FindYourTherapistPage from "@/app/find-your-therapist/page";
import { SUPPORT_GROUPS_CONTENT_FALLBACK } from "@/lib/content";

// Phase 219 — this page rendered the former Community page's content,
// moved here exactly as it existed. Phase 222 (this file's own update) —
// the group-listing/registration flow and Testimonials moved back to
// app/support-groups/page.tsx (see SupportGroupsPage.test.tsx for those
// assertions now); this page keeps the banner and CommunityIntro content.
jest.mock("@/lib/content", () => {
  const actual = jest.requireActual("@/lib/content");
  return {
    ...actual,
    getPageContent: jest.fn(async (_key: string, fallback: unknown) => fallback),
  };
});

jest.mock("@/lib/queries", () => ({
  getActiveTherapists: jest.fn(async () => []),
}));

const donateBandMock = jest.fn(() => null);
jest.mock("@/components/home/DonateBand", () => ({
  __esModule: true,
  default: (...args: unknown[]) => donateBandMock(...args),
}));

describe("FindYourTherapistPage", () => {
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

  it("no longer renders the support-groups-list group listing (moved to /support-groups, Phase 222)", async () => {
    const jsx = await FindYourTherapistPage({});
    render(jsx);

    expect(document.getElementById("support-groups-list")).not.toBeInTheDocument();
  });

  it("renders its own DonateBand", async () => {
    donateBandMock.mockClear();
    const jsx = await FindYourTherapistPage({});
    render(jsx);

    expect(donateBandMock).toHaveBeenCalledTimes(1);
  });
});
