import { render, screen } from "@testing-library/react";
import EditorPreviewBridge from "@/components/ui-builder/public/EditorPreviewBridge";
import EditableText from "@/components/ui-builder/public/EditableText";

// Regression test for the "Edit mode: On is unreliable" bug report: the
// vast majority of registered contentIds (every Header/Footer nav link,
// every CTA label) render their <EditableText> span *inside* an <a>. The
// root cause was EditorPreviewBridge's document-level capture-phase click
// listener calling `event.stopPropagation()` unconditionally whenever the
// click landed inside an `a`/`button[type=submit]`/`form` — a capture-phase
// stopPropagation() halts the ENTIRE remaining dispatch path (including the
// bubble phase back up through the actual target), so EditableText's own
// bubble-phase onClick (which posts the GESA_EDITOR_SELECT_ELEMENT message)
// never ran for any field nested in a link/button, while a field sitting in
// a plain <span> worked fine — exactly the "some texts respond, some don't"
// symptom, not a per-page bug. Fixed by only stopping propagation when the
// click did NOT land on a registered editable field; preventDefault() alone
// (still called unconditionally) is what actually blocks real navigation.
function dispatchEditModeOn() {
  window.dispatchEvent(
    new MessageEvent("message", {
      data: { type: "GESA_EDITOR_SET_EDIT_MODE", enabled: true },
      origin: window.location.origin,
    })
  );
}

describe("EditorPreviewBridge + EditableText click-to-select", () => {
  it("selects an EditableText field nested inside a real <a> link, without navigating", async () => {
    const postMessageSpy = jest.spyOn(window, "postMessage");

    render(
      <EditorPreviewBridge>
        <a href="/somewhere">
          <EditableText contentId="test.link.label" label="Test link label" value="Click me" as="span" />
        </a>
      </EditorPreviewBridge>
    );

    // GESA_EDITOR_READY fires on mount — clear that call so the assertion
    // below only looks at what the click itself produces.
    postMessageSpy.mockClear();

    dispatchEditModeOn();

    const link = screen.getByRole("link", { name: "Click me" });
    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(clickEvent);

    // The click-to-select message must have gone out — this is exactly the
    // call that silently never happened before the fix, since the outer
    // capture listener stopped propagation before EditableText's own
    // onClick could run.
    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "GESA_EDITOR_SELECT_ELEMENT", contentId: "test.link.label" }),
      window.location.origin
    );

    // Real navigation must still never happen inside the preview.
    expect(clickEvent.defaultPrevented).toBe(true);

    postMessageSpy.mockRestore();
  });

  it("still blocks a plain (non-editable) link from navigating, edit mode on or off", () => {
    render(
      <EditorPreviewBridge>
        <a href="/somewhere">Plain decorative link</a>
      </EditorPreviewBridge>
    );

    const link = screen.getByRole("link", { name: "Plain decorative link" });
    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(clickEvent);

    expect(clickEvent.defaultPrevented).toBe(true);
  });
});
