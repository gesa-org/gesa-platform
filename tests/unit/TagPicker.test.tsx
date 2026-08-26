import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import TagPicker from "@/components/ui/TagPicker";

// Phase 63 — built for the volunteer therapist application's
// Specialties/Languages fields (curated quick-picks + unlimited custom
// additions). A small controlled wrapper is used here since TagPicker
// itself is a pure controlled component (selected/onChange are props).
function Wrapper({ options }: { options: string[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  return <TagPicker label="Languages" options={options} selected={selected} onChange={setSelected} required />;
}

// The unselected-chip class includes "hover:border-primary-600", which
// contains the substring "border-primary" too — so assertions below check
// for this exact selected-state string rather than a loose substring, the
// same fix used earlier this session for AdminNav.test.tsx's active-link
// class check.
const SELECTED_CLASSES = "border-primary bg-accent-soft text-primary";

describe("TagPicker", () => {
  it("toggles a curated option on and off", () => {
    render(<Wrapper options={["English", "Hebrew"]} />);
    const english = screen.getByText("English");
    fireEvent.click(english);
    expect(english.className).toContain(SELECTED_CLASSES);
    fireEvent.click(english);
    expect(english.className).not.toContain(SELECTED_CLASSES);
  });

  it("adds an unlimited custom tag not in the curated list, and can remove it", () => {
    render(<Wrapper options={["English", "Hebrew"]} />);
    const input = screen.getByPlaceholderText("Add another…");
    fireEvent.change(input, { target: { value: "Klingon" } });
    fireEvent.click(screen.getByText("Add"));

    expect(screen.getByText("Klingon")).toBeInTheDocument();
    // Input clears after adding, ready for the next custom tag — there's no
    // cap on how many can be added.
    expect(input).toHaveValue("");

    fireEvent.click(screen.getByLabelText("Remove Klingon"));
    expect(screen.queryByText("Klingon")).not.toBeInTheDocument();
  });

  it("adds a custom tag on Enter as well as the Add button", () => {
    render(<Wrapper options={["English"]} />);
    const input = screen.getByPlaceholderText("Add another…");
    fireEvent.change(input, { target: { value: "Amharic" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("Amharic")).toBeInTheDocument();
  });

  it("typing a curated option's name selects that chip instead of adding a duplicate", () => {
    render(<Wrapper options={["English"]} />);
    const input = screen.getByPlaceholderText("Add another…");
    fireEvent.change(input, { target: { value: "english" } });
    fireEvent.click(screen.getByText("Add"));
    // Still just the one curated "English" chip, now selected — no separate
    // look-alike custom chip was created alongside it.
    expect(screen.getAllByText(/^english$/i).length).toBe(1);
    expect(screen.getByText("English").className).toContain(SELECTED_CLASSES);

    // Typing it again is a true no-op (already selected).
    fireEvent.change(input, { target: { value: "English" } });
    fireEvent.click(screen.getByText("Add"));
    expect(screen.getAllByText(/^english$/i).length).toBe(1);
  });
});
