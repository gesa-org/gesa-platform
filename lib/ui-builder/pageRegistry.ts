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
//
// Phase 135 — generalized from Home's single-`site_content`-row assumption
// to support pages backed by MORE than one site_content key (About =
// "page_about_hero" + "page_about_sections", Our Professionals = banner +
// directory filters, Community = banner + directory + intro band, etc.).
// Each PageDefinition now lists its `contentSources`: one entry per
// site_content row, each tagged with a `namespace` that becomes the
// top-level key the resolved content object nests that source's fields
// under (e.g. About's `sections.howItWorksHeading`). A single-source page
// uses namespace `""` and keeps flat, un-namespaced paths — Home's fields
// are untouched by this change for exactly that reason (no risk to any
// draft an admin may already have saved against Home).
export type PageGroup = "core" | "support" | "legal" | "system";

export type PageContentSource = {
  /** "" for a single-source page (flat paths, e.g. Home) — every other
   * source uses a short name (e.g. "sections", "directory") that the
   * resolved content object nests that source's fields under, so a field's
   * `path` becomes "<namespace>.<field>" (e.g. "sections.missionHeading"). */
  namespace: string;
  /** The site_content key this source's published content lives under —
   * unchanged from the existing Content Manager (see lib/content.ts). */
  siteContentKey: string;
};

export type PageDefinition = {
  pageKey: string;
  route: string;
  title: string;
  group: PageGroup;
  /** Per the spec's own "if the page is unsupported for visual editing,
   * display a clear message and allow global styling only" — this flag
   * drives that branch in the Page Editor UI. Phase 135 turns this on for
   * every core/support page; the 5 legal pages stay `false` this phase (see
   * the comment above their entries below for why). */
  supportsVisualEditor: boolean;
  /** One or more site_content rows this page's editable fields are spread
   * across. Empty for pages that don't use site_content at all (the legal
   * pages, which live in the separate `legal_pages` table). */
  contentSources: PageContentSource[];
};

export const PAGE_DEFINITIONS: PageDefinition[] = [
  { pageKey: "home", route: "/", title: "Home", group: "core", supportsVisualEditor: true, contentSources: [{ namespace: "", siteContentKey: "page_home" }] },
  {
    pageKey: "about",
    route: "/about",
    title: "About",
    group: "core",
    supportsVisualEditor: true,
    contentSources: [
      { namespace: "hero", siteContentKey: "page_about_hero" },
      { namespace: "sections", siteContentKey: "page_about_sections" },
    ],
  },
  {
    pageKey: "therapists",
    route: "/therapists",
    title: "Our Professionals",
    group: "core",
    supportsVisualEditor: true,
    contentSources: [
      { namespace: "", siteContentKey: "page_therapists" },
      { namespace: "directory", siteContentKey: "component_therapists_directory" },
    ],
  },
  {
    pageKey: "support-groups",
    route: "/support-groups",
    title: "Community",
    group: "core",
    supportsVisualEditor: true,
    contentSources: [
      { namespace: "", siteContentKey: "page_support_groups" },
      { namespace: "directory", siteContentKey: "component_support_groups_directory" },
      { namespace: "intro", siteContentKey: "component_community_intro" },
    ],
  },
  { pageKey: "donate", route: "/donate", title: "Donate", group: "core", supportsVisualEditor: true, contentSources: [{ namespace: "", siteContentKey: "page_donate" }] },
  {
    pageKey: "intake",
    route: "/intake",
    title: "Find Support / Intake",
    group: "core",
    supportsVisualEditor: true,
    // Phase 133 had this pointed at a "page_intake" key that doesn't exist —
    // the real key (confirmed against app/intake/page.tsx) is
    // "component_intake_flow". Fixed as part of this generalization.
    contentSources: [{ namespace: "", siteContentKey: "component_intake_flow" }],
  },
  { pageKey: "faq", route: "/faq", title: "FAQ", group: "support", supportsVisualEditor: true, contentSources: [{ namespace: "", siteContentKey: "page_faq" }] },
  { pageKey: "contact", route: "/contact", title: "Contact", group: "support", supportsVisualEditor: true, contentSources: [{ namespace: "", siteContentKey: "page_contact" }] },
  // Legal pages — deliberately left `supportsVisualEditor: false` this
  // phase. Unlike every page above, these five don't live in site_content
  // at all: app/[slug]/page.tsx reads them from the separate `legal_pages`
  // table (`{ slug, title, body, updated_at }`) via getLegalPage(slug), a
  // plain DB row rather than a JSON blob this registry's dot-path resolver
  // can patch. Wiring them into the visual canvas needs a second resolver
  // strategy (read/patch/publish against a table row, not a site_content
  // key) rather than a registry entry — a real, scoped follow-up, not
  // something to bolt on incorrectly here. They remain fully editable today
  // via Content Manager's LegalPagesManager, which already targets that
  // table directly. `cookies-policy` and `legal-notice` were also missing
  // from this list entirely before this phase — added for a complete Pages
  // list even though visual editing isn't wired for any of the five yet.
  { pageKey: "privacy-policy", route: "/privacy-policy", title: "Privacy Policy", group: "legal", supportsVisualEditor: false, contentSources: [] },
  { pageKey: "cookies-policy", route: "/cookies-policy", title: "Cookies Policy", group: "legal", supportsVisualEditor: false, contentSources: [] },
  { pageKey: "legal-notice", route: "/legal-notice", title: "Legal Notice", group: "legal", supportsVisualEditor: false, contentSources: [] },
  { pageKey: "accessibility-statement", route: "/accessibility-statement", title: "Accessibility Statement", group: "legal", supportsVisualEditor: false, contentSources: [] },
  { pageKey: "terms-and-conditions", route: "/terms-and-conditions", title: "Terms & Conditions", group: "legal", supportsVisualEditor: false, contentSources: [] },
];

export function getPageDefinition(pageKey: string): PageDefinition | undefined {
  return PAGE_DEFINITIONS.find((p) => p.pageKey === pageKey);
}

// Phase 134 — replaces Phase 133's "text"/"textarea" UI-shape distinction
// with the content-*meaning* the spec asked for. "plainText"/"heading"/
// "ctaLabel" all render the existing compact single-line input (no
// formatting toolbar, no HTML ever allowed in the value — enforced by
// stripAllHtml() at the API layer); "richText" is the only type that gets
// the Word-style toolbar + Tiptap editor and is allowed to persist
// sanitized HTML.
//
// Phase 135 — added the remaining field-meaning types the bigger
// content-registry spec calls for: "altText"/"formLabel" render the same
// plain single-line input as "plainText" today (no dedicated control
// needed — they're semantically distinct, not visually), and
// "toggle"/"socialLink"/"navigationItem"/"repeater" are declared for
// forward compatibility (same as "image"/"url" were in Phase 134) but no
// field uses them yet — a real add/reorder/hide/delete repeater editor and
// a media picker are scoped follow-up work, not something to fake with a
// plain text input that would corrupt structured data. "url" now has one
// real user: every CTA/link destination field registered this phase.
export type ContentFieldType =
  | "plainText"
  | "richText"
  | "heading"
  | "ctaLabel"
  | "url"
  | "image"
  | "altText"
  | "formLabel"
  | "toggle"
  | "socialLink"
  | "navigationItem"
  | "repeater";

export type EditableFieldDef = {
  contentId: string;
  /** Dot path into the page's *resolved* content object — for a
   * single-source page this is a path straight into that page's content
   * type (e.g. "eyebrow"); for a multi-source page it's prefixed with that
   * source's namespace (e.g. "sections.howItWorksHeading" — see
   * PageContentSource above). */
  path: string;
  label: string;
  type: ContentFieldType;
  /** Groups fields for the Layers panel (spec: "Hero", "Cards", "Footer"),
   * and doubles as the breadcrumb's middle segment. */
  group: string;
  maxLength?: number;
  /** Phase 135 — "page" (default assumption, not stored per-field before
   * this phase) vs "global" content the spec's registry type calls for.
   * Every field registered so far is page-scoped; global Header/Footer
   * fields are intentionally not registered yet — see EXECUTION_PLAN.md
   * Phase 135's "left out of this phase" note for the architectural reason
   * (layout.tsx, which renders Header/Footer, has no access to the
   * `?editorPreview=true` query string the way a page.tsx does). */
  contentScope: "page" | "global";
};

export type RichTextMode = "block" | "inline" | "none";

// Phase 137 — every editable-text field in Page Content gets Home Hero
// description's same rich-text editor/toolbar; this function is what
// decides *which flavor* it gets, and it's the one place that decision is
// made (PageEditorShell's input choice, both draft/publish routes' and
// sanitizeResolvedContent's sanitizer choice, and EditableText's public
// render mode all key off it, directly or indirectly).
//
// - "block": the full toolbar, including paragraph/heading style, lists,
//   alignment, blockquote, and horizontal divider — genuine multi-sentence
//   body copy that owns its own block-level structure. Used by "richText"
//   fields (unchanged since Phase 134) and by any "plainText" field long
//   enough to actually be a paragraph (see BLOCK_LENGTH_THRESHOLD below).
// - "inline": the same toolbar minus those four block-level groups — every
//   character-level control (font family/size, bold/italic/underline/
//   strike/superscript/subscript, change case, color/highlight, Font
//   settings, Insert/edit link, undo/redo/clear formatting) still works.
//   Used by "heading"/"ctaLabel"/"formLabel" and short "plainText" fields
//   (badges, eyebrows, button/field labels). These fields render inside a
//   tag the page template already supplies — an <h1>, a button's own
//   label, a badge <span> — so a nested <h2> or a bullet list there would
//   be invalid markup; RichTextEditor.tsx's matching `mode` prop disables
//   those node types at the schema level too, not just in the toolbar.
// - "none": the plain single-line input, unchanged from every phase before
//   this one — "url" (raw href destinations), "image"/"altText" (not text
//   content in the formatted-copy sense), "toggle", and the not-yet-built
//   structured types ("socialLink"/"navigationItem"/"repeater").
//
// "plainText" is intentionally split by length rather than getting one
// fixed treatment: this type has always covered everything from a
// 20-character badge to a 600-character mission statement (see
// EXECUTION_PLAN.md's Phase 137 field inventory) — a 400-character Hero
// description deserves the same paragraph-level toolbar Home's richText
// Hero description already has; a 20-character badge label does not.
const BLOCK_LENGTH_THRESHOLD = 200;

export function getRichTextMode(field: Pick<EditableFieldDef, "type" | "maxLength">): RichTextMode {
  if (field.type === "richText") return "block";
  if (field.type === "plainText") {
    return (field.maxLength ?? 0) >= BLOCK_LENGTH_THRESHOLD ? "block" : "inline";
  }
  if (field.type === "heading" || field.type === "ctaLabel" || field.type === "formLabel") return "inline";
  return "none";
}

// Whether a field type gets the rich-text toolbar+editor at all (block or
// inline) vs. the plain single-line input — kept as a small wrapper so the
// existing call sites (inspector UI, both draft/publish routes,
// sanitizeResolvedContent) that only need a yes/no don't each need to know
// about the 3-way split above.
export function isRichTextField(field: Pick<EditableFieldDef, "type" | "maxLength">): boolean {
  return getRichTextMode(field) !== "none";
}

// Phase 133 — Home's field map, the "fully supported reference
// implementation" the spec asks for. Every contentId here is stable and
// hand-assigned; the `path` is the only thing that would ever need to
// change if HomeContent's own shape changes.
// Phase 134 — `type` values updated to the exact plainText/richText mapping
// Roy specified: hero/card descriptions and the footer note became
// "richText" (Word-style toolbar); everything short (eyebrow, headings,
// badges, CTA labels) stayed a plain single-line field.
const HOME_EDITABLE_FIELDS: EditableFieldDef[] = [
  { contentId: "home.hero.eyebrow", path: "eyebrow", label: "Hero eyebrow", type: "plainText", group: "Hero", maxLength: 80, contentScope: "page" },
  { contentId: "home.hero.heading", path: "title", label: "Hero heading", type: "heading", group: "Hero", maxLength: 140, contentScope: "page" },
  { contentId: "home.hero.description", path: "subtitle", label: "Hero description", type: "richText", group: "Hero", maxLength: 400, contentScope: "page" },
  { contentId: "home.hero.badge1", path: "badge1Label", label: "Trust badge 1", type: "plainText", group: "Hero", maxLength: 40, contentScope: "page" },
  { contentId: "home.hero.badge2", path: "badge2Label", label: "Trust badge 2", type: "plainText", group: "Hero", maxLength: 40, contentScope: "page" },
  { contentId: "home.hero.badge3", path: "badge3Label", label: "Trust badge 3", type: "plainText", group: "Hero", maxLength: 40, contentScope: "page" },
  { contentId: "home.crisis-card.label", path: "card1FrontLabel", label: "Crisis card badge label", type: "plainText", group: "Crisis card", maxLength: 20, contentScope: "page" },
  { contentId: "home.crisis-card.title", path: "card1Title", label: "Crisis card heading", type: "heading", group: "Crisis card", maxLength: 100, contentScope: "page" },
  { contentId: "home.crisis-card.description", path: "card1Description", label: "Crisis card description", type: "richText", group: "Crisis card", maxLength: 300, contentScope: "page" },
  { contentId: "home.crisis-card.cta", path: "card1CtaLabel", label: "Crisis card CTA label", type: "ctaLabel", group: "Crisis card", maxLength: 40, contentScope: "page" },
  { contentId: "home.veterans-card.label", path: "card2FrontLabel", label: "Veterans card badge label", type: "plainText", group: "Veterans card", maxLength: 20, contentScope: "page" },
  { contentId: "home.veterans-card.title", path: "card2Title", label: "Veterans card heading", type: "heading", group: "Veterans card", maxLength: 100, contentScope: "page" },
  { contentId: "home.veterans-card.description", path: "card2Description", label: "Veterans card description", type: "richText", group: "Veterans card", maxLength: 300, contentScope: "page" },
  { contentId: "home.veterans-card.cta", path: "card2CtaLabel", label: "Veterans card CTA label", type: "ctaLabel", group: "Veterans card", maxLength: 40, contentScope: "page" },
  { contentId: "home.support-card.label", path: "card3FrontLabel", label: "Support card badge label", type: "plainText", group: "Support card", maxLength: 20, contentScope: "page" },
  { contentId: "home.support-card.title", path: "card3Title", label: "Support card heading", type: "heading", group: "Support card", maxLength: 100, contentScope: "page" },
  { contentId: "home.support-card.description", path: "card3Description", label: "Support card description", type: "richText", group: "Support card", maxLength: 300, contentScope: "page" },
  { contentId: "home.support-card.cta", path: "card3CtaLabel", label: "Support card CTA label", type: "ctaLabel", group: "Support card", maxLength: 40, contentScope: "page" },
  { contentId: "home.footer-note", path: "footerNote", label: "Closing note", type: "richText", group: "Footer note", maxLength: 200, contentScope: "page" },
];

// Phase 135 — About. Two sources: Hero.tsx's "hero" namespace and the rest
// of the page's "sections" namespace. Only fields the page actually renders
// today are registered — `sections.missionHeading`/`missionParagraphs`/
// `foundersIntro`, the founders[] repeater, and howItWorksPoints[] are real
// content-type fields but aren't rendered by app/about/page.tsx right now
// (see that file's own Phase 77/84/85 comments) or need the repeater editor
// this phase doesn't build yet — same "don't wire what isn't visible or
// isn't safely editable yet" rule Home's registry already followed.
// `ctaPrimaryHref`/`ctaSecondaryHref`/`movementCtaHref`/`teamCtaHref` are
// real, working fields (draft/publish/Content-Manager-sync all apply to
// them) but aren't wrapped in a visible DOM element this phase — `title`
// isn't either, since Hero.tsx feeds it through <HighlightedText>, which
// needs a plain string, not a React node. All four are still selectable
// and editable via the Layers panel; they just won't highlight in the
// canvas or live-update the preview until Publish/reload, unlike every
// other field here.
const ABOUT_EDITABLE_FIELDS: EditableFieldDef[] = [
  { contentId: "about.hero.eyebrow", path: "hero.eyebrow", label: "Hero eyebrow", type: "plainText", group: "Hero", maxLength: 80, contentScope: "page" },
  { contentId: "about.hero.heading", path: "hero.title", label: "Hero heading", type: "heading", group: "Hero", maxLength: 140, contentScope: "page" },
  { contentId: "about.hero.description", path: "hero.subtitle", label: "Hero description", type: "plainText", group: "Hero", maxLength: 400, contentScope: "page" },
  { contentId: "about.hero.cta1Label", path: "hero.ctaPrimaryLabel", label: "Primary CTA label", type: "ctaLabel", group: "Hero", maxLength: 40, contentScope: "page" },
  { contentId: "about.hero.cta1Url", path: "hero.ctaPrimaryHref", label: "Primary CTA URL", type: "url", group: "Hero", contentScope: "page" },
  { contentId: "about.hero.cta2Label", path: "hero.ctaSecondaryLabel", label: "Secondary CTA label", type: "ctaLabel", group: "Hero", maxLength: 40, contentScope: "page" },
  { contentId: "about.hero.cta2Url", path: "hero.ctaSecondaryHref", label: "Secondary CTA URL", type: "url", group: "Hero", contentScope: "page" },
  { contentId: "about.howItWorks.heading", path: "sections.howItWorksHeading", label: "“How GESA works” heading", type: "heading", group: "How it works", maxLength: 100, contentScope: "page" },
  { contentId: "about.founders.eyebrow", path: "sections.foundersHeading", label: "Founder spotlight eyebrow", type: "plainText", group: "Founder spotlight", maxLength: 60, contentScope: "page" },
  { contentId: "about.movement.heading", path: "sections.movementHeading", label: "Movement band heading", type: "heading", group: "Movement band", maxLength: 140, contentScope: "page" },
  { contentId: "about.movement.body", path: "sections.movementSubtitle", label: "Movement band body", type: "plainText", group: "Movement band", maxLength: 240, contentScope: "page" },
  { contentId: "about.movement.ctaLabel", path: "sections.movementCtaLabel", label: "Movement CTA label", type: "ctaLabel", group: "Movement band", maxLength: 40, contentScope: "page" },
  { contentId: "about.movement.ctaUrl", path: "sections.movementCtaHref", label: "Movement CTA URL", type: "url", group: "Movement band", contentScope: "page" },
  { contentId: "about.team.eyebrow", path: "sections.teamEyebrow", label: "Team section eyebrow", type: "plainText", group: "Team & Advisors", maxLength: 60, contentScope: "page" },
  { contentId: "about.team.heading", path: "sections.teamHeading", label: "Team section heading", type: "heading", group: "Team & Advisors", maxLength: 100, contentScope: "page" },
  { contentId: "about.team.intro", path: "sections.teamIntro", label: "Team section intro", type: "plainText", group: "Team & Advisors", maxLength: 280, contentScope: "page" },
  { contentId: "about.team.ctaLabel", path: "sections.teamCtaLabel", label: "Team CTA label", type: "ctaLabel", group: "Team & Advisors", maxLength: 40, contentScope: "page" },
  { contentId: "about.team.ctaUrl", path: "sections.teamCtaHref", label: "Team CTA URL", type: "url", group: "Team & Advisors", contentScope: "page" },
];

// Phase 135 — Our Professionals (Therapists). Banner fields (namespace "")
// are canvas-selectable via PageHero; the directory filter sidebar's labels
// (namespace "directory", TherapistsDirectory.tsx — a client component with
// its own internal filter state) are registered and fully editable/
// publishable, but not yet wrapped in a visible DOM element — see the
// About registry's comment above for what that trade-off means in
// practice. The actual filter *options* (specialties/languages/durations)
// stay data-driven from real therapist records, per the spec's own "don't
// expose sensitive therapist profile data as static content" guardrail —
// only these fixed surrounding labels are registered.
const THERAPISTS_EDITABLE_FIELDS: EditableFieldDef[] = [
  { contentId: "therapists.hero.eyebrow", path: "eyebrow", label: "Hero eyebrow", type: "plainText", group: "Hero", maxLength: 80, contentScope: "page" },
  { contentId: "therapists.hero.heading", path: "title", label: "Hero heading", type: "heading", group: "Hero", maxLength: 140, contentScope: "page" },
  { contentId: "therapists.hero.description", path: "description", label: "Hero description", type: "plainText", group: "Hero", maxLength: 400, contentScope: "page" },
  { contentId: "therapists.directory.searchLabel", path: "directory.searchLabel", label: "Search field label", type: "formLabel", group: "Directory filters", maxLength: 40, contentScope: "page" },
  { contentId: "therapists.directory.searchPlaceholder", path: "directory.searchPlaceholder", label: "Search field placeholder", type: "formLabel", group: "Directory filters", maxLength: 60, contentScope: "page" },
  { contentId: "therapists.directory.definitionLabel", path: "directory.definitionLabel", label: "Specialty filter label", type: "formLabel", group: "Directory filters", maxLength: 40, contentScope: "page" },
  { contentId: "therapists.directory.languageLabel", path: "directory.languageLabel", label: "Language filter label", type: "formLabel", group: "Directory filters", maxLength: 40, contentScope: "page" },
  { contentId: "therapists.directory.durationLabel", path: "directory.durationLabel", label: "Duration filter label", type: "formLabel", group: "Directory filters", maxLength: 40, contentScope: "page" },
  { contentId: "therapists.directory.genderLabel", path: "directory.genderLabel", label: "Gender filter label", type: "formLabel", group: "Directory filters", maxLength: 40, contentScope: "page" },
  { contentId: "therapists.directory.applyFiltersLabel", path: "directory.applyFiltersLabel", label: "Apply filters button label", type: "ctaLabel", group: "Directory filters", maxLength: 40, contentScope: "page" },
  { contentId: "therapists.directory.joinAsTherapistLabel", path: "directory.joinAsTherapistLabel", label: "“Join as a therapist” label", type: "ctaLabel", group: "Directory filters", maxLength: 60, contentScope: "page" },
  { contentId: "therapists.directory.noResultsMessage", path: "directory.noResultsMessage", label: "No-results message", type: "plainText", group: "Directory filters", maxLength: 200, contentScope: "page" },
];

// Phase 135 — Community (Support Groups). Three sources: the banner
// (namespace ""), the registration flow's fixed labels (namespace
// "directory", SupportGroupsInteractive.tsx), and the newer intro band
// (namespace "intro", CommunityIntro.tsx — hero buttons, tagline row,
// mission blurb, three pathway cards, closing band). Live group records and
// registrations stay entirely in their existing operational tables/flow,
// per the spec's own guardrail — nothing here touches that.
const SUPPORT_GROUPS_EDITABLE_FIELDS: EditableFieldDef[] = [
  { contentId: "supportGroups.hero.eyebrow", path: "eyebrow", label: "Hero eyebrow", type: "plainText", group: "Hero", maxLength: 80, contentScope: "page" },
  { contentId: "supportGroups.hero.heading", path: "title", label: "Hero heading", type: "heading", group: "Hero", maxLength: 140, contentScope: "page" },
  { contentId: "supportGroups.hero.description", path: "description", label: "Hero description", type: "plainText", group: "Hero", maxLength: 400, contentScope: "page" },
  { contentId: "supportGroups.directory.noGroupsMessage", path: "directory.noGroupsMessage", label: "No-groups message", type: "plainText", group: "Registration flow", maxLength: 200, contentScope: "page" },
  { contentId: "supportGroups.directory.registerButtonLabel", path: "directory.registerButtonLabel", label: "Register button label", type: "ctaLabel", group: "Registration flow", maxLength: 40, contentScope: "page" },
  { contentId: "supportGroups.directory.confirmButtonLabel", path: "directory.confirmButtonLabel", label: "Confirm button label", type: "ctaLabel", group: "Registration flow", maxLength: 40, contentScope: "page" },
  { contentId: "supportGroups.directory.successHeading", path: "directory.successHeading", label: "Success heading", type: "heading", group: "Registration flow", maxLength: 100, contentScope: "page" },
  { contentId: "supportGroups.intro.heroPrimaryLabel", path: "intro.heroPrimaryLabel", label: "Hero button 1 label", type: "ctaLabel", group: "Intro band", maxLength: 40, contentScope: "page" },
  { contentId: "supportGroups.intro.heroPrimaryUrl", path: "intro.heroPrimaryHref", label: "Hero button 1 URL", type: "url", group: "Intro band", contentScope: "page" },
  { contentId: "supportGroups.intro.heroSecondaryLabel", path: "intro.heroSecondaryLabel", label: "Hero button 2 label", type: "ctaLabel", group: "Intro band", maxLength: 40, contentScope: "page" },
  { contentId: "supportGroups.intro.heroSecondaryUrl", path: "intro.heroSecondaryHref", label: "Hero button 2 URL", type: "url", group: "Intro band", contentScope: "page" },
  { contentId: "supportGroups.intro.missionHeading", path: "intro.missionHeading", label: "Mission heading", type: "heading", group: "Intro band", maxLength: 100, contentScope: "page" },
  { contentId: "supportGroups.intro.missionBody", path: "intro.missionBody", label: "Mission body", type: "plainText", group: "Intro band", maxLength: 600, contentScope: "page" },
  { contentId: "supportGroups.intro.card1Title", path: "intro.card1Title", label: "Pathway card 1 title", type: "heading", group: "Pathway cards", maxLength: 100, contentScope: "page" },
  { contentId: "supportGroups.intro.card1Body", path: "intro.card1Body", label: "Pathway card 1 body", type: "plainText", group: "Pathway cards", maxLength: 240, contentScope: "page" },
  { contentId: "supportGroups.intro.card1CtaLabel", path: "intro.card1CtaLabel", label: "Pathway card 1 CTA label", type: "ctaLabel", group: "Pathway cards", maxLength: 40, contentScope: "page" },
  { contentId: "supportGroups.intro.card2Title", path: "intro.card2Title", label: "Pathway card 2 title", type: "heading", group: "Pathway cards", maxLength: 100, contentScope: "page" },
  { contentId: "supportGroups.intro.card2Body", path: "intro.card2Body", label: "Pathway card 2 body", type: "plainText", group: "Pathway cards", maxLength: 240, contentScope: "page" },
  { contentId: "supportGroups.intro.card2CtaLabel", path: "intro.card2CtaLabel", label: "Pathway card 2 CTA label", type: "ctaLabel", group: "Pathway cards", maxLength: 40, contentScope: "page" },
  { contentId: "supportGroups.intro.card3Title", path: "intro.card3Title", label: "Pathway card 3 title", type: "heading", group: "Pathway cards", maxLength: 100, contentScope: "page" },
  { contentId: "supportGroups.intro.card3Body", path: "intro.card3Body", label: "Pathway card 3 body", type: "plainText", group: "Pathway cards", maxLength: 240, contentScope: "page" },
  { contentId: "supportGroups.intro.card3CtaLabel", path: "intro.card3CtaLabel", label: "Pathway card 3 CTA label", type: "ctaLabel", group: "Pathway cards", maxLength: 40, contentScope: "page" },
  { contentId: "supportGroups.intro.closingHeading", path: "intro.closingHeading", label: "Closing band heading", type: "heading", group: "Closing band", maxLength: 100, contentScope: "page" },
  { contentId: "supportGroups.intro.closingSubtitle", path: "intro.closingSubtitle", label: "Closing band subtitle", type: "plainText", group: "Closing band", maxLength: 240, contentScope: "page" },
];

// Phase 135 — Donate. Single source. The hero band's text is canvas-
// wrapped in components/donate/DonatePage.tsx; the impact cards, movement
// band, trust badges, and closing crisis line are registered and fully
// editable/publishable but not yet canvas-wrapped (same Layers-only trade-
// off noted above). The interactive giving box itself (once/monthly
// toggle, preset/custom amounts, gift CTA — DonateForm.tsx) is deliberately
// NOT registered at all this phase, per the spec's own "do not expose
// payment-provider keys, payment logic, or transactional configuration"
// guardrail — those labels sit directly beside real payment behavior, and
// stay editable only through the existing, more deliberate Content Manager
// form for now.
const DONATE_EDITABLE_FIELDS: EditableFieldDef[] = [
  { contentId: "donate.hero.eyebrow", path: "eyebrow", label: "Hero eyebrow", type: "plainText", group: "Hero", maxLength: 80, contentScope: "page" },
  { contentId: "donate.hero.heading", path: "title", label: "Hero heading", type: "heading", group: "Hero", maxLength: 140, contentScope: "page" },
  { contentId: "donate.hero.description", path: "subtitle", label: "Hero description", type: "plainText", group: "Hero", maxLength: 400, contentScope: "page" },
  { contentId: "donate.hero.boldLine", path: "boldLine", label: "Hero bold line", type: "plainText", group: "Hero", maxLength: 140, contentScope: "page" },
  { contentId: "donate.hero.ctaLabel", path: "heroCtaLabel", label: "Hero CTA label", type: "ctaLabel", group: "Hero", maxLength: 40, contentScope: "page" },
  { contentId: "donate.impact.heading", path: "impactHeading", label: "Impact section heading", type: "heading", group: "Impact section", maxLength: 100, contentScope: "page" },
  { contentId: "donate.impact.card1Title", path: "impact1Title", label: "Impact card 1 title", type: "plainText", group: "Impact section", maxLength: 60, contentScope: "page" },
  { contentId: "donate.impact.card1Description", path: "impact1Description", label: "Impact card 1 description", type: "plainText", group: "Impact section", maxLength: 200, contentScope: "page" },
  { contentId: "donate.impact.card2Title", path: "impact2Title", label: "Impact card 2 title", type: "plainText", group: "Impact section", maxLength: 60, contentScope: "page" },
  { contentId: "donate.impact.card2Description", path: "impact2Description", label: "Impact card 2 description", type: "plainText", group: "Impact section", maxLength: 200, contentScope: "page" },
  { contentId: "donate.impact.card3Title", path: "impact3Title", label: "Impact card 3 title", type: "plainText", group: "Impact section", maxLength: 60, contentScope: "page" },
  { contentId: "donate.impact.card3Description", path: "impact3Description", label: "Impact card 3 description", type: "plainText", group: "Impact section", maxLength: 200, contentScope: "page" },
  { contentId: "donate.movement.heading", path: "movementHeading", label: "Movement band heading", type: "heading", group: "Movement band", maxLength: 140, contentScope: "page" },
  { contentId: "donate.movement.subtitle", path: "movementSubtitle", label: "Movement band subtitle", type: "plainText", group: "Movement band", maxLength: 240, contentScope: "page" },
  { contentId: "donate.movement.ctaLabel", path: "movementCtaLabel", label: "Movement CTA label", type: "ctaLabel", group: "Movement band", maxLength: 40, contentScope: "page" },
  { contentId: "donate.movement.ctaUrl", path: "movementCtaHref", label: "Movement CTA URL", type: "url", group: "Movement band", contentScope: "page" },
  { contentId: "donate.trust.badge1", path: "trustBadge1Label", label: "Trust badge 1", type: "plainText", group: "Trust badges", maxLength: 40, contentScope: "page" },
  { contentId: "donate.trust.badge2", path: "trustBadge2Label", label: "Trust badge 2", type: "plainText", group: "Trust badges", maxLength: 40, contentScope: "page" },
  { contentId: "donate.trust.badge3", path: "trustBadge3Label", label: "Trust badge 3", type: "plainText", group: "Trust badges", maxLength: 40, contentScope: "page" },
  { contentId: "donate.trust.badge4", path: "trustBadge4Label", label: "Trust badge 4", type: "plainText", group: "Trust badges", maxLength: 40, contentScope: "page" },
  { contentId: "donate.crisis.text", path: "crisisText", label: "Crisis line text", type: "plainText", group: "Closing crisis line", maxLength: 100, contentScope: "page" },
  { contentId: "donate.crisis.linkLabel", path: "crisisLinkLabel", label: "Crisis link label", type: "ctaLabel", group: "Closing crisis line", maxLength: 60, contentScope: "page" },
  { contentId: "donate.crisis.linkUrl", path: "crisisLinkHref", label: "Crisis link URL", type: "url", group: "Closing crisis line", contentScope: "page" },
];

// Phase 135 — Find Support / Intake. Deliberately narrow, per the spec's
// own instruction: only the hero labels and the crisis-path's safety
// copy are registered, matching IntakeFlowContent exactly. The matching
// engine, therapist data, and the deeper booking-modal copy are explicitly
// excluded (real, private workflow logic) — see app/intake/intakeContent.ts.
const INTAKE_EDITABLE_FIELDS: EditableFieldDef[] = [
  { contentId: "intake.paths.crisisLabel", path: "pathCrisisLabel", label: "“Crisis” path label", type: "plainText", group: "Path labels", maxLength: 40, contentScope: "page" },
  { contentId: "intake.paths.veteranLabel", path: "pathVeteranLabel", label: "“Veteran/family” path label", type: "plainText", group: "Path labels", maxLength: 40, contentScope: "page" },
  { contentId: "intake.paths.generalLabel", path: "pathGeneralLabel", label: "“General support” path label", type: "plainText", group: "Path labels", maxLength: 40, contentScope: "page" },
  { contentId: "intake.paths.helpersLabel", path: "pathHelpersLabel", label: "“Helpers” path label", type: "plainText", group: "Path labels", maxLength: 40, contentScope: "page" },
  { contentId: "intake.hero.crisisTitle", path: "crisisHeroTitle", label: "Crisis path hero heading", type: "heading", group: "Hero", maxLength: 140, contentScope: "page" },
  { contentId: "intake.hero.defaultTitle", path: "defaultHeroTitle", label: "Default hero heading", type: "heading", group: "Hero", maxLength: 140, contentScope: "page" },
  { contentId: "intake.crisis.disclaimer", path: "crisisDisclaimer", label: "Crisis disclaimer", type: "plainText", group: "Crisis guidance", maxLength: 300, contentScope: "page" },
  { contentId: "intake.crisis.moreHelplinesText", path: "moreHelplinesText", label: "“More helplines” text", type: "plainText", group: "Crisis guidance", maxLength: 100, contentScope: "page" },
  { contentId: "intake.crisis.ongoingSupportPrompt", path: "ongoingSupportPrompt", label: "Ongoing-support prompt", type: "plainText", group: "Crisis guidance", maxLength: 200, contentScope: "page" },
  { contentId: "intake.matchList.intro", path: "matchListIntro", label: "Match list intro", type: "plainText", group: "Crisis guidance", maxLength: 200, contentScope: "page" },
];

// Phase 135 — FAQ. Banner only, matching the spec's own carve-out: the
// actual question/answer list is real, structured, reorderable data
// (the `faqs` table, `{id, question, answer, sort}`) already managed
// through Content Manager's FaqManager repeater UI — bringing that into
// the visual canvas needs the "repeater" field type's real add/reorder/
// hide/delete editor (declared in ContentFieldType above, not built yet),
// not a dot-path patch into a JSON blob. FaqManager remains the place to
// add, reorder, hide, or delete FAQ entries; this registry only covers the
// page's intro banner.
const FAQ_EDITABLE_FIELDS: EditableFieldDef[] = [
  { contentId: "faq.hero.eyebrow", path: "eyebrow", label: "Hero eyebrow", type: "plainText", group: "Hero", maxLength: 80, contentScope: "page" },
  { contentId: "faq.hero.heading", path: "title", label: "Hero heading", type: "heading", group: "Hero", maxLength: 140, contentScope: "page" },
  { contentId: "faq.hero.description", path: "description", label: "Hero description", type: "plainText", group: "Hero", maxLength: 400, contentScope: "page" },
];

// Phase 135 — Contact. Banner only. Editable contact details (public email/
// phone/address) and the form's headings/labels/consent/success text are
// real fields on ContactForm/CONTENT_GUIDE.md's existing form-field
// carve-out, deliberately not duplicated into this registry this phase —
// the inquiry-submission logic they sit beside stays untouched either way.
const CONTACT_EDITABLE_FIELDS: EditableFieldDef[] = [
  { contentId: "contact.hero.eyebrow", path: "eyebrow", label: "Hero eyebrow", type: "plainText", group: "Hero", maxLength: 80, contentScope: "page" },
  { contentId: "contact.hero.heading", path: "title", label: "Hero heading", type: "heading", group: "Hero", maxLength: 140, contentScope: "page" },
  { contentId: "contact.hero.description", path: "description", label: "Hero description", type: "plainText", group: "Hero", maxLength: 400, contentScope: "page" },
];

const FIELDS_BY_PAGE: Record<string, EditableFieldDef[]> = {
  home: HOME_EDITABLE_FIELDS,
  about: ABOUT_EDITABLE_FIELDS,
  therapists: THERAPISTS_EDITABLE_FIELDS,
  "support-groups": SUPPORT_GROUPS_EDITABLE_FIELDS,
  donate: DONATE_EDITABLE_FIELDS,
  intake: INTAKE_EDITABLE_FIELDS,
  faq: FAQ_EDITABLE_FIELDS,
  contact: CONTACT_EDITABLE_FIELDS,
};

export function getEditableFields(pageKey: string): EditableFieldDef[] {
  return FIELDS_BY_PAGE[pageKey] ?? [];
}

export function getFieldByContentId(pageKey: string, contentId: string): EditableFieldDef | undefined {
  return getEditableFields(pageKey).find((f) => f.contentId === contentId);
}
