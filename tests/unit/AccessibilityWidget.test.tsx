import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AccessibilityProvider, { useAccessibility } from "@/components/accessibility/AccessibilityProvider";
import AccessibilityWidget from "@/components/accessibility/AccessibilityWidget";
import { ACCESSIBILITY_STORAGE_KEY } from "@/lib/accessibility/config";

// A minimal consumer used only to assert on the provider's restored state
// directly, rather than through a DOM side effect — simpler and more
// direct than checking document.documentElement's classList for what's
// fundamentally a state-restoration test.
function SettingsProbe() {
  const { settings } = useAccessibility();
  return <div data-testid="settings-probe">{JSON.stringify(settings)}</div>;
}

// Phase 90 — AccessibilityProvider calls the real useTranslation() hook
// (components/TranslationProvider.tsx) so its Language section can drive
// genuine site translation. That provider itself talks to Supabase
// (auth.getUser/profiles) on mount, which isn't relevant to what this file
// tests — mocked here the same way other tests in this suite mock modules
// they depend on but aren't the subject of the test.
let mockLanguage = "en";
const mockSetLanguage = jest.fn((code: string) => {
  mockLanguage = code;
});
jest.mock("@/components/TranslationProvider", () => ({
  useTranslation: () => ({ language: mockLanguage, translating: false, setLanguage: mockSetLanguage }),
}));

let mockPathname = "/";
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

function renderWidget() {
  return render(
    <AccessibilityProvider>
      <main id="main-content" tabIndex={-1}>
        Main content
      </main>
      <footer id="site-footer" tabIndex={-1}>
        Footer content
      </footer>
      <AccessibilityWidget />
    </AccessibilityProvider>
  );
}

describe("AccessibilityWidget", () => {
  beforeEach(() => {
    mockLanguage = "en";
    mockSetLanguage.mockClear();
    mockPathname = "/";
    window.localStorage.clear();
  });

  it("renders the launcher with an accessible label and opens/closes the panel on click", () => {
    renderWidget();
    const launcher = screen.getByRole("button", { name: "Accessibility options" });
    expect(launcher).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(launcher);
    expect(screen.getByRole("dialog", { name: "Accessibility Adjustments" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close accessibility toolbar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the launcher", () => {
    renderWidget();
    const launcher = screen.getByRole("button", { name: "Accessibility options" });
    fireEvent.click(launcher);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(launcher).toHaveFocus();
  });

  it("does not render on /admin routes", () => {
    mockPathname = "/admin";
    renderWidget();
    expect(screen.queryByRole("button", { name: "Accessibility options" })).not.toBeInTheDocument();
  });

  it("persists a content-module setting to localStorage and applies it to <html>", () => {
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: "Accessibility options" }));
    // "Increase" appears twice (Font Size and Line Height each have their
    // own 3-way segmented control) — Font Size renders first.
    fireEvent.click(screen.getAllByRole("button", { name: "Increase" })[0]);

    expect(document.documentElement.getAttribute("data-a11y-font-size")).toBe("increase");
    const stored = JSON.parse(window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY) || "{}");
    expect(stored.content.fontSize).toBe("increase");
  });

  it("restores a persisted setting on the next mount", () => {
    window.localStorage.setItem(
      ACCESSIBILITY_STORAGE_KEY,
      JSON.stringify({
        language: "en",
        content: { fontSize: "default", readableFont: true, lineHeight: "default", bigCursor: false, letterSpacing: false, alignText: false, fontWeight: false },
        colorMode: "default",
        orientation: { readingLine: false, readingMask: false, hideImages: false, highlightContent: false, stopAnimations: false, highlightLinks: false },
      })
    );

    render(
      <AccessibilityProvider>
        <SettingsProbe />
      </AccessibilityProvider>
    );
    const restored = JSON.parse(screen.getByTestId("settings-probe").textContent || "{}");
    expect(restored.content.readableFont).toBe(true);
  });

  it("keeps color modes mutually exclusive", () => {
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: "Accessibility options" }));
    fireEvent.click(screen.getByRole("radio", { name: "High Contrast" }));
    expect(document.documentElement.getAttribute("data-a11y-color-mode")).toBe("high-contrast");

    fireEvent.click(screen.getByRole("radio", { name: "Monochrome" }));
    expect(document.documentElement.getAttribute("data-a11y-color-mode")).toBe("monochrome");
  });

  it("moves focus to Main Content and announces it via Skip To Content", async () => {
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: "Accessibility options" }));

    fireEvent.change(screen.getByLabelText("Skip to content"), { target: { value: "main" } });

    await waitFor(() => expect(document.getElementById("main-content")).toHaveFocus());
    expect(await screen.findByText("Moved to main content")).toBeInTheDocument();
  });

  it("reset clears every setting, localStorage, and announces completion", () => {
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: "Accessibility options" }));
    // "Increase" appears twice (Font Size and Line Height each have their
    // own 3-way segmented control) — Font Size renders first.
    fireEvent.click(screen.getAllByRole("button", { name: "Increase" })[0]);
    fireEvent.click(screen.getByRole("radio", { name: "High Contrast" }));
    expect(window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY)).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Reset Settings" }));

    expect(document.documentElement.getAttribute("data-a11y-font-size")).toBe("default");
    expect(document.documentElement.getAttribute("data-a11y-color-mode")).toBeNull();
    expect(window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY)).toBeNull();
    expect(screen.getByText("Accessibility settings have been reset")).toBeInTheDocument();
  });
});
