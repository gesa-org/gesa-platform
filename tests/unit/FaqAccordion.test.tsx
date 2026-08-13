import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FaqAccordion from "@/components/FaqAccordion";
import type { Tables } from "@/lib/database.types";

const faqs: Tables<"faqs">[] = [
  { id: "1", question: "Who can use GESA?", answer: "Anyone 18 or older.", sort: 1 },
  { id: "2", question: "Is this therapy?", answer: "It is professional emotional support.", sort: 2 },
];

describe("FaqAccordion", () => {
  it("shows the first answer expanded by default", () => {
    render(<FaqAccordion faqs={faqs} />);
    expect(screen.getByText("Anyone 18 or older.")).toBeVisible();
    expect(screen.queryByText("It is professional emotional support.")).not.toBeInTheDocument();
  });

  it("expands a different question on click and collapses the previous one", async () => {
    render(<FaqAccordion faqs={faqs} />);
    await userEvent.click(screen.getByRole("button", { name: "Is this therapy?" }));

    expect(screen.getByText("It is professional emotional support.")).toBeVisible();
    expect(screen.queryByText("Anyone 18 or older.")).not.toBeInTheDocument();
  });

  it("collapses the open question when clicked again", async () => {
    render(<FaqAccordion faqs={faqs} />);
    const first = screen.getByRole("button", { name: "Who can use GESA?" });
    await userEvent.click(first);
    expect(screen.queryByText("Anyone 18 or older.")).not.toBeInTheDocument();
  });
});
