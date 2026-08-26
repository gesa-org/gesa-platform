import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VolunteerApplicationModal from "@/components/volunteer/VolunteerApplicationModal";

// Phase 63 — this replaced the generic Contact form for "Become a volunteer
// therapist" / "Join us as a therapist" / "Volunteer" everywhere on the
// site. Mocks the Supabase client the same way ImageUploadField.test.tsx
// does, plus a mocked global fetch for the best-effort notification email
// call, so no real network happens in the test.
const mockInsert = jest.fn(async () => ({ error: null }));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      insert: mockInsert,
    }),
  }),
}));

function fillRequiredTextFields() {
  fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: "Jamie Rivera" } });
  fireEvent.change(screen.getByLabelText(/Email/), { target: { value: "jamie@example.com" } });
  fireEvent.change(screen.getByLabelText(/Proof of license/), {
    target: { value: "LMFT #12345, State Board of Behavioral Sciences" },
  });
  fireEvent.change(screen.getByLabelText(/Bio/), { target: { value: "Ten years working with couples and families." } });
}

describe("VolunteerApplicationModal", () => {
  beforeEach(() => {
    mockInsert.mockClear();
    // @ts-expect-error — jsdom has no real fetch; the component's
    // post-submit email call is fire-and-forget and best-effort.
    global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
  });

  it("collects the full volunteer profile — name, proof, specialties, languages, meeting duration, bio — not just a generic message", () => {
    render(<VolunteerApplicationModal onClose={jest.fn()} />);
    expect(screen.getByText("Become a volunteer therapist")).toBeInTheDocument();
    expect(screen.getByLabelText(/Full name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Proof of license/)).toBeInTheDocument();
    expect(screen.getByText("Specialties")).toBeInTheDocument();
    expect(screen.getByText("Languages")).toBeInTheDocument();
    expect(screen.getByText("Meeting duration")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "60 min" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "45 min" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "30 min" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Anytime" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Bio/)).toBeInTheDocument();
  });

  it("blocks submit with no specialty selected, even once every other field is filled", () => {
    render(<VolunteerApplicationModal onClose={jest.fn()} />);
    fillRequiredTextFields();
    // Only a language, no specialty.
    fireEvent.click(screen.getByText("English"));
    fireEvent.click(screen.getByText("Submit application"));

    expect(screen.getByText("Please select or add at least one specialty.")).toBeInTheDocument();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("blocks submit with no language selected", () => {
    render(<VolunteerApplicationModal onClose={jest.fn()} />);
    fillRequiredTextFields();
    fireEvent.click(screen.getByText("CBT"));
    fireEvent.click(screen.getByText("Submit application"));

    expect(screen.getByText("Please select or add at least one language.")).toBeInTheDocument();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("blocks submit with no meeting duration selected, even once specialty/language are filled", () => {
    render(<VolunteerApplicationModal onClose={jest.fn()} />);
    fillRequiredTextFields();
    fireEvent.click(screen.getByText("CBT"));
    fireEvent.click(screen.getByText("English"));
    fireEvent.click(screen.getByText("Submit application"));

    expect(screen.getByText("Please select a meeting duration.")).toBeInTheDocument();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("submits the full application to therapist_applications and shows the thank-you state", async () => {
    render(<VolunteerApplicationModal onClose={jest.fn()} />);
    fillRequiredTextFields();
    fireEvent.click(screen.getByText("CBT"));
    fireEvent.click(screen.getByText("Group Sessions"));
    fireEvent.click(screen.getByText("English"));
    fireEvent.click(screen.getByText("Hebrew"));
    fireEvent.click(screen.getByRole("radio", { name: "45 min" }));

    fireEvent.click(screen.getByText("Submit application"));

    await waitFor(() => expect(mockInsert).toHaveBeenCalledTimes(1));
    const payload = mockInsert.mock.calls[0][0];
    expect(payload).toMatchObject({
      full_name: "Jamie Rivera",
      email: "jamie@example.com",
      credentials_proof: "LMFT #12345, State Board of Behavioral Sciences",
      meeting_duration: "45",
      bio: "Ten years working with couples and families.",
    });
    expect(payload.specialties).toEqual(expect.arrayContaining(["CBT", "Group Sessions"]));
    expect(payload.languages).toEqual(expect.arrayContaining(["English", "Hebrew"]));

    // Success state, personalized with the submitted name/email — and it
    // does not silently fail the whole submission if the follow-up email
    // fetch is still pending/fails, since the row is already saved.
    expect(await screen.findByText(/Thank you, Jamie Rivera/)).toBeInTheDocument();
    expect(screen.getByText(/jamie@example.com/)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/email/volunteer-application",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("lets picking a different duration option switch the selection (single-select, not multi)", () => {
    render(<VolunteerApplicationModal onClose={jest.fn()} />);
    const sixty = screen.getByRole("radio", { name: "60 min" });
    const anytime = screen.getByRole("radio", { name: "Anytime" });

    fireEvent.click(sixty);
    expect(sixty).toHaveAttribute("aria-checked", "true");
    expect(anytime).toHaveAttribute("aria-checked", "false");

    fireEvent.click(anytime);
    expect(sixty).toHaveAttribute("aria-checked", "false");
    expect(anytime).toHaveAttribute("aria-checked", "true");
  });

  it("shows an error and stays open if the insert fails", async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: "insert failed" } });
    render(<VolunteerApplicationModal onClose={jest.fn()} />);
    fillRequiredTextFields();
    fireEvent.click(screen.getByText("CBT"));
    fireEvent.click(screen.getByText("English"));
    fireEvent.click(screen.getByRole("radio", { name: "30 min" }));
    fireEvent.click(screen.getByText("Submit application"));

    expect(await screen.findByText(/Something went wrong submitting your application/)).toBeInTheDocument();
    expect(screen.queryByText(/Thank you,/)).not.toBeInTheDocument();
  });
});
