import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "@/components/ui/Button";

describe("Button", () => {
  it("renders as a link when href is provided", () => {
    render(<Button href="/contact">Contact us</Button>);
    const link = screen.getByRole("link", { name: "Contact us" });
    expect(link).toHaveAttribute("href", "/contact");
  });

  it("renders as a button and fires onClick when no href is provided", async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Send message</Button>);
    const button = screen.getByRole("button", { name: "Send message" });
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies block width class when block is set", () => {
    render(<Button block>Submit</Button>);
    expect(screen.getByRole("button")).toHaveClass("w-full");
  });
});
