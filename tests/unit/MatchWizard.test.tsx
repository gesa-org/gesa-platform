import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MatchWizard from "@/components/match/MatchWizard";

// Phase 184 — regression coverage for the duplicate/premature support_requests
// row bug: MatchWizard used to create a row the instant it mounted (a
// useEffect POSTing to /api/support-pathway), before the client had answered
// a single question. Combined with ChoiceScreen.tsx also logging its own row
// for the same "AI Support" click, one click produced two orphaned CRM rows
// with status "started" and blank data. The fix: no request is created until
// the client actually reaches the end of the wizard and submits — the first
// real call is to /api/support-match, and it both creates and returns the
// support_requests row's id in one step. See EXECUTION_PLAN.md Phase 184.

// StepMatches pulls in BookSessionButton, which talks to a diary/calendar
// popup flow that isn't the point of this test — mocked the same way
// BookingIntakeForm.test.tsx mocks PhoneNumberInput.
jest.mock("@/components/therapists/BookSessionButton", () => ({
  __esModule: true,
  default: () => <div data-testid="book-session-button" />,
}));

function goThroughToFeelings() {
  // Step 0 — Preferences: every field optional, "Continue" is never disabled.
  fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
  // Step 1 — Format & Location: "See my matches" stays disabled until a
  // format is chosen.
  fireEvent.click(screen.getByRole("button", { name: "Online" }));
  fireEvent.click(screen.getByRole("button", { name: /See my matches/i }));
  // Step 2 — Feelings.
}

describe("MatchWizard — support_requests creation timing", () => {
  beforeEach(() => {
    // @ts-expect-error — jsdom has no real fetch.
    global.fetch = jest.fn((url: string) => {
      if (url === "/api/support-match") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            supportRequestId: "sr-1",
            matches: [],
            genderPreferenceHonored: true,
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  });

  it("does not call any API on mount", () => {
    render(<MatchWizard clinicLocations={[]} />);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("does not call any API while stepping through Preferences and Format & Location", () => {
    render(<MatchWizard clinicLocations={[]} />);
    goThroughToFeelings();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("creates the support_requests row exactly once, via /api/support-match, only when the client submits from the Feelings step", async () => {
    render(<MatchWizard clinicLocations={[]} />);
    goThroughToFeelings();

    fireEvent.click(screen.getByRole("button", { name: /AI Support Match/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const [url, requestInit] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("/api/support-match");
    const body = JSON.parse(requestInit.body);
    // First submission — no existing row, so the route is asked to create one.
    expect(body.supportRequestId).toBeNull();
  });

  it("reuses the supportRequestId returned by /api/support-match on any later request instead of creating a second row", async () => {
    render(<MatchWizard clinicLocations={[]} />);
    goThroughToFeelings();
    fireEvent.click(screen.getByRole("button", { name: /AI Support Match/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    // Simulate going back and resubmitting (e.g. the client adjusts an
    // answer and re-runs the match) — the second call must carry the id
    // the first call returned, not null.
    fireEvent.click(screen.getByRole("button", { name: /Back/i }));
    fireEvent.click(screen.getByRole("button", { name: /AI Support Match/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    const [, secondRequestInit] = (global.fetch as jest.Mock).mock.calls[1];
    const secondBody = JSON.parse(secondRequestInit.body);
    expect(secondBody.supportRequestId).toBe("sr-1");
  });

  it("a rapid double-click on the submit button results in only one /api/support-match call", async () => {
    render(<MatchWizard clinicLocations={[]} />);
    goThroughToFeelings();

    const submitButton = screen.getByRole("button", { name: /AI Support Match/i });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });
});
