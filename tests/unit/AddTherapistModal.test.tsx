import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddTherapistModal from "@/components/admin/AddTherapistModal";

// Phase 82 — "Add Professional" on /admin/therapists. Mocks the Supabase
// client the same way TherapistsTable's tests do, so no real network call
// happens here; verifies the slug is derived from the full name, the record
// is created inactive, and the admin is routed straight into the full
// editor for that new id.
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

type InsertResult = { data: { id: string } | null; error: { code: string; message: string } | null };

const mockSingle = jest.fn(async () => ({ data: null, error: null } as InsertResult));
const mockSelect = jest.fn(() => ({ single: mockSingle }));
const mockInsert = jest.fn(() => ({ select: mockSelect }));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({ insert: mockInsert }),
  }),
}));

describe("AddTherapistModal", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockInsert.mockClear();
    mockSelect.mockClear();
    mockSingle.mockClear();
  });

  it("opens the form, and does nothing until a name is entered", () => {
    render(<AddTherapistModal />);
    expect(screen.queryByText("Add Professional")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Add Professional"));
    expect(screen.getByText("Create & edit profile").closest("button")).toBeDisabled();
  });

  it("creates an inactive therapist with a slug derived from the name, then routes to its edit page", async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: "new-id-1" }, error: null });
    render(<AddTherapistModal />);

    fireEvent.click(screen.getByText("Add Professional"));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Dr. Jamie O'Neil" } });
    fireEvent.click(screen.getByText("Create & edit profile"));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/admin/therapists/new-id-1"));
    expect(mockInsert).toHaveBeenCalledWith({ full_name: "Dr. Jamie O'Neil", slug: "dr-jamie-o-neil", is_active: false });
  });

  it("retries with a numeric suffix when the slug is already taken", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: null, error: { code: "23505", message: "duplicate key" } })
      .mockResolvedValueOnce({ data: { id: "new-id-2" }, error: null });
    render(<AddTherapistModal />);

    fireEvent.click(screen.getByText("Add Professional"));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Dana Cohen" } });
    fireEvent.click(screen.getByText("Create & edit profile"));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/admin/therapists/new-id-2"));
    expect(mockInsert).toHaveBeenNthCalledWith(1, { full_name: "Dana Cohen", slug: "dana-cohen", is_active: false });
    expect(mockInsert).toHaveBeenNthCalledWith(2, { full_name: "Dana Cohen", slug: "dana-cohen-2", is_active: false });
  });

  it("shows an error and does not navigate if the insert fails for a non-conflict reason", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: "42501", message: "permission denied" } });
    render(<AddTherapistModal />);

    fireEvent.click(screen.getByText("Add Professional"));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Someone" } });
    fireEvent.click(screen.getByText("Create & edit profile"));

    expect(await screen.findByText(/Could not create the professional/)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
