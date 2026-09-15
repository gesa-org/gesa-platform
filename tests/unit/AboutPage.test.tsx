import { render } from "@testing-library/react";
import AboutPage from "@/app/about/page";

// Phase 217 — Roy asked for Find Support's own content (which had briefly
// moved here in Phase 216) to move back to /find-your-therapist, alongside
// the newly-transferred Community content — see FindYourTherapistPage.test
// .tsx for the founders/mission/Community assertions that used to live in
// this file. `/about` is intentionally empty again, same pattern Phase 216
// used for /find-your-therapist at the time.
describe("AboutPage", () => {
  it("renders nothing", () => {
    const { container } = render(<AboutPage />);
    expect(container).toBeEmptyDOMElement();
  });
});
