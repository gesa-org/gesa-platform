import type { HeaderContent } from "@/lib/content";

// Phase 117 — the single source of truth for the site's primary destination
// pages (the top-nav items in components/Header.tsx), read by both
// Header.tsx and Footer.tsx's "Explore" column so the two can never drift
// out of sync again.
//
// The bug this fixes: Footer previously had its own separate
// exploreAboutLabel/exploreTherapistsLabel/exploreSupportGroupsLabel
// Content-Manager fields, editable independently of Header's own
// homeLabel/aboutLabel/therapistsLabel/supportGroupsLabel — and on the live
// site they'd already drifted apart (the footer called /therapists "Find
// Support" while the header called that same route "Our Professionals").
// Two separately-editable fields for "the label of the same link" was the
// root cause, not a one-off copy mistake, so the fix is structural: there is
// now exactly one editable label per route (HeaderContent's), and Footer
// reads it from there instead of keeping its own copy.
//
// `href` stays fixed in code for every item except Donate, matching this
// codebase's existing rule (see Header.tsx's Phase 35 comment) that only the
// visible label is admin-editable, not the destination — Donate is the one
// documented exception, since HeaderContent.donateHref has been
// Content-Manager-editable since Phase 93/98.
//
// `contentField` names which HeaderContent key holds the live, translated
// label for this route, so Header and Footer both read the exact same
// string from the exact same fetched object (app/layout.tsx fetches
// HeaderContent once and passes it to both). Hebrew translation needs no
// separate handling here either — TranslationProvider's DOM-rewrite
// translator matches on the rendered text itself, so a label that's already
// in the Hebrew dictionary for the header translates identically wherever
// else it's rendered from the same content field.
export type PrimaryNavItem = {
  key: string;
  href: string | ((content: HeaderContent) => string);
  contentField: keyof HeaderContent;
  showInHeader: boolean;
  showInFooterExplore: boolean;
  // No dedicated mobile nav menu exists in this codebase today (Header's
  // <nav> is `hidden md:flex` — mobile visitors currently get no nav links
  // at all, only the logo/donate/language/auth controls). Not a change made
  // this phase — flagged here rather than silently left unrepresented, and
  // wired for whenever that mobile menu gets built so it can filter on this
  // same flag instead of inventing a third list.
  showOnMobile: boolean;
};

export const PRIMARY_NAVIGATION: PrimaryNavItem[] = [
  { key: "about", href: "/", contentField: "homeLabel", showInHeader: true, showInFooterExplore: true, showOnMobile: true },
  { key: "findSupport", href: "/about", contentField: "aboutLabel", showInHeader: true, showInFooterExplore: true, showOnMobile: true },
  { key: "professionals", href: "/therapists", contentField: "therapistsLabel", showInHeader: true, showInFooterExplore: true, showOnMobile: true },
  { key: "community", href: "/support-groups", contentField: "supportGroupsLabel", showInHeader: true, showInFooterExplore: true, showOnMobile: true },
  {
    key: "donate",
    href: (content) => content.donateHref,
    contentField: "donateLabel",
    showInHeader: true,
    showInFooterExplore: true,
    showOnMobile: true,
  },
];

export function resolveNavHref(item: PrimaryNavItem, content: HeaderContent): string {
  return typeof item.href === "function" ? item.href(content) : item.href;
}

// Used by Footer.tsx — every item flagged showInFooterExplore, resolved
// against the same HeaderContent object the header itself renders from.
export function getFooterExploreItems(content: HeaderContent) {
  return PRIMARY_NAVIGATION.filter((item) => item.showInFooterExplore).map((item) => ({
    key: item.key,
    href: resolveNavHref(item, content),
    label: content[item.contentField] as string,
  }));
}
