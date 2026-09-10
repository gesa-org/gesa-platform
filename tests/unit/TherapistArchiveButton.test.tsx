import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TherapistArchiveButton from "@/components/admin/TherapistArchiveButton";

// Phase 186 — regression coverage for the "Delete" action in CRM > Our
// Professionals: clicking it must never delete anything immediately — it
// has to show a confirmation modal naming the therapist, and (per the
// spec) offer a third, extra choice when the profile has a linked account
// instead of a plain single confirm.
describe("TherapistArchiveButton", () => {
  beforeEach(() => {
    // @ts-expect-error — jsdom has no real fetch.
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ ok: true }) }));
  });

  it("does not call the archive API on click — only opens a confirmation modal naming the therapist", () => {
    render(<TherapistArchiveButton id="t-1" fullName="Dana Cohen" hasLinkedAccount={false} onArchived={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Dana Cohen" }));

    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.getByText("Delete Dana Cohen?")).toBeInTheDocument();
    expect(screen.getByText(/immediately from the public Our Professionals page/i)).toBeInTheDocument();
  });

  it("with no linked account: shows a single destructive confirm that archives on explicit click", async () => {
    const onArchived = jest.fn();
    render(<TherapistArchiveButton id="t-1" fullName="Dana Cohen" hasLinkedAccount={false} onArchived={onArchived} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete Dana Cohen" }));

    expect(screen.queryByText(/linked sign-in account/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Delete Professional/ }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/therapists/archive",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ id: "t-1", mode: "archive_only" }),
      })
    ));
    expect(onArchived).toHaveBeenCalledWith("t-1");
  });

  it("with a linked account: warns and offers archive-only vs. deactivate-and-archive as separate choices", async () => {
    const onArchived = jest.fn();
    render(<TherapistArchiveButton id="t-2" fullName="Sam Lee" hasLinkedAccount={true} onArchived={onArchived} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete Sam Lee" }));

    expect(screen.getByText(/linked sign-in account/i)).toBeInTheDocument();
    const archiveOnlyBtn = screen.getByRole("button", { name: "Archive profile only" });
    const deactivateBtn = screen.getByRole("button", { name: /Deactivate account and archive profile/ });
    expect(archiveOnlyBtn).toBeInTheDocument();
    expect(deactivateBtn).toBeInTheDocument();

    fireEvent.click(deactivateBtn);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/therapists/archive",
      expect.objectContaining({
        body: JSON.stringify({ id: "t-2", mode: "archive_and_deactivate_account" }),
      })
    ));
    expect(onArchived).toHaveBeenCalledWith("t-2");
  });

  it("Cancel closes the modal without calling the API", () => {
    render(<TherapistArchiveButton id="t-1" fullName="Dana Cohen" hasLinkedAccount={false} onArchived={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete Dana Cohen" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText("Delete Dana Cohen?")).not.toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
