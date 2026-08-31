import { render, screen } from "@testing-library/react";
import Header from "@/components/Header";
import TranslationProvider from "@/components/TranslationProvider";

// Phase 98 — the header CTA changed from "JOIN GESA" (opened the volunteer
// application modal) to "DONATE" (a real link to the new /donate page).
// donateHref is no longer VolunteerPrimaryCta's recognized "open the modal"
// default, so this must render as a plain link, not a button. Wrapped in
// TranslationProvider since Header's LanguageSelector calls useTranslation()
// and throws outside that context — the same provider app/layout.tsx always
// wraps Header in. AuthStatus and NotificationBell are stubbed out — both
// make their own real Supabase calls unrelated to this test's concern (the
// Donate CTA), and there are no fake env vars in this test run; stubbing
// them avoids unrelated network/env noise the same way AboutPage.test.tsx
// stubs out the unrelated async DonateBand.
jest.mock("@/components/AuthStatus", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/admin/NotificationBell", () => ({ __esModule: true, default: () => null }));

// TranslationProvider itself also calls createClient() on mount (to check a
// signed-in user's saved language preference) — mocked the same way, since
// there are no fake Supabase env vars in this test run.
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
    }),
  }),
}));
describe("Header", () => {
  it("renders a DONATE link to /donate, not a volunteer-modal button", () => {
    render(
      <TranslationProvider>
        <Header />
      </TranslationProvider>
    );
    const donateLink = screen.getByRole("link", { name: /donate/i });
    expect(donateLink).toHaveAttribute("href", "/donate");
  });
});
