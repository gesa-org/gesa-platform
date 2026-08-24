import { render, screen } from "@testing-library/react";
import AdminNav from "@/components/admin/AdminNav";

// Phase 60 — AdminNav was split out of app/admin/layout.tsx (a Server
// Component) specifically to highlight the current section, the way Roy's
// reference mockup shows "Overview" highlighted. Exact-matches "/admin" so
// it doesn't also light up for every other /admin/* route (it's a prefix
// of all of them), and prefix-matches everything else.
const items = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/therapists", label: "Therapists" },
];

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

import { usePathname } from "next/navigation";

// The active-item branch's exact class list (see components/admin/AdminNav.tsx)
// — checked as a literal string rather than a loose "bg-card" substring,
// since the *inactive* branch's own hover:bg-card/60 also contains "bg-card".
const ACTIVE_CLASSES = "bg-card text-primary shadow-soft";

describe("AdminNav", () => {
  it("highlights only Overview when on /admin", () => {
    (usePathname as jest.Mock).mockReturnValue("/admin");
    render(<AdminNav items={items} />);

    expect(screen.getByText("Overview").className).toContain(ACTIVE_CLASSES);
    expect(screen.getByText("Therapists").className).not.toContain(ACTIVE_CLASSES);
  });

  it("highlights Therapists (not Overview) on a nested /admin/therapists/[id] route", () => {
    (usePathname as jest.Mock).mockReturnValue("/admin/therapists/some-id");
    render(<AdminNav items={items} />);

    expect(screen.getByText("Therapists").className).toContain(ACTIVE_CLASSES);
    expect(screen.getByText("Overview").className).not.toContain(ACTIVE_CLASSES);
  });
});
