import { render, screen, fireEvent, within } from "@testing-library/react";
import CountrySelector from "@/components/crisis/CountrySelector";
import CrisisResourceList from "@/components/crisis/CrisisResourceList";
import { getResourcesForCountry, hasVerifiedResources, toTelHref, toSmsHref } from "@/lib/crisisResources";

// Phase 169 — covers the new country-based crisis resources feature:
// lib/crisisResources.ts's lookup/formatting helpers, and the two
// components built on top of it (CountrySelector, CrisisResourceList).
// Note: this suite could not be executed in this sandbox (npx jest hangs
// indefinitely here — a standing limitation noted throughout
// EXECUTION_PLAN.md); it's written to the same conventions as the rest of
// tests/unit and should be run for real in CI/locally before merging.

describe("crisisResources data layer", () => {
  it("US selection returns only US resources, emergency first", () => {
    const resources = getResourcesForCountry("US");
    expect(resources.length).toBeGreaterThan(0);
    expect(resources.every((r) => r.countryCode === "US")).toBe(true);
    expect(resources[0].serviceType).toBe("emergency");
    // Guards against the exact bug this feature replaces: no non-US
    // resource should ever appear in a US lookup.
    expect(resources.some((r) => r.serviceName.includes("Samaritans"))).toBe(false);
  });

  it("non-US selections never leak US-only numbers like 911/988/741741", () => {
    const nonUsCodes = ["GB", "DE", "JP", "BR", "IN"];
    for (const code of nonUsCodes) {
      const resources = getResourcesForCountry(code);
      const phones = resources.map((r) => r.phone).filter(Boolean);
      const smsNumbers = resources.map((r) => r.smsNumber).filter(Boolean);
      expect(phones).not.toContain("911");
      expect(phones).not.toContain("988");
      expect(smsNumbers).not.toContain("741741");
    }
  });

  it("an unverified/unknown country code returns no resources", () => {
    expect(getResourcesForCountry("ZZ")).toEqual([]);
    expect(hasVerifiedResources("ZZ")).toBe(false);
    expect(hasVerifiedResources("US")).toBe(true);
  });

  it("toTelHref produces a valid tel: link stripped of formatting", () => {
    expect(toTelHref("988")).toBe("tel:988");
    expect(toTelHref("116 123")).toBe("tel:116123");
    expect(toTelHref("+91 9999 666 555")).toBe("tel:+919999666555");
  });

  it("toSmsHref includes the keyword as the message body when present", () => {
    expect(toSmsHref("741741", "HOME")).toBe("sms:741741?body=HOME");
    expect(toSmsHref("988", null)).toBe("sms:988");
  });
});

describe("CrisisResourceList", () => {
  it("shows the neutral prompt before any country is selected", () => {
    render(<CrisisResourceList countryCode={null} />);
    expect(screen.getByText(/select your country or region to find verified/i)).toBeInTheDocument();
  });

  it("renders US-specific cards when US is selected", () => {
    render(<CrisisResourceList countryCode="US" />);
    expect(screen.getByText("988 Suicide & Crisis Lifeline")).toBeInTheDocument();
    expect(screen.getByText("Crisis Text Line")).toBeInTheDocument();
    expect(screen.queryByText("Samaritans")).not.toBeInTheDocument();
  });

  it("swaps resources when the country changes (re-render with a new countryCode)", () => {
    const { rerender } = render(<CrisisResourceList countryCode="US" />);
    expect(screen.getByText("988 Suicide & Crisis Lifeline")).toBeInTheDocument();

    rerender(<CrisisResourceList countryCode="GB" />);
    expect(screen.queryByText("988 Suicide & Crisis Lifeline")).not.toBeInTheDocument();
    expect(screen.getByText("Samaritans")).toBeInTheDocument();
  });

  it("shows the safe fallback state for a country with no verified data, and never a guessed number", () => {
    render(<CrisisResourceList countryCode="ZZ" />);
    expect(screen.getByText(/couldn't verify a local crisis line/i)).toBeInTheDocument();
    expect(screen.getByText(/call your local emergency number now/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /find a helpline worldwide/i })).toHaveAttribute(
      "href",
      "https://www.befrienders.org/"
    );
  });

  it("phone-first cards use a valid tel: href", () => {
    render(<CrisisResourceList countryCode="US" />);
    const link = screen.getByRole("link", { name: /988 suicide & crisis lifeline/i });
    expect(link).toHaveAttribute("href", "tel:988");
  });
});

describe("CountrySelector", () => {
  it("is keyboard operable: opens on ArrowDown, moves selection, selects on Enter", () => {
    const onChange = jest.fn();
    render(<CountrySelector value={null} onChange={onChange} />);
    const input = screen.getByRole("combobox", { name: /select your country or region/i });

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("filters options as the user types (searchable)", () => {
    const onChange = jest.fn();
    render(<CountrySelector value={null} onChange={onChange} />);
    const input = screen.getByRole("combobox", { name: /select your country or region/i });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Ireland" } });

    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getByText("Ireland")).toBeInTheDocument();
    expect(within(listbox).queryByText("Germany")).not.toBeInTheDocument();
  });

  it("closes and reports the selected code when an option is chosen", () => {
    const onChange = jest.fn();
    render(<CountrySelector value={null} onChange={onChange} />);
    const input = screen.getByRole("combobox", { name: /select your country or region/i });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "United States" } });
    fireEvent.mouseDown(screen.getByText("United States"));
    expect(onChange).toHaveBeenCalledWith("US");
  });

  it("closes on Escape without changing the selection", () => {
    const onChange = jest.fn();
    render(<CountrySelector value="US" onChange={onChange} />);
    const input = screen.getByRole("combobox", { name: /select your country or region/i });
    fireEvent.focus(input);
    expect(input).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(onChange).not.toHaveBeenCalled();
  });
});
