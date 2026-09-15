import { render } from "@testing-library/react";
import SupportGroupsPage from "@/app/support-groups/page";

// Phase 219 — Roy asked for this page's content to move onto Find Support
// (see FindYourTherapistPage.test.tsx for the transferred assertions) and
// this route left intentionally empty, kept live rather than redirected so
// the "Community" nav link and any existing bookmarks still resolve.
describe("SupportGroupsPage", () => {
  it("renders nothing", () => {
    const { container } = render(<SupportGroupsPage />);
    expect(container).toBeEmptyDOMElement();
  });
});
