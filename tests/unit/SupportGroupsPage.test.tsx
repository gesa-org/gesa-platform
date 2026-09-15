import { render, screen } from "@testing-library/react";
import SupportGroupsPage from "@/app/support-groups/page";
import { SUPPORT_GROUPS_CONTENT_FALLBACK } from "@/lib/content";

// Phase 218 — reverting Phase 217 (Roy asked to undo it entirely). This
// page's Community content (moved briefly to /find-your-therapist per
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
  getActiveTherapists: jest.fn(async () => []),
  getSupportGroups: jest.fn(async () => []),
  getTestimonials: jest.fn(async () => []),
}));

const donateBandMock = jest.fn(() => null);
jest.mock("@/components/home/DonateBand", () => ({
  __esModule: true,
  default: (...args: unknown[]) => donateBandMock(...args),
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}));

describe("SupportGroupsPage", () => {
  it("renders the Community banner content (PageHero eyebrow/title/description)", async () => {
    const jsx = await SupportGroupsPage({});
    render(jsx);

    expect(screen.getByText(SUPPORT_GROUPS_CONTENT_FALLBACK.eyebrow)).toBeInTheDocument();
    expect(screen.getByText(SUPPORT_GROUPS_CONTENT_FALLBACK.title)).toBeInTheDocument();
  });

  it("renders the 'Why GESA exists' Community mission section and pathway cards", async () => {
    const jsx = await SupportGroupsPage({});
    render(jsx);

    expect(screen.getByText("Why GESA exists")).toBeInTheDocument();
    expect(screen.getByText("Choose your pathway")).toBeInTheDocument();
  });

  it("renders the support-groups-list section id for the group listing/registration flow", async () => {
    const jsx = await SupportGroupsPage({});
    render(jsx);

    expect(document.getElementById("support-groups-list")).toBeInTheDocument();
  });

  it("renders its own DonateBand", async () => {
    donateBandMock.mockClear();
    const jsx = await SupportGroupsPage({});
    render(jsx);

    expect(donateBandMock).toHaveBeenCalledTimes(1);
  });
});
