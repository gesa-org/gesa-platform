import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChoiceScreen from "@/components/find-support/ChoiceScreen";

// Phase 184 — regression coverage: "AI Support" used to call
// /api/support-pathway itself (logPathway("ai")) in addition to the row
// MatchWizard separately created on its own mount, producing two orphaned
// support_requests rows for a single click. It must no longer call the API
// at all — MatchWizard's own /api/support-match call is the sole, real
// creation point for that pathway now. The "manual"/"browse" pathways are
// unchanged: they're single-click, terminal actions with nothing left to
// abandon partway, so they still log immediately.
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("ChoiceScreen — pathway logging", () => {
  beforeEach(() => {
    // @ts-expect-error — jsdom has no real fetch.
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ id: "pr-1" }) }));
  });

  it('clicking "AI Support" calls onChooseAi and does not call the API', () => {
    const onChooseAi = jest.fn();
    render(<ChoiceScreen onChooseAi={onChooseAi} onChooseBrowse={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /AI Support/i }));

    expect(onChooseAi).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('clicking "Browse therapist" logs the manual pathway and calls onChooseBrowse', async () => {
    const onChooseBrowse = jest.fn();
    render(<ChoiceScreen onChooseAi={jest.fn()} onChooseBrowse={onChooseBrowse} />);

    fireEvent.click(screen.getByRole("button", { name: /Browse therapist/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const [url, requestInit] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("/api/support-pathway");
    expect(JSON.parse(requestInit.body)).toEqual({ pathway: "manual" });
    expect(onChooseBrowse).toHaveBeenCalledTimes(1);
  });

  // Phase 199 (mobile/a11y pass) — ChoiceScreen's own header "X" (a "skip
  // straight to the directory" shortcut) was removed: it always rendered
  // inside FindSupportModal, directly below that modal's own close button,
  // reading as a duplicate/confusing second close control. The modal's
  // single close button (see FindSupportModal.test.tsx) plus the "Browse
  // therapist" card above are the only ways to leave/proceed from this
  // screen now.
  it("renders exactly one close-looking control (no header 'X')", () => {
    render(<ChoiceScreen onChooseAi={jest.fn()} onChooseBrowse={jest.fn()} />);
    expect(screen.queryByRole("button", { name: /skip and browse/i })).not.toBeInTheDocument();
  });
});
