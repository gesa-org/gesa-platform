import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TherapistsTable, { type TherapistListRow } from "@/components/admin/TherapistsTable";

// Phase 65 — Roy said toggling therapists one at a time through "Edit" was
// tiring, and asked for a shortcut to select several/all and change their
// active/deactivated status in one action. Mocks the Supabase client the
// same way VolunteerApplicationStatusSelect/ImageUploadField tests do, so
// no real network call happens here.
const mockUpdate = jest.fn(() => ({ in: mockIn }));
const mockIn = jest.fn(async () => ({ error: null }));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      update: mockUpdate,
    }),
  }),
}));

const THERAPISTS: TherapistListRow[] = [
  { id: "t1", photo_url: null, full_name: "Karin Horen", languages: ["English", "Hebrew"], is_active: true, diary_link: null, diary_link_status: "unset" },
  { id: "t2", photo_url: null, full_name: "Dana Cohen", languages: ["English"], is_active: true, diary_link: null, diary_link_status: "unset" },
  { id: "t3", photo_url: null, full_name: "Yossi Levi", languages: ["Hebrew"], is_active: false, diary_link: null, diary_link_status: "unset" },
];

describe("TherapistsTable", () => {
  beforeEach(() => {
    mockUpdate.mockClear();
    mockIn.mockClear();
  });

  it("shows no bulk action bar until at least one therapist is selected", () => {
    render(<TherapistsTable therapists={THERAPISTS} />);
    expect(screen.queryByText("Activate selected")).not.toBeInTheDocument();
    expect(screen.queryByText("Deactivate selected")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Select Karin Horen"));
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect(screen.getByText("Activate selected")).toBeInTheDocument();
    expect(screen.getByText("Deactivate selected")).toBeInTheDocument();
  });

  it("'select all' checks every row, and deactivating them all fires one batched update, not one per row", async () => {
    render(<TherapistsTable therapists={THERAPISTS} />);
    // Phase 125 — aria-label renamed "Select all therapists" -> "Select all
    // professionals" along with the rest of the CRM's "Therapists" ->
    // "Our Professionals" copy.
    fireEvent.click(screen.getByLabelText("Select all professionals"));
    expect(screen.getByText("3 selected")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Deactivate selected"));

    await waitFor(() => expect(mockIn).toHaveBeenCalledTimes(1));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });
    // Batched into a single .in() call with all three ids, not three
    // separate row-by-row update calls.
    expect(mockIn.mock.calls[0][0]).toBe("id");
    expect(mockIn.mock.calls[0][1]).toEqual(expect.arrayContaining(["t1", "t2", "t3"]));
    expect(mockIn.mock.calls[0][1]).toHaveLength(3);

    // Optimistic local update reflects the new status, and the bulk bar
    // clears once the action completes.
    await waitFor(() => expect(screen.queryByText("3 selected")).not.toBeInTheDocument());
    expect(screen.getAllByText("Deactivated")).toHaveLength(3);
  });

  it("activating only the selected subset leaves the rest untouched", async () => {
    render(<TherapistsTable therapists={THERAPISTS} />);
    // Only the already-deactivated one.
    fireEvent.click(screen.getByLabelText("Select Yossi Levi"));
    fireEvent.click(screen.getByText("Activate selected"));

    await waitFor(() => expect(mockIn).toHaveBeenCalledTimes(1));
    expect(mockUpdate).toHaveBeenCalledWith({ is_active: true });
    expect(mockIn.mock.calls[0][1]).toEqual(["t3"]);

    await waitFor(() => {
      const row = screen.getByText("Yossi Levi").closest("tr");
      expect(row?.textContent).toContain("Active");
    });
    // The other two, never selected, are unaffected.
    expect(screen.getAllByText("Active")).toHaveLength(3); // Karin, Dana, and now Yossi
  });

  it("shows an error and keeps the selection if the update fails", async () => {
    mockIn.mockResolvedValueOnce({ error: { message: "update failed" } });
    render(<TherapistsTable therapists={THERAPISTS} />);
    fireEvent.click(screen.getByLabelText("Select Karin Horen"));
    fireEvent.click(screen.getByText("Deactivate selected"));

    expect(await screen.findByText(/Couldn't update those professionals/)).toBeInTheDocument();
    // Row still shows its original, unchanged status.
    const row = screen.getByText("Karin Horen").closest("tr");
    expect(row?.textContent).toContain("Active");
  });
});
