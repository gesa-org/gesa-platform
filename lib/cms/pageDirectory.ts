// Phase 236 — the "Website Pages" directory Roy asked for: one registry
// mapping every Content Manager tab to the real public route(s) it renders
// on, grouped the way he specified (Main / Conversion & Contact / Legal /
// Dynamic / Global). This is intentionally a plain TS constant, not a DB
// table — it mirrors this codebase's existing convention for this kind of
// static registry (see lib/ui-builder/pageRegistry.ts's PAGE_DEFINITIONS,
// lib/content.ts's SIMPLE_PAGE_ENTRIES), and a route only ever changes by a
// code change anyway, so there's no real content an admin needs to edit
// here — just a source of truth the directory UI reads.
//
// `tabLabel` is the exact string ContentManagerApp.tsx's tab switcher
// already uses for this entry — the directory's "Edit" action just sets
// that tab, so this file and that one must stay in sync (each entry's
// comment says which tab(s)/editor(s) it corresponds to).
export type PageDirectoryGroup =
  | "Main Pages"
  | "Conversion & Contact"
  | "Legal Pages"
  | "Dynamic Content"
  | "Global Content"
  // Phase 247 — Content Manager rebuild Phase 1: Roy asked for "Forms &
  // Popups" as its own filterable group, matching ContentManagerApp's own
  // tab grouping (FORMS_AND_POPUPS_TABS) — Donate Page, Donate Band, and
  // Volunteer Modal move here from "Main Pages"/"Global Content" below.
  | "Forms & Popups";

export type PageDirectoryEntry = {
  /** Unique id for this directory row — usually the primary site_content key. */
  id: string;
  /** Admin-friendly page name. */
  title: string;
  /** Every site_content key this entry's editor(s) read/write, for version-history lookups. */
  contentKeys: string[];
  /** The real public route this renders on. Null for global chrome with no route of its own. */
  route: string | null;
  group: PageDirectoryGroup;
  /** The ContentManagerApp tab to jump to for "Edit". */
  tabLabel: string;
  /** True if there's no site_content-backed editor for this route at all yet. */
  unmanaged?: boolean;
  /** Phase 247 — the matching lib/ui-builder/pageRegistry.ts `pageKey`, when
   * this entry also supports the visual editor. Lets the directory check
   * `crm_ui_drafts` for a pending, unpublished draft (the "Draft changes"
   * filter) — left undefined for entries with no visual-editor counterpart. */
  pageKey?: string;
  /** Phase 247 — true for content that's real, saved, and still editable,
   * but deliberately not part of the live site right now (a disabled page,
   * a retired section) — surfaced under the "Archived" filter instead of
   * mixed in with everything currently published. */
  archived?: boolean;
  note?: string;
};

export const PAGE_DIRECTORY: PageDirectoryEntry[] = [
  // ---- Main Pages ----
  { id: "page_home", title: "Home", contentKeys: ["page_home", "component_home_stats"], route: "/", group: "Main Pages", tabLabel: "About", pageKey: "home" },
  // Phase 247 — Content Manager rebuild Phase 1: corrected. This entry's
  // route/title/tabLabel were stale — page_about_hero/page_about_sections
  // has rendered at the real `/about` route since Phase 215 (see
  // lib/navigation.ts's history), not `/find-your-therapist`. The page
  // whose live nav label actually reads "Find Support" is the entry right
  // below this one (`page_support_groups`) — see its own Phase 247 note.
  { id: "page_about", title: "About Page", contentKeys: ["page_about_hero", "page_about_sections"], route: "/about", group: "Main Pages", tabLabel: "About Page", pageKey: "about" },
  { id: "page_therapists", title: "Our Professionals", contentKeys: ["page_therapists", "component_therapists_directory"], route: "/therapists", group: "Main Pages", tabLabel: "Our Professionals", pageKey: "therapists" },
  // Phase 247 — corrected to match the live nav: this is the page the
  // header/footer actually label "Find Support" (lib/navigation.ts's
  // `findSupport` nav item, href `/find-your-therapist`). Its third content
  // key, component_support_groups_directory, is the one exception — that
  // piece renders on `/support-groups` (the nav's "Community" link)
  // instead, a pre-existing bundling quirk flagged in both
  // ContentManagerApp.tsx's "Find Support" tab and pageRegistry.ts's
  // "support-groups" pageKey (Phase 222/246).
  {
    id: "page_support_groups",
    title: "Find Support",
    contentKeys: ["page_support_groups", "component_community_intro", "component_support_groups_directory"],
    route: "/find-your-therapist",
    group: "Main Pages",
    tabLabel: "Find Support",
    pageKey: "support-groups",
    note: "component_support_groups_directory (the registration flow) actually renders on /support-groups, not this route.",
  },
  { id: "page_donate", title: "Donate", contentKeys: ["page_donate"], route: "/donate", group: "Forms & Popups", tabLabel: "Donate Page", pageKey: "donate" },
  { id: "page_donate_thank_you", title: "Donate — Thank You", contentKeys: ["page_donate_thank_you"], route: "/donate/thank-you", group: "Forms & Popups", tabLabel: "Donate Page", note: "Edited inside the Donate Page tab, as its second section.", pageKey: "donate-thank-you" },
  // Phase 247 — Blog was real, saved content with no directory row at all
  // (SIMPLE_PAGE_ENTRIES/ContentManagerApp already had it; this directory
  // didn't). Added, and marked archived — see ContentManagerApp.tsx's own
  // Phase 247 "Archived" tab-group comment for the same content.
  { id: "page_blog", title: "Blog (disabled)", contentKeys: ["page_blog"], route: "/blog", group: "Main Pages", tabLabel: "Blog (disabled)", archived: true, note: "Site-wide disabled — /blog redirects to Home. Copy kept ready for when Blog is turned back on." },

  // ---- Conversion & Contact ----
  { id: "page_contact", title: "Contact", contentKeys: ["page_contact"], route: "/contact", group: "Conversion & Contact", tabLabel: "Contact", pageKey: "contact" },
  { id: "page_faq", title: "FAQ", contentKeys: ["page_faq"], route: "/faq", group: "Conversion & Contact", tabLabel: "FAQ", note: "Banner is CMS-managed here; individual questions are managed in the same tab's question list.", pageKey: "faq" },
  {
    id: "page_account_access",
    title: "Account Access (Sign In / Create Account)",
    contentKeys: [],
    route: "/account-access",
    group: "Conversion & Contact",
    tabLabel: "Account Access",
    unmanaged: true,
    note: "No Content Manager record exists for this route yet — every string on the page is hardcoded in app/account-access/page.tsx and its shared SignInForm/CreateAccountForm components.",
  },
  { id: "page_intake", title: "Intake / Crisis Triage", contentKeys: ["component_intake_flow"], route: "/intake", group: "Conversion & Contact", tabLabel: "Intake", pageKey: "intake" },

  // ---- Legal Pages (backed by the separate legal_pages table, not site_content) ----
  { id: "legal_privacy-policy", title: "Privacy Policy", contentKeys: [], route: "/privacy-policy", group: "Legal Pages", tabLabel: "Legal Pages", note: "Managed via the Legal Pages table editor, not site_content.", pageKey: "privacy-policy" },
  { id: "legal_cookies-policy", title: "Cookies Policy", contentKeys: [], route: "/cookies-policy", group: "Legal Pages", tabLabel: "Legal Pages", note: "Managed via the Legal Pages table editor, not site_content.", pageKey: "cookies-policy" },
  { id: "legal_legal-notice", title: "Legal Notice", contentKeys: [], route: "/legal-notice", group: "Legal Pages", tabLabel: "Legal Pages", note: "Managed via the Legal Pages table editor, not site_content.", pageKey: "legal-notice" },
  { id: "legal_accessibility-statement", title: "Accessibility Statement", contentKeys: [], route: "/accessibility-statement", group: "Legal Pages", tabLabel: "Legal Pages", note: "Managed via the Legal Pages table editor, not site_content.", pageKey: "accessibility-statement" },
  { id: "legal_terms-and-conditions", title: "Terms & Conditions", contentKeys: [], route: "/terms-and-conditions", group: "Legal Pages", tabLabel: "Legal Pages", note: "Managed via the Legal Pages table editor, not site_content.", pageKey: "terms-and-conditions" },

  // ---- Dynamic Content (data-driven from real records, not page copy) ----
  { id: "dynamic_therapist_profile", title: "Therapist Profile (per therapist)", contentKeys: [], route: "/therapists/[slug]", group: "Dynamic Content", tabLabel: "Our Professionals", note: "Rendered from each therapist's own record (Our Professionals CRM module), not page-level CMS content — expected, not a gap." },

  // ---- Global Content (site-wide chrome, no single route of its own) ----
  { id: "site_header", title: "Header & Navigation", contentKeys: ["site_header"], route: null, group: "Global Content", tabLabel: "Header", pageKey: "global" },
  { id: "page_footer", title: "Footer", contentKeys: ["page_footer"], route: null, group: "Global Content", tabLabel: "Footer", pageKey: "global" },
  { id: "component_crisis_button", title: "Crisis / Emergency Banner", contentKeys: ["component_crisis_button"], route: null, group: "Global Content", tabLabel: "Crisis Button", pageKey: "global" },
  { id: "trusted_partners", title: "Trusted Partners / Logo Strip", contentKeys: [], route: null, group: "Global Content", tabLabel: "Trusted Partners", note: "Managed via the partners table, not site_content." },
  { id: "page_not_found", title: "404 / Not Found Page", contentKeys: ["page_not_found"], route: "*", group: "Global Content", tabLabel: "Not Found Page" },

  // ---- Forms & Popups (Phase 247 — moved here from Global Content/Main
  // Pages to match ContentManagerApp's own FORMS_AND_POPUPS_TABS grouping) ----
  { id: "component_donate_band", title: "Global Donate CTA Band", contentKeys: ["component_donate_band"], route: null, group: "Forms & Popups", tabLabel: "Donate Band" },
  { id: "component_volunteer_modal", title: "Volunteer Application Modal", contentKeys: ["component_volunteer_modal"], route: null, group: "Forms & Popups", tabLabel: "Volunteer Modal" },
];

// site_content rows that exist in the live database but aren't read by any
// current KEYS list / editor (app/admin/content/page.tsx) or PAGE_DIRECTORY
// entry above — leftovers from earlier phases' content shapes that were
// since replaced. Flagged here so the directory's coverage view can surface
// them as "orphaned" instead of them sitting invisibly in the table forever.
// Confirmed via a direct `select key from site_content` against production
// as part of the Phase 236 audit — cross-check this list again if a lot of
// time passes, since a future phase could legitimately start reading one of
// these keys again.
export const KNOWN_ORPHANED_CONTENT_KEYS = [
  "about_page",
  "home_hero_media",
  "intake_config",
  "our_specialists",
  "paths_section",
  "preloader",
];

// Real public routes that exist on the live site (per the Phase 236 route
// audit of app/**/page.tsx) that intentionally have no Content Manager
// coverage because they're either account/auth flows with no marketing copy
// worth CMS-managing, or CRM-module pages already covered elsewhere. Not
// bugs — listed so the directory's "route not found in CMS" flag can
// distinguish a genuine gap (page_account_access above) from an
// intentionally-uncovered route.
export const INTENTIONALLY_UNMANAGED_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/account",
  "/account/bookings",
  "/messages",
  "/messages/[threadId]",
  "/guardian-consent",
  "/accept-invitation",
  "/blog",
  "/blog/[slug]",
];

export function findDirectoryEntry(id: string): PageDirectoryEntry | undefined {
  return PAGE_DIRECTORY.find((e) => e.id === id);
}
