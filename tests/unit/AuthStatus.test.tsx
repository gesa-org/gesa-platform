import { render, screen, waitFor } from "@testing-library/react";

// Phase 214 — Roy asked for "Sign In" removed from the public header
// entirely (account access now lives in the footer's "Sign In / Create
// Account" link instead — see Footer.test.tsx). This confirms the signed-
// out state renders nothing at all (no visible "Sign In" text/link
// anywhere), while the signed-in "Account" menu — the part that must keep
// working — is untouched.
function mockSupabase(user: { id: string; email: string } | null, role: string | null = null) {
  return {
    auth: {
      getUser: async () => ({ data: { user } }),
      onAuthStateChange: (_cb: unknown) => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: role ? { role } : null } as { data: { role: string } | null }) }),
      }),
    }),
  };
}

describe("AuthStatus", () => {
  it("renders nothing (no 'Sign In' text) when signed out", async () => {
    jest.resetModules();
    jest.doMock("@/lib/supabase/client", () => ({ createClient: () => mockSupabase(null) }));
    const { default: AuthStatusFresh } = await import("@/components/AuthStatus");
    const { container } = render(<AuthStatusFresh />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument();
  });

  it("still renders the Account menu when signed in", async () => {
    jest.resetModules();
    jest.doMock("@/lib/supabase/client", () => ({
      createClient: () => mockSupabase({ id: "user-1", email: "person@example.com" }, "client"),
    }));
    const { default: AuthStatusFresh } = await import("@/components/AuthStatus");
    render(<AuthStatusFresh />);

    await waitFor(() => expect(screen.getByLabelText("Account menu")).toBeInTheDocument());
  });
});
