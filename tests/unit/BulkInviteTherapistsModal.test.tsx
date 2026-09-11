import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BulkInviteTherapistsModal from "@/components/admin/BulkInviteTherapistsModal";
import type { TherapistOnboardingRow } from "@/lib/queries";

// Phase 187 — regression coverage for the bulk-invite workflow: only
// active-and-no-account professionals are selectable, a missing email
// blocks that person from being sent (not the whole batch), and the
// request only ever includes ids whose email was actually present.
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: jest.fn() }) }));

const candidates: TherapistOnboardingRow[] = [
  { id: "t-1", full_name: "Amelia Grego", contact_email: "amelia@example.com", profile_status: "active", profile_id: null },
  { id: "t-2", full_name: "No Email Guy", contact_email: null, profile_status: "active", profile_id: null },
  { id: "t-3", full_name: "Already Has Account", contact_email: "has@example.com", profile_status: "active", profile_id: "profile-1" },
  { id: "t-4", full_name: "Draft Person", contact_email: "draft@example.com", profile_status: "draft", profile_id: null },
];

describe("BulkInviteTherapistsModal", () => {
  beforeEach(() => {
    // @ts-expect-error jsdom has no real fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ sent: [{ id: "t-1", email: "amelia@example.com" }], skippedNoEmail: [], skippedHasAccount: [], failed: [], notFound: [] }),
      })
    );
  });

  it("only lists active professionals with no existing account as eligible", () => {
    render(<BulkInviteTherapistsModal candidates={candidates} />);
    fireEvent.click(screen.getByRole("button", { name: /Invite professionals/i }));

    expect(screen.getByText("Amelia Grego")).toBeInTheDocument();
    expect(screen.getByText("No Email Guy")).toBeInTheDocument();
    expect(screen.queryByText("Already Has Account")).not.toBeInTheDocument();
    expect(screen.queryByText("Draft Person")).not.toBeInTheDocument();
  });

  it("warns about a selected person with no email in the review step, and only sends the ones with an email", async () => {
    render(<BulkInviteTherapistsModal candidates={candidates} />);
    fireEvent.click(screen.getByRole("button", { name: /Invite professionals/i }));
    fireEvent.click(screen.getByLabelText(/Select all/));
    fireEvent.click(screen.getByRole("button", { name: /Review/ }));

    expect(screen.getByText(/No Email Guy/)).toBeInTheDocument();
    expect(screen.getByText(/no email on file and will be skipped/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Send 1 invitation/ }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/invitations/bulk",
      expect.objectContaining({ body: JSON.stringify({ therapistIds: ["t-1"] }) })
    ));
  });

  it("shows an empty state when nobody is eligible", () => {
    render(<BulkInviteTherapistsModal candidates={[candidates[2], candidates[3]]} />);
    fireEvent.click(screen.getByRole("button", { name: /Invite professionals/i }));
    expect(screen.getByText(/Every active professional already has an account/)).toBeInTheDocument();
  });
});
