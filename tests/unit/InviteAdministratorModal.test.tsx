import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import InviteAdministratorModal from "@/components/admin/InviteAdministratorModal";

// Phase 187 — regression coverage for the Administrators page's invite
// flow: "this grants sensitive CRM access" always requires an explicit
// confirmation step before the request fires, the Super Admin role option
// is hidden entirely from a plain Administrator, and the confirmation step
// shows exactly what's about to be sent.
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: jest.fn() }) }));

describe("InviteAdministratorModal", () => {
  beforeEach(() => {
    // @ts-expect-error jsdom has no real fetch
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ ok: true, invitationId: "inv-1" }) }));
  });

  function open() {
    render(<InviteAdministratorModal canInviteSuperAdmin={false} />);
    fireEvent.click(screen.getByRole("button", { name: /Invite Administrator/i }));
  }

  it("does not offer Super Admin as a role when the caller can't grant it", () => {
    open();
    expect(screen.queryByRole("option", { name: "Super Admin" })).not.toBeInTheDocument();
  });

  it("offers Super Admin when the caller is themselves a Super Admin", () => {
    render(<InviteAdministratorModal canInviteSuperAdmin={true} />);
    fireEvent.click(screen.getByRole("button", { name: /Invite Administrator/i }));
    expect(screen.getByRole("option", { name: "Super Admin" })).toBeInTheDocument();
  });

  it("requires the confirmation step before sending anything", () => {
    open();
    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Jamie" } });
    fireEvent.change(screen.getByLabelText("Last name"), { target: { value: "Rivera" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "jamie@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.getByText("Confirm this invitation")).toBeInTheDocument();
    expect(screen.getByText("jamie@example.com")).toBeInTheDocument();
  });

  it("sends the invitation only after explicit confirmation", async () => {
    open();
    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Jamie" } });
    fireEvent.change(screen.getByLabelText("Last name"), { target: { value: "Rivera" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "jamie@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: /Yes, send this invitation/ }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/invitations",
      expect.objectContaining({
        body: JSON.stringify({ email: "jamie@example.com", firstName: "Jamie", lastName: "Rivera", invitedRole: "admin" }),
      })
    ));
  });
});
