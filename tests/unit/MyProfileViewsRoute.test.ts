const mockMaybeSingle = jest.fn();
const mockEq = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock("@/lib/auth/getCurrentProfile", () => ({ getCurrentProfile: jest.fn() }));
jest.mock("@/lib/supabase/admin", () => ({ createAdminClient: jest.fn() }));
jest.mock("next/server", () => ({
  NextResponse: { json: (body: unknown) => ({ json: async () => body }) },
}));

import { GET } from "@/app/api/analytics/my-profile-views/route";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createAdminClient } from "@/lib/supabase/admin";

const mockGetCurrentProfile = getCurrentProfile as jest.Mock;
const mockCreateAdminClient = createAdminClient as jest.Mock;

describe("GET /api/analytics/my-profile-views", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateAdminClient.mockReturnValue({ from: mockFrom });
  });

  it("does not expose a count to an anonymous visitor", async () => {
    mockGetCurrentProfile.mockResolvedValue(null);

    const response = await GET();

    expect(await response.json()).toEqual({});
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
  });

  it("does not expose a count to a non-professional account", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "client-1", role: "client" });

    const response = await GET();

    expect(await response.json()).toEqual({});
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
  });

  it("returns the total only for the professional linked to the authenticated profile", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "profile-1", role: "therapist" });
    mockMaybeSingle.mockResolvedValue({ data: { id: "professional-1", profile_views: 12 } });

    const response = await GET();

    expect(await response.json()).toEqual({ therapistId: "professional-1", profileViews: 12 });
    expect(mockEq).toHaveBeenCalledWith("profile_id", "profile-1");
  });
});
