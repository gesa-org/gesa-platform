import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VolunteerApplicationStatusControl from "@/components/admin/VolunteerApplicationStatusControl";

// Phase 186 — regression coverage for the approval workflow: picking
// "Approved" must never, by itself, create or publish a professional
// profile. It has to open a confirmation modal offering two distinct,
// separately-clicked actions, and only "Approve and create professional
// profile" may call the profile-creation endpoint.
const updateEqMock = jest.fn(() => Promise.resolve({ error: null }));
const updateMock = jest.fn(() => ({ eq: updateEqMock }));
const fromMock = jest.fn(() => ({ update: updateMock }));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: fromMock }),
}));

const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

function renderControl(overrides: Partial<Parameters<typeof VolunteerApplicationStatusControl>[0]> = {}) {
  const props = {
    id: "app-1",
    fullName: "Jamie Rivera",
    status: "new" as const,
    linkedProfile: null,
    onStatusChange: jest.fn(),
    onProfileCreated: jest.fn(),
    ...overrides,
  };
  render(<VolunteerApplicationStatusControl {...props} />);
  return props;
}

describe("VolunteerApplicationStatusControl", () => {
  beforeEach(() => {
    updateEqMock.mockClear();
    updateMock.mockClear();
    fromMock.mockClear();
    pushMock.mockClear();
    // @ts-expect-error — jsdom has no real fetch.
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ therapistId: "t-1" }) }));
  });

  it('picking "Approved" opens a confirmation modal instead of committing the status immediately', () => {
    renderControl();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "approved" } });

    expect(screen.getByRole("button", { name: "Approve application only" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Approve and create professional profile/ })).toBeInTheDocument();
    // Not committed yet — no supabase write and no API call.
    expect(updateMock).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('"Approve application only" updates status and never calls the create-profile API', async () => {
    const props = renderControl();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "approved" } });
    fireEvent.click(screen.getByRole("button", { name: "Approve application only" }));

    await waitFor(() => expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ status: "approved" })));
    expect(global.fetch).not.toHaveBeenCalled();
    expect(props.onProfileCreated).not.toHaveBeenCalled();
    expect(props.onStatusChange).toHaveBeenCalledWith("approved");
  });

  it('"Approve and create professional profile" calls the create-profile API and navigates to the new profile', async () => {
    const props = renderControl();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "approved" } });
    fireEvent.click(screen.getByRole("button", { name: /Approve and create professional profile/ }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/volunteer-applications/create-profile",
      expect.objectContaining({ method: "POST" })
    ));
    expect(props.onProfileCreated).toHaveBeenCalledWith("t-1");
    expect(pushMock).toHaveBeenCalledWith("/admin/therapists/t-1");
  });

  it("re-picking an already-approved status does not reopen the confirmation modal", () => {
    renderControl({ status: "approved" });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "approved" } });
    expect(screen.queryByRole("button", { name: "Approve application only" })).not.toBeInTheDocument();
  });

  it("shows a Create Professional Profile button for an approved application with no linked profile yet", () => {
    renderControl({ status: "approved" });
    expect(screen.getByRole("button", { name: /Create Professional Profile/ })).toBeInTheDocument();
  });

  it("shows a link to the profile instead, once one exists", () => {
    renderControl({ status: "approved", linkedProfile: { id: "t-2", profile_status: "draft" } });
    expect(screen.getByRole("link", { name: /View professional profile/ })).toHaveAttribute(
      "href",
      "/admin/therapists/t-2"
    );
    expect(screen.queryByRole("button", { name: /Create Professional Profile/ })).not.toBeInTheDocument();
  });
});
