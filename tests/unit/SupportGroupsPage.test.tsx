import { render, screen } from "@testing-library/react";
import SupportGroupsPage from "@/app/support-groups/page";
import { SUPPORT_GROUPS_DIRECTORY_CONTENT_FALLBACK } from "@/components/SupportGroupsInteractive";

// Phase 219 moved this page's content onto Find Support, leaving this route
// empty. Phase 222 (this file's own update) — the group-listing/registration
// flow and Testimonials moved back here (see FindYourTherapistPage.test.tsx
// for the banner/CommunityIntro assertions that stayed on Find Support).
jest.mock("@/lib/content", () => {
  const actual = jest.requireActual("@/lib/content");
  return {
    ...actual,
    getPageContent: jest.fn(async (_key: string, fallback: unknown) => fallback),
  };
});

jest.mock("@/lib/queries", () => ({
  getSupportGroups: jest.fn(async () => []),
  getTestimonials: jest.fn(async () => []),
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}));

describe("SupportGroupsPage", () => {
  it("renders the support-groups-list section id for the group listing/registration flow", async () => {
    const jsx = await SupportGroupsPage({});
    render(jsx);

    expect(document.getElementById("support-groups-list")).toBeInTheDocument();
  });

  it("renders the group directory's no-groups fallback message when there are no groups", async () => {
    const jsx = await SupportGroupsPage({});
    render(jsx);

    expect(screen.getByText(SUPPORT_GROUPS_DIRECTORY_CONTENT_FALLBACK.noGroupsMessage)).toBeInTheDocument();
  });
});
