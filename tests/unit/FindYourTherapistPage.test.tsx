import { render } from "@testing-library/react";
import FindYourTherapistPage from "@/app/find-your-therapist/page";

// Phase 218 — reverting Phase 217 (Roy asked to undo it entirely). This
// route is intentionally empty again — see FindYourTherapistPage's own
// comment, and AboutPage.test.tsx / SupportGroupsPage.test.tsx for the
// content assertions that briefly lived in this file during Phase 217.
describe("FindYourTherapistPage", () => {
  it("renders nothing", () => {
    const { container } = render(<FindYourTherapistPage />);
    expect(container).toBeEmptyDOMElement();
  });
});
