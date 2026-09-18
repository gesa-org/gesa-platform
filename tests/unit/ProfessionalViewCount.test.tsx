import { render, screen } from "@testing-library/react";
import { ProfessionalViewCount } from "@/components/ProfessionalViewCount";

describe("ProfessionalViewCount", () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    Object.defineProperty(global, "fetch", { configurable: true, value: mockFetch });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockFetch.mockReset();
  });

  it("renders the count only when the protected endpoint confirms ownership", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ therapistId: "professional-1", profileViews: 12 }),
    } as Response);

    render(<ProfessionalViewCount therapistId="professional-1" />);

    expect(await screen.findByLabelText("12 profile views")).toBeInTheDocument();
  });

  it("does not render a count for anonymous visitors or another professional", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ therapistId: "another-professional", profileViews: 12 }),
    } as Response);

    const { container } = render(<ProfessionalViewCount therapistId="professional-1" />);

    await Promise.resolve();
    await Promise.resolve();
    expect(screen.queryByLabelText(/profile views/)).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
