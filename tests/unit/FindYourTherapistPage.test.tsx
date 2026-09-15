import { render } from "@testing-library/react";
import FindYourTherapistPage from "@/app/find-your-therapist/page";

// Phase 215 — Roy asked for /find-your-therapist to stay live (so existing
// bookmarks/links don't break) but render intentionally empty: no heading,
// no cards, none of the content that moved to /about. The shared header/
// footer/accessibility shell isn't this component's job to prove — that's
// wired globally in app/layout.tsx for every route — this just confirms
// the page's own body renders nothing.
describe("FindYourTherapistPage", () => {
  it("renders nothing", () => {
    const { container } = render(<FindYourTherapistPage />);
    expect(container).toBeEmptyDOMElement();
  });
});
