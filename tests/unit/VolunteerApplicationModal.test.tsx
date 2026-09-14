import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VolunteerApplicationModal from "@/components/volunteer/VolunteerApplicationModal";

// Phase 189 — rebuilt as a 5-section form (Personal Information,
// Professional Credentials, Availability & Scheduling, Profile Content,
// Legal Consent). Regression coverage carried over from Phase 186 (this
// must only ever touch therapist_applications, never therapists/profiles)
// plus new coverage for the fields this phase added: required photo
// upload, word-counted bio, and the two required legal consents.
//
// PhoneNumberInput is mocked the same way BookingIntakeForm.test.tsx mocks
// it — its real implementation pulls in libphonenumber-js's full country
// table, which isn't the point of this test.
jest.mock("@/components/ui/PhoneNumberInput", () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (e164: string, isValid: boolean) => void }) => (
    <input aria-label="Mobile number" onChange={(e) => onChange(e.target.value, e.target.value.length > 3)} />
  ),
}));

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
const uploadMock = jest.fn(() => Promise.resolve({ error: null }));
const getPublicUrlMock = jest.fn(() => ({ data: { publicUrl: "https://example.com/photo.jpg" } }));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: fromMock,
    storage: { from: () => ({ upload: uploadMock, getPublicUrl: getPublicUrlMock }) },
  }),
}));

// jsdom never actually decodes an image, so `new Image()` + `.src = blobUrl`
// would hang forever waiting for a real onload — this stand-in fires onload
// on the next tick with dimensions that pass the >=500x500 check, the same
// way the real browser would for a real photo.
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 600;
  naturalHeight = 600;
  set src(_value: string) {
    setTimeout(() => this.onload?.(), 0);
  }
}

// Phase 195 — Additional Areas of Expertise / Possible Therapy Languages
// are now MultiSelectCombobox fields (search input + listbox), not checkbox
// grids: type the option's text to filter the open listbox down to it, then
// click the resulting `role="option"` row. The listbox only renders while
// `open` is true, which the combobox sets on focus/typing.
function selectMultiOption(fieldLabel: RegExp, optionText: string) {
  const input = screen.getByLabelText(fieldLabel);
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: optionText } });
  fireEvent.click(screen.getByRole("option", { name: optionText }));
}

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: "Jamie Rivera" } });
  fireEvent.change(screen.getByLabelText(/Gender/), { target: { value: "Female" } });
  fireEvent.change(screen.getByLabelText(/Country/), { target: { value: "Israel" } });
  fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "jamie@example.com" } });
  fireEvent.change(screen.getByLabelText(/Mobile number/), { target: { value: "+15551234567" } });
  fireEvent.change(screen.getByLabelText(/Do you have a certification/), { target: { value: "no" } });
  fireEvent.change(screen.getByLabelText(/Primary Area of Expertise/), { target: { value: "CBT" } });
  // CBT is auto-added to Additional Areas of Expertise by togglePrimary —
  // only the extra pick needs a real selection.
  selectMultiOption(/Additional Areas of Expertise/, "Trauma Support");
  selectMultiOption(/Possible Therapy Languages/, "English");
  fireEvent.change(screen.getByLabelText(/Session\/engagement duration/), { target: { value: "60" } });
  fireEvent.change(screen.getByLabelText(/About \/ bio/), {
    target: { value: Array(90).fill("word").join(" ") },
  });
  fireEvent.click(screen.getByLabelText(/read the Affidavit/));
  fireEvent.click(screen.getByLabelText(/Privacy Policy/));
}

async function uploadPhoto() {
  const file = new File(["fake-image-bytes"], "photo.jpg", { type: "image/jpeg" });
  const input = document.getElementById("volunteer-photo") as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() => expect(uploadMock).toHaveBeenCalledTimes(1));
  await screen.findByText("Replace photo");
}

describe("VolunteerApplicationModal", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const OriginalImage = (global as any).Image;

  beforeEach(() => {
    insertMock.mockClear();
    fromMock.mockClear();
    uploadMock.mockClear();
    // @ts-expect-error — jsdom has no real fetch; the best-effort email
    // notification call should never block or affect the DB assertions.
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({}) }));
    // @ts-expect-error — see MockImage's comment above.
    global.Image = MockImage;
    global.URL.createObjectURL = jest.fn(() => "blob:mock");
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).Image = OriginalImage;
  });

  it("Apply Now stays disabled until every required field, the photo, and both consents are filled in", async () => {
    render(<VolunteerApplicationModal onClose={jest.fn()} />);
    const submitButton = screen.getByRole("button", { name: "Apply Now" });
    expect(submitButton).toBeDisabled();

    fillRequiredFields();
    expect(submitButton).toBeDisabled(); // still no photo

    await uploadPhoto();
    expect(submitButton).not.toBeDisabled();
  });

  it("a bio under 80 words keeps the form disabled and shows the live word counter", () => {
    render(<VolunteerApplicationModal onClose={jest.fn()} />);
    const bio = screen.getByLabelText(/About \/ bio/);
    fireEvent.change(bio, { target: { value: "Too short." } });
    expect(screen.getByText(/2 \/ 80–250 words/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply Now" })).toBeDisabled();
  });

  it("submits only to therapist_applications — never therapists or profiles — and shows the thank-you state", async () => {
    render(<VolunteerApplicationModal onClose={jest.fn()} />);
    fillRequiredFields();
    await uploadPhoto();

    fireEvent.click(screen.getByRole("button", { name: "Apply Now" }));

    await waitFor(() => expect(insertMock).toHaveBeenCalledTimes(1));
    const calledTables = fromMock.mock.calls.map((call) => call[0]).filter((t) => t !== "site_content");
    expect(calledTables).toEqual(["therapist_applications"]);
    expect(calledTables).not.toContain("therapists");
    expect(calledTables).not.toContain("profiles");

    const [insertPayload] = insertMock.mock.calls[0];
    expect(insertPayload).toMatchObject({
      full_name: "Jamie Rivera",
      gender: "Female",
      country: "Israel",
      primary_expertise: "CBT",
      specialties: expect.arrayContaining(["CBT", "Trauma Support"]),
      languages: ["English"],
      meeting_duration: "60",
      photo_url: "https://example.com/photo.jpg",
      consent_affidavit: true,
      consent_privacy_terms: true,
    });
    expect(insertPayload).not.toHaveProperty("status");

    expect(await screen.findByText(/Thank you/i)).toBeInTheDocument();
  });

  it("auto-includes the Primary Area of Expertise in Additional Areas of Expertise", () => {
    render(<VolunteerApplicationModal onClose={jest.fn()} />);
    fireEvent.change(screen.getByLabelText(/Primary Area of Expertise/), { target: { value: "Psychiatry" } });
    // The auto-added value renders as a removable chip in the combobox —
    // its "Remove {label}" button is a unique, unambiguous way to assert
    // the chip exists (plain text would also match the <option> in the
    // Primary Area of Expertise <select> itself).
    expect(screen.getByRole("button", { name: "Remove Psychiatry" })).toBeInTheDocument();
  });

  it("lets an applicant remove a chip and pick it via keyboard (arrow keys + Enter)", () => {
    render(<VolunteerApplicationModal onClose={jest.fn()} />);
    const input = screen.getByLabelText(/Additional Areas of Expertise/);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Art Therapy" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByRole("button", { name: "Remove Art Therapy" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove Art Therapy" }));
    expect(screen.queryByRole("button", { name: "Remove Art Therapy" })).not.toBeInTheDocument();
  });

  it("reveals and requires the 'Other' text field for both combobox fields", () => {
    render(<VolunteerApplicationModal onClose={jest.fn()} />);
    selectMultiOption(/Additional Areas of Expertise/, "Other");
    expect(screen.getByLabelText("Please specify other expertise.")).toBeInTheDocument();

    selectMultiOption(/Possible Therapy Languages/, "Other language");
    expect(screen.getByLabelText("Please specify language.")).toBeInTheDocument();
  });

  it("shows the required inline validation messages for empty expertise/language selections", () => {
    const { container } = render(<VolunteerApplicationModal onClose={jest.fn()} />);
    const form = container.querySelector("form") as HTMLFormElement;

    // Nothing filled in yet — remove the auto-added chip is unnecessary
    // since additionalExpertise starts empty; submitting via a raw form
    // `submit` event (not a click on the disabled Apply Now button) mirrors
    // the "Enter key in a text field" fallback path the component's own
    // validationError comment describes.
    fireEvent.submit(form);
    expect(screen.getByText("Please enter your full name.")).toBeInTheDocument();

    // Fill everything up through Primary Area of Expertise, then remove the
    // auto-added chip so Additional Areas of Expertise is empty again.
    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: "Jamie Rivera" } });
    fireEvent.change(screen.getByLabelText(/Gender/), { target: { value: "Female" } });
    fireEvent.change(screen.getByLabelText(/Country/), { target: { value: "Israel" } });
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "jamie@example.com" } });
    fireEvent.change(screen.getByLabelText(/Mobile number/), { target: { value: "+15551234567" } });
    fireEvent.change(screen.getByLabelText(/Do you have a certification/), { target: { value: "no" } });
    fireEvent.change(screen.getByLabelText(/Primary Area of Expertise/), { target: { value: "CBT" } });
    fireEvent.click(screen.getByRole("button", { name: "Remove CBT" }));
    fireEvent.submit(form);
    expect(screen.getByText("Please select at least one area of expertise.")).toBeInTheDocument();

    // Re-add CBT (auto-adds via the primary select's own change handler —
    // trigger a no-op re-select) and fill languages' prerequisite gap only.
    fireEvent.change(screen.getByLabelText(/Primary Area of Expertise/), { target: { value: "CBT" } });
    fireEvent.submit(form);
    expect(screen.getByText("Please select at least one therapy language.")).toBeInTheDocument();
  });
});
