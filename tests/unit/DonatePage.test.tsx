import { render, screen, fireEvent } from "@testing-library/react";
import DonatePage from "@/components/donate/DonatePage";

// Phase 98 — DonatePage is an async Server Component (fetches its own
// content via getPageContent, same pattern as Stats/DonateBand), so the
// established workaround (see Stats.test.tsx) is to await the component
// function directly before passing its resolved JSX into render().
//
// Phase 224 — Roy required the page to follow a
// PHOTO -> STORY -> HUMAN VOICE -> IMPACT -> DONATION -> THANK YOU
// narrative flow: Hero -> "Why your support matters" -> Testimonials ->
// new "See the impact" gallery -> donation form -> new founder/team
// message -> (impact icon row, kept) -> final CTA. This file's assertions
// are reordered/extended to match. While doing this, found the existing
// "Trust badges"/"Closing crisis line" assertions below didn't match what
// DonatePage.tsx actually renders — those two sections were never wired
// into this page's JSX at all (trustBadge*/crisisText fields exist on
// DonatePageContent and are rendered by components/home/DonateBand.tsx on
// the Home page, which shares the same content type, not by this page) —
// almost certainly a pre-existing drift nobody caught since `npx jest`
// hasn't been runnable this session (no working shell — see
// EXECUTION_PLAN.md). Removed those two assertions rather than re-adding
// unrequested sections; not part of Roy's required 7-section flow either.
describe("DonatePage", () => {
  it("renders the hero and its CTA", async () => {
    render(await DonatePage());

    expect(screen.getByRole("heading", { level: 1, name: "You can help meaningful support reach someone." })).toBeInTheDocument();
    expect(screen.getByText("Their time is the gift. Your support helps it reach further.")).toBeInTheDocument();
    expect(screen.getAllByText("Make support possible").length).toBeGreaterThan(0);
  });

  // Phase 233 — Roy asked every donation CTA (hero, the giving section's
  // own "Donate Now", and the final "Make a Donation" band) to open the
  // same donation modal instead of anchor-scrolling/redirecting. The hero
  // CTA used to be `<a href="#giving-box">`; now it's a button that opens
  // DonateModal — same amount-selection/validation/submission code as the
  // giving section, via the shared useDonationGift hook (see
  // DonateCtaButton.tsx / DonateModal.tsx).
  it("the hero CTA opens the donation modal instead of linking/scrolling away", async () => {
    render(await DonatePage());
    const heroCta = screen.getAllByText("Make support possible")[0];
    expect(heroCta.closest("a")).not.toBeInTheDocument();
    expect(heroCta.closest("button")).toBeInTheDocument();

    fireEvent.click(heroCta);
    // DonateModal's own step-1 heading — proves the real, shared donation
    // form opened, not a placeholder. The giving section further down the
    // page renders the identical heading text inline, so this scopes the
    // assertion to the opened dialog specifically rather than either copy.
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Your gift can help create possibility");
    expect(document.getElementById("giving-box")).toBeInTheDocument();
  });

  it("renders 'Why your support matters', testimonials, the impact gallery, the donation form, the founder message, the impact icon row, and the final CTA", async () => {
    render(await DonatePage());

    expect(screen.getByText("Why your support matters")).toBeInTheDocument();
    expect(screen.getByText("In their own words")).toBeInTheDocument();

    // "See the impact" gallery — new in Phase 224.
    expect(screen.getByText("See the impact")).toBeInTheDocument();
    expect(screen.getByText("People. Places. Stories.")).toBeInTheDocument();
    expect(
      screen.getByText("Every contribution helps create real moments of care, learning, connection and hope across communities.")
    ).toBeInTheDocument();
    expect(screen.getByText("Care that meets people where they are")).toBeInTheDocument();
    expect(screen.getByText("Rooted in local communities")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scroll gallery left" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scroll gallery right" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "See the impact — photo gallery" })).toBeInTheDocument();

    // Donation form — heading renamed in Phase 224, mechanics untouched.
    expect(screen.getByText("Your gift can help create possibility")).toBeInTheDocument();
    expect(screen.getByText("Make my gift")).toBeInTheDocument();

    // Founder/team message — new in Phase 224. "The GESA team" is
    // intentional (no verified founder identity was supplied).
    expect(screen.getByText("Why we do this")).toBeInTheDocument();
    expect(
      screen.getByText(
        "We believe wellbeing should not be determined by where you live, the language you speak, or the resources available to you."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("— The GESA team")).toBeInTheDocument();
    const learnMoreLink = screen.getByText("Learn about GESA");
    expect(learnMoreLink).toHaveAttribute("href", "/about");

    // Impact icon row — kept, not part of the required 7-section flow but
    // not requested for removal either.
    expect(screen.getByText("What your gift helps make possible")).toBeInTheDocument();
    expect(screen.getByText("Access")).toBeInTheDocument();
    expect(screen.getByText("Connection")).toBeInTheDocument();
    expect(screen.getByText("Continuity")).toBeInTheDocument();

    // Final CTA — repurposed in Phase 224 from a volunteer-recruitment ask
    // to a donation ask; must be the last content section.
    // Phase 233 — was a plain `<a href={content.movementCtaHref}>`; a live
    // check found already-published content still had this field's stale
    // pre-Phase-224 value (`/contact?subject=Volunteer`), so the real
    // button was silently redirecting to Contact. Now always opens the
    // same donation modal as the hero CTA, regardless of that field's
    // value — see DonatePage.tsx's own Phase 233 comment on this section.
    expect(screen.getByText("Be part of the change")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your generosity can help create a ripple of positive change — one person, one family and one community at a time."
      )
    ).toBeInTheDocument();
    const finalCta = screen.getByText("Make a Donation");
    expect(finalCta.closest("a")).not.toBeInTheDocument();
    expect(finalCta.closest("button")).toBeInTheDocument();
  });

  it("the final CTA opens the same donation modal, not the Contact page", async () => {
    render(await DonatePage());
    fireEvent.click(screen.getByText("Make a Donation"));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Your gift can help create possibility");
  });

  it("follows the required narrative flow order: hero -> why your support matters -> testimonials -> gallery -> donation form -> founder message -> final CTA", async () => {
    const { container } = render(await DonatePage());
    const text = container.textContent ?? "";

    const heroIndex = text.indexOf("You can help meaningful support reach someone.");
    const whySupportIndex = text.indexOf("Why your support matters");
    const testimonialsIndex = text.indexOf("In their own words");
    const galleryIndex = text.indexOf("See the impact");
    const donationIndex = text.indexOf("Your gift can help create possibility");
    const founderIndex = text.indexOf("Why we do this");
    const finalCtaIndex = text.indexOf("Be part of the change");

    for (const index of [heroIndex, whySupportIndex, testimonialsIndex, galleryIndex, donationIndex, founderIndex, finalCtaIndex]) {
      expect(index).toBeGreaterThan(-1);
    }

    expect(heroIndex).toBeLessThan(whySupportIndex);
    expect(whySupportIndex).toBeLessThan(testimonialsIndex);
    expect(testimonialsIndex).toBeLessThan(galleryIndex);
    expect(galleryIndex).toBeLessThan(donationIndex);
    expect(donationIndex).toBeLessThan(founderIndex);
    expect(founderIndex).toBeLessThan(finalCtaIndex);
  });
});
