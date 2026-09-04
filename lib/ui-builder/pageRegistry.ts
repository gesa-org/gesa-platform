// Phase 133 — the Visual Page Editor's page/content-ID registry. This is
// the "structured page schema" the spec calls for, in place of brittle DOM
// selectors/indexes/text-matching: every editable field on a supported page
// has one stable, hand-assigned content ID (e.g. "home.hero.heading") that
// never changes even if the visual layout around it does.
//
// Deliberately a static, code-defined registry rather than a new DB table
// (`ui_builder_page_definitions`, as the original spec sketched) — this
// app's existing Content Manager already defines every page's editable
// shape as a TypeScript type in lib/content.ts (e.g. `HomeContent`), not as
// database rows, and duplicating that as a second, DB-driven definition
// system would create two competing sources of truth for "what fields does
// Home have." This registry is additive metadata (friendly labels,
// grouping for the Layers panel, per-field max length) layered over the
// content shape that already exists, not a replacement for it.
export type PageGroup = "core" | "support" | "legal" | "system";

export type PageDefinition = {
  pageKey: string;
  route: string;
  title: string;
  group: PageGroup;
  /** Only "home" is wired to the visual editor this phase — every other
   * page still gets full value from the existing text-field Content
   * Manager, just not the click-to-select canvas yet. Per the spec's own
   * "If the page is unsupported for visual editing, display a clear
   * message and allow global styling only" — this flag drives exactly that
   * branch in the Page Editor UI. */
  supportsVisualEditor: boolean;
  /** The site_content key this page's published content lives under
   * (unchanged from the existing Content Manager — see lib/content.ts). */
  siteContentKey: string;
};

export const PAGE_DEFINITIONS: PageDefinition[] = [
  { pageKey: "home", route: "/", title: "Home", group: "core", supportsVisualEditor: true, siteContentKey: "page_home" },
  { pageKey: "about", route: "/about", title: "About", group: "core", supportsVisualEditor: false, siteContentKey: "page_about" },
  { pageKey: "therapists", route: "/therapists", title: "Our Professionals", group: "core", supportsVisualEditor: false, siteContentKey: "page_therapists" },
  { pageKey: "support-groups", route: "/support-groups", title: "Community", group: "core", supportsVisualEditor: false, siteContentKey: "page_support_groups" },
  { pageKey: "donate", route: "/donate", title: "Donate", group: "core", supportsVisualEditor: false, siteContentKey: "page_donate" },
  { pageKey: "intake", route: "/intake", title: "Find Support / Intake", group: "core", supportsVisualEditor: false, siteContentKey: "page_intake" },
  { pageKey: "faq", route: "/faq", title: "FAQ", group: "support", supportsVisualEditor: false, siteContentKey: "page_faq" },
  { pageKey: "contact", route: "/contact", title: "Contact", group: "support", supportsVisualEditor: false, siteContentKey: "page_contact" },
  { pageKey: "privacy-policy", route: "/privacy-policy", title: "Privacy Policy", group: "legal", supportsVisualEditor: false, siteContentKey: "page_privacy_policy" },
  { pageKey: "terms-and-conditions", route: "/terms-and-conditions", title: "Terms & Conditions", group: "legal", supportsVisualEditor: false, siteContentKey: "page_terms" },
  { pageKey: "accessibility-statement", route: "/accessibility-statement", title: "Accessibility Statement", group: "legal", supportsVisualEditor: false, siteContentKey: "page_accessibility_statement" },
];

export function getPageDefinition(pageKey: string): PageDefinition | undefined {
  return PAGE_DEFINITIONS.find((p) => p.pageKey === pageKey);
}

// Phase 134 — replaces Phase 133's "text"/"textarea" UI-shape distinction
// with the content-*meaning* the spec asked for. "plainText"/"heading"/
// "ctaLabel" all render the existing compact single-line input (no
// formatting toolbar, no HTML ever allowed in the value — enforced by
// stripAllHtml() at the API layer); "richText" is the only type that gets
// the new Word-style toolbar + Tiptap editor and is allowed to persist
// sanitized HTML. "url"/"image" are declared for forward compatibility
// (CTA destination editing and image fields are still deferred — see
// EXECUTION_PLAN.md Phase 133/134's "left out" notes) but no field uses
// them yet.
export type ContentFieldType = "plainText" | "richText" | "heading" | "ctaLabel" | "url" | "image";

export type EditableFieldDef = {
  contentId: string;
  /** Dot path into the page's existing content object (HomeContent, etc.) —
   * how the resolver reads/writes this field without needing a parallel
   * "content_json" blob per field. */
  path: string;
  label: string;
  type: ContentFieldType;
  /** Groups fields for the Layers panel (spec: "Hero", "Cards", "Footer"),
   * and doubles as the breadcrumb's middle segment. */
  group: string;
  maxLength?: number;
};

// Whether a field type gets the rich-text toolbar+editor vs. the plain
// single-line input — the one branch point the inspector UI needs.
export function isRichTextField(type: ContentFieldType): boolean {
  return type === "richText";
}

// Phase 133 — Home's field map, the "fully supported reference
// implementation" the spec asks for. Every contentId here is stable and
// hand-assigned; the `path` is the only thing that would ever need to
// change if HomeContent's own shape changes.
// Phase 134 — `type` values updated to the exact plainText/richText mapping
// Roy specified: hero/card descriptions and the footer note became
// "richText" (Word-style toolbar); everything short (eyebrow, headings,
// badges, CTA labels) stayed a plain single-line field.
export const HOME_EDITABLE_FIELDS: EditableFieldDef[] = [
  { contentId: "home.hero.eyebrow", path: "eyebrow", label: "Hero eyebrow", type: "plainText", group: "Hero", maxLength: 80 },
  { contentId: "home.hero.heading", path: "title", label: "Hero heading", type: "heading", group: "Hero", maxLength: 140 },
  { contentId: "home.hero.description", path: "subtitle", label: "Hero description", type: "richText", group: "Hero", maxLength: 400 },
  { contentId: "home.hero.badge1", path: "badge1Label", label: "Trust badge 1", type: "plainText", group: "Hero", maxLength: 40 },
  { contentId: "home.hero.badge2", path: "badge2Label", label: "Trust badge 2", type: "plainText", group: "Hero", maxLength: 40 },
  { contentId: "home.hero.badge3", path: "badge3Label", label: "Trust badge 3", type: "plainText", group: "Hero", maxLength: 40 },
  { contentId: "home.crisis-card.label", path: "card1FrontLabel", label: "Crisis card badge label", type: "plainText", group: "Crisis card", maxLength: 20 },
  { contentId: "home.crisis-card.title", path: "card1Title", label: "Crisis card heading", type: "heading", group: "Crisis card", maxLength: 100 },
  { contentId: "home.crisis-card.description", path: "card1Description", label: "Crisis card description", type: "richText", group: "Crisis card", maxLength: 300 },
  { contentId: "home.crisis-card.cta", path: "card1CtaLabel", label: "Crisis card CTA label", type: "ctaLabel", group: "Crisis card", maxLength: 40 },
  { contentId: "home.veterans-card.label", path: "card2FrontLabel", label: "Veterans card badge label", type: "plainText", group: "Veterans card", maxLength: 20 },
  { contentId: "home.veterans-card.title", path: "card2Title", label: "Veterans card heading", type: "heading", group: "Veterans card", maxLength: 100 },
  { contentId: "home.veterans-card.description", path: "card2Description", label: "Veterans card description", type: "richText", group: "Veterans card", maxLength: 300 },
  { contentId: "home.veterans-card.cta", path: "card2CtaLabel", label: "Veterans card CTA label", type: "ctaLabel", group: "Veterans card", maxLength: 40 },
  { contentId: "home.support-card.label", path: "card3FrontLabel", label: "Support card badge label", type: "plainText", group: "Support card", maxLength: 20 },
  { contentId: "home.support-card.title", path: "card3Title", label: "Support card heading", type: "heading", group: "Support card", maxLength: 100 },
  { contentId: "home.support-card.description", path: "card3Description", label: "Support card description", type: "richText", group: "Support card", maxLength: 300 },
  { contentId: "home.support-card.cta", path: "card3CtaLabel", label: "Support card CTA label", type: "ctaLabel", group: "Support card", maxLength: 40 },
  { contentId: "home.footer-note", path: "footerNote", label: "Closing note", type: "richText", group: "Footer note", maxLength: 200 },
];

export function getEditableFields(pageKey: string): EditableFieldDef[] {
  if (pageKey === "home") return HOME_EDITABLE_FIELDS;
  return [];
}

export function getFieldByContentId(pageKey: string, contentId: string): EditableFieldDef | undefined {
  return getEditableFields(pageKey).find((f) => f.contentId === contentId);
}
