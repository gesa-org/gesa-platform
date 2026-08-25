import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ImageUploadField from "@/components/admin/content/ImageUploadField";

// Phase 62 — Roy asked for the Content Manager to let admins actually
// attach a picture (not just paste a URL) wherever a section has an image
// field, starting with "Our Founders." This is the shared upload control
// every such field now uses. Mocks the Supabase client the same way the
// upload flow, so no real network/storage call happens in the test.
const mockUpload = jest.fn(async () => ({ error: null }));
const mockGetPublicUrl = jest.fn(() => ({ data: { publicUrl: "https://cdn.example.com/site-content-images/founders/0-123.jpg" } }));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}));

function makeFile() {
  return new File(["fake-image-bytes"], "photo.jpg", { type: "image/jpeg" });
}

describe("ImageUploadField", () => {
  beforeEach(() => {
    mockUpload.mockClear();
    mockGetPublicUrl.mockClear();
  });

  it("shows 'No image' with no value, and an Upload button", () => {
    render(<ImageUploadField label="Photo" value="" onChange={jest.fn()} pathPrefix="founders/0" />);
    expect(screen.getByText("No image")).toBeInTheDocument();
    expect(screen.getByText("Upload image")).toBeInTheDocument();
  });

  it("uploads a selected file to the site-content-images bucket and reports back the public URL", async () => {
    const onChange = jest.fn();
    render(<ImageUploadField label="Photo" value="" onChange={onChange} pathPrefix="founders/0" />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile()] } });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("https://cdn.example.com/site-content-images/founders/0-123.jpg"));
    expect(mockUpload).toHaveBeenCalledTimes(1);
    // Path is scoped under the given pathPrefix so different fields never
    // collide/overwrite each other in the shared bucket.
    expect(mockUpload.mock.calls[0][0]).toMatch(/^founders\/0\//);
  });

  it("shows a preview and a Remove control once a value is set, and Remove clears it", () => {
    const onChange = jest.fn();
    render(
      <ImageUploadField label="Photo" value="https://cdn.example.com/existing.jpg" onChange={onChange} pathPrefix="founders/0" />
    );
    expect(screen.getByText("Replace image")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Remove"));
    expect(onChange).toHaveBeenCalledWith("");
  });
});
