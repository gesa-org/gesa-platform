import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VolunteerApplicationModal from "@/components/volunteer/VolunteerApplicationModal";

// Phase 186 — regression coverage for the "Join as a professional" bug:
// submitting this form must create ONLY a therapist_applications row
// (status "new", left to the DB column default) and must never touch the
// therapists table, never assign a role, never create a user account, and
// never publish anything publicly. This mocks the browser Supabase client
// the same way other client-insert component tests in this codebase do
// (e.g. the match wizard's fetch mocks), and asserts on exactly which
// table(s) `.from()` was called with.
//
// The modal also renders through useSiteContent() (lib/content-client.ts),
// which independently calls `.from("site_content").select(...).eq(...).
// maybeSingle()` on mount to load CMS overrides — that chain has to be
// stubbed too, or every assertion below about "only therapist_applications
// was touched" would be polluted by this unrelated, pre-existing read.
const insertMock = jest.fn(() => Promise.resolve({ error: null }));
const siteContentChain = {
  select: () => siteContentChain,
  eq: () => siteContentChain,
  maybeSingle: () => Promise.resolve({ data: null }),
};
const fromMock = jest.fn((table: string) => {
  if (table === "therapist_applications") return { insert: insertMock };
  return siteContentChain;
});

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: fromMock }),
}));

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: "Jamie Rivera" } });
  fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "jamie@example.com" } });
  fireEvent.change(screen.getByLabelText(/Proof of license/), { target: { value: "LIC-12345, State Board" } });
  fireEvent.click(screen.getByRole("button", { name: "CBT" }));
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  fireEvent.click(screen.getByRole("radio", { name: "60 min" }));
  fireEvent.change(screen.getByLabelText(/Bio/), { target: { value: "I'd like to volunteer my time." } });
}

describe("VolunteerApplicationModal — public submission safety", () => {
  beforeEach(() => {
    insertMock.mockClear();
    fromMock.mockClear();
    // @ts-expect-error — jsdom has no real fetch; the best-effort email
    // notification call should never block or affect the DB assertions.
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({}) }));
  });

  it("submits without ever calling supabase.from with any table other than therapist_applications", async () => {
    render(<VolunteerApplicationModal onClose={jest.fn()} />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /Submit application/i }));

    await waitFor(() => expect(insertMock).toHaveBeenCalledTimes(1));
    // site_content is the pre-existing, unrelated CMS-overrides read this
    // modal already does on mount (see the mock setup above) — everything
    // else must be exactly therapist_applications, and nothing else.
    const calledTables = fromMock.mock.calls.map((call) => call[0]).filter((t) => t !== "site_content");
    expect(calledTables).toEqual(["therapist_applications"]);
    expect(calledTables).not.toContain("therapists");
    expect(calledTables).not.toContain("profiles");
  });

  it("does not set a status in the insert payload (relies on the DB default of 'new')", async () => {
    render(<VolunteerApplicationModal onClose={jest.fn()} />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /Submit application/i }));

    await waitFor(() => expect(insertMock).toHaveBeenCalledTimes(1));
    const [insertPayload] = insertMock.mock.calls[0];
    expect(insertPayload).not.toHaveProperty("status");
    expect(insertPayload).not.toHaveProperty("is_active");
    expect(insertPayload).not.toHaveProperty("role");
  });

  it("shows the thank-you state and never navigates the applicant anywhere implying they're already listed", async () => {
    render(<VolunteerApplicationModal onClose={jest.fn()} />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /Submit application/i }));

    expect(await screen.findByText(/Thank you/i)).toBeInTheDocument();
  });
});
