import { Mark, mergeAttributes } from "@tiptap/core";
import TiptapTextStyle from "@tiptap/extension-text-style";

// Phase 136 — the "Font" ribbon group Roy's reference video showed (Word/
// WPS's Home tab): font family, size, color, highlight color, small
// caps/all caps, and superscript/subscript. Tiptap ships an official
// TextStyle + Color + FontFamily set of tiny extensions that all target one
// shared "textStyle" mark, but this project already has @tiptap/extension-
// text-style installed as a transitive dependency (of starter-kit's own
// tree) — rather than adding three more small packages (each is its own
// npm install, and this project got burned twice this week by dependency-
// version surprises: sanitize-html's htmlparser2 dependency broke the
// production build, then broke it again at runtime — see EXECUTION_PLAN.md
// Phase 134/the "Fix 500" thread), every attribute this phase needs is
// added to that same one already-installed TextStyle mark here, in-house,
// with zero new npm installs.
//
// Every attribute renders onto ONE shared `<span style="...">` per Word's
// own mental model ("character formatting" is one bag of properties, not a
// stack of independently nested wrapper elements) — matching exactly how
// Tiptap's own official Color/FontFamily extensions work under the hood
// (they also just extend this same TextStyle mark's attributes).
export const TextStyle = TiptapTextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontFamily: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.fontFamily?.replace(/["']/g, "") || null,
        renderHTML: (attributes: { fontFamily?: string | null }) => {
          if (!attributes.fontFamily) return {};
          return { style: `font-family: ${attributes.fontFamily}` };
        },
      },
      fontSize: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.fontSize || null,
        renderHTML: (attributes: { fontSize?: string | null }) => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
      color: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.color || null,
        renderHTML: (attributes: { color?: string | null }) => {
          if (!attributes.color) return {};
          return { style: `color: ${attributes.color}` };
        },
      },
      backgroundColor: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.backgroundColor || null,
        renderHTML: (attributes: { backgroundColor?: string | null }) => {
          if (!attributes.backgroundColor) return {};
          return { style: `background-color: ${attributes.backgroundColor}` };
        },
      },
      // Word's Font dialog has two related-but-distinct checkboxes here:
      // "Small caps" (a rendering effect — the underlying text is
      // unchanged) and "All caps" (also a rendering effect in Word,
      // *unlike* the ribbon's separate "Aa" Change Case menu, which
      // actually rewrites the letters). Modeled the same way: a single
      // `caps` attribute, CSS-only, non-destructive to the real text.
      caps: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          if (element.style.fontVariant === "small-caps") return "small";
          if (element.style.textTransform === "uppercase") return "all";
          return null;
        },
        renderHTML: (attributes: { caps?: string | null }) => {
          if (attributes.caps === "small") return { style: "font-variant: small-caps" };
          if (attributes.caps === "all") return { style: "text-transform: uppercase" };
          return {};
        },
      },
    };
  },
  // Tiptap's TextStyle.renderHTML merges every attribute's own returned
  // `style` fragment together automatically (its base implementation
  // concatenates each attribute config's renderHTML() output) — no override
  // needed here beyond the per-attribute renderHTML functions above.
});

// Superscript/Subscript — real <sup>/<sub> elements (matching what Word's
// own Font dialog toggles actually produce), not a CSS vertical-align
// approximation. `excludes` mirrors Word's own behavior: text can't be both
// at once, so turning one on turns the other off. Toggled from the toolbar
// via Tiptap's generic built-in `toggleMark('superscript'|'subscript')`
// command — no custom command needed on the extension itself.
export const Superscript = Mark.create({
  name: "superscript",
  excludes: "subscript",
  parseHTML() {
    return [{ tag: "sup" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["sup", mergeAttributes(HTMLAttributes), 0];
  },
});

export const Subscript = Mark.create({
  name: "subscript",
  excludes: "superscript",
  parseHTML() {
    return [{ tag: "sub" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["sub", mergeAttributes(HTMLAttributes), 0];
  },
});
