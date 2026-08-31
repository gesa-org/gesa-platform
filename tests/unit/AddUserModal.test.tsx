import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddUserModal from "@/components/admin/AddUserModal";

// Phase 82 — "Add user" on /admin/users. Unlike most other admin "add"
// forms, this one goes through app/api/admin/users/route.ts (creating a
// user is structurally server-only — see that route's own comment), so the
// component under test is exercised against a mocked `fetch` rather than a
// mocked Supabase client.
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const mockClipboardWrite = jest.fn(() => Promise.resolve());
Object.assign(navigator, { clipboard: { writeText: mockClipboardWrite } });

describe("AddUserModal", () => {
  beforeEach(() => {
    mockRefresh.mockClear();
    mockClipboardWrite.mockClear();
    global.fetch = jest.fn() as jest.Mock;
  });

  it("posts the form fields and shows the returned temporary password on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ userId: "u1", tempPassword: "Abc123-4567" }),
    });

    render(<AddUserModal />);
    fireEvent.click(screen.getByText("Add user"));

    const [nameInput, emailInput] = screen.getAllByRole("textbox");
    fireEvent.change(nameInput, { target: { value: "Jordan Rivers" } });
    fireEvent.change(emailInput, { target: { value: "jordan@example.com" } });
    fireEvent.click(screen.getByText("Create user"));

    expect(await screen.findByText("Abc123-4567")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/users",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ fullName: "Jordan Rivers", email: "jordan@example.com", role: "client" }),
      })
    );
  });

  it("shows the server's error message and does not show a password on failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "A user with that email already exists." }),
    });

    render(<AddUserModal />);
    fireEvent.click(screen.getByText("Add user"));
    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "Someone" } });
    fireEvent.change(screen.getAllByRole("textbox")[1], { target: { value: "dupe@example.com" } });
    fireEvent.click(screen.getByText("Create user"));

    expect(await screen.findByText("A user with that email already exists.")).toBeInTheDocument();
    expect(screen.queryByText("User created")).not.toBeInTheDocument();
  });

  it("refreshes the page data once the modal is closed after a successful creation", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ userId: "u1", tempPassword: "Xyz987-1111" }),
    });

    render(<AddUserModal />);
    fireEvent.click(screen.getByText("Add user"));
    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "Jordan Rivers" } });
    fireEvent.change(screen.getAllByRole("textbox")[1], { target: { value: "jordan@example.com" } });
    fireEvent.click(screen.getByText("Create user"));
    await screen.findByText("Xyz987-1111");

    fireEvent.click(screen.getByText("Done"));
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });
});
