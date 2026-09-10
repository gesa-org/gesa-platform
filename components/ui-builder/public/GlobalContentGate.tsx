"use client";

import { useEffect, useState, type ReactNode } from "react";
import Header, { HEADER_CONTENT_FALLBACK } from "@/components/Header";
import SiteFooterSlot from "@/components/SiteFooterSlot";
import CrisisButton, { CRISIS_BUTTON_CONTENT_FALLBACK } from "@/components/CrisisButton";
import { FOOTER_CONTENT_FALLBACK } from "@/components/Footer";
import EditorPreviewBridge from "@/components/ui-builder/public/EditorPreviewBridge";
import { getEditableFields } from "@/lib/ui-builder/pageRegistry";
import type { HeaderContent, FooterContent, CrisisButtonContent } from "@/lib/content";

// Phase 140 — Header/Footer/CrisisButton render once in app/layout.tsx, a
// Server Component that (unlike every page's own page.tsx) gets no
// `searchParams` prop from Next.js — a shared layout can't re-render per
// query string without breaking layout caching for every route under it.
// So the same "?editorPreview=true + admin session -> overlay the draft"
// gate every page.tsx applies server-side (see
// lib/ui-builder/pageContentResolver.ts's resolveEditorPreview) has to run
// client-side here instead.
//
// Phase 185 — this used to read the query string via next/navigation's
// useSearchParams(), which per Next's own docs forces the *entire* Client
// Component subtree up to the nearest Suspense boundary to bail out to
// client-side-only rendering on any route Next treats as prerendered/
// static. This component's child tree is `<Header>{children}<Footer>
// <CrisisButton>` — i.e. this one hook call put literally every page's
// entire real content inside that bailout boundary, not just the small
// editor-preview overlay logic it actually needed. That's the textbook
// shape of Next's own "missing/misplaced Suspense boundary" hydration
// footgun, and matches this site's long-standing, site-wide React
// hydration errors (#418/#423/#425, sometimes cascading into an
// unrecoverable #329 "Unknown root exit status" crash) tracked as an open
// issue before this phase.
//
// Fixed by dropping useSearchParams() entirely: `?editorPreview=true` is
// only ever read once, client-side, inside the effect below (via
// `window.location.search`, a plain browser global, not a React hook) —
// there's no reactivity lost in practice, since this component lives in
// the root layout and Next never remounts a shared layout on a same-layout
// navigation anyway (the exact constraint the original comment above
// already called out). Removing the hook removes the Suspense requirement
// entirely, so there's no fallback/real-content split left to mismatch:
// this component now renders the exact same tree on the server and on the
// client's first paint for every normal visitor, full stop.
//
// The published Header/Footer/CrisisButton content is still fetched
// server-side in app/layout.tsx (unchanged, zero risk to every normal
// request) and passed in as `headerContent`/`footerContent`/
// `crisisButtonContent` — a normal visitor (and the very first paint of an
// admin's own preview, before the client fetch below resolves) sees nothing
// different from before this phase. Only once mounted client-side, with
// `?editorPreview=true` in the URL, does this fetch the *same* admin-gated
// `/api/admin/ui-builder/page-content/draft?pageKey=global` route every
// other page's inspector already uses (no new API route) and overlay the
// result — a 401/403 (not signed in, or signed in as a non-admin) simply
// leaves the published content in place, matching every other page's own
// server-side admin gate exactly.
function buildOverlay(fields: Record<string, string>): {
  header: Partial<HeaderContent>;
  footer: Partial<FooterContent>;
  crisisButton: Partial<CrisisButtonContent>;
} {
  const overlay: { header: Record<string, string>; footer: Record<string, string>; crisisButton: Record<string, string> } = {
    header: {},
    footer: {},
    crisisButton: {},
  };
  for (const field of getEditableFields("global")) {
    const value = fields[field.contentId];
    if (value === undefined) continue;
    const dot = field.path.indexOf(".");
    if (dot === -1) continue;
    const namespace = field.path.slice(0, dot) as "header" | "footer" | "crisisButton";
    const key = field.path.slice(dot + 1);
    if (namespace === "header" || namespace === "footer" || namespace === "crisisButton") {
      overlay[namespace][key] = value;
    }
  }
  return overlay as { header: Partial<HeaderContent>; footer: Partial<FooterContent>; crisisButton: Partial<CrisisButtonContent> };
}

type GateProps = {
  headerContent: HeaderContent;
  footerContent: FooterContent;
  crisisButtonContent: CrisisButtonContent;
  children: ReactNode;
};

export default function GlobalContentGate({ headerContent, footerContent, crisisButtonContent, children }: GateProps) {
  const [isEditorPreview, setIsEditorPreview] = useState(false);
  const [overlay, setOverlay] = useState<{
    header: Partial<HeaderContent>;
    footer: Partial<FooterContent>;
    crisisButton: Partial<CrisisButtonContent>;
  } | null>(null);

  useEffect(() => {
    // Phase 185 — read directly off the browser's own URL instead of
    // next/navigation's useSearchParams(), specifically so this component
    // needs no Suspense boundary at all (see the top-of-file comment). Only
    // ever runs once, on mount — see that same comment for why a shared
    // root layout not remounting on navigation makes that the correct
    // behavior here, not a regression.
    const wantsPreview = new URLSearchParams(window.location.search).get("editorPreview") === "true";
    if (!wantsPreview) return;
    let cancelled = false;
    fetch("/api/admin/ui-builder/page-content/draft?pageKey=global", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.fields) return;
        setOverlay(buildOverlay(data.fields as Record<string, string>));
        setIsEditorPreview(true);
      })
      .catch(() => {
        // Same-as-published fallback on any network/auth failure — no
        // different from a normal visitor's render.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const mergedHeader = overlay ? { ...headerContent, ...overlay.header } : headerContent;
  const mergedFooter = overlay ? { ...footerContent, ...overlay.footer } : footerContent;
  const mergedCrisisButton = overlay ? { ...crisisButtonContent, ...overlay.crisisButton } : crisisButtonContent;

  const tree = (
    <>
      <Header content={mergedHeader} />
      {children}
      <SiteFooterSlot footerContent={mergedFooter} headerContent={mergedHeader} />
      <CrisisButton content={mergedCrisisButton} />
    </>
  );

  return isEditorPreview ? <EditorPreviewBridge>{tree}</EditorPreviewBridge> : tree;
}

export { HEADER_CONTENT_FALLBACK, FOOTER_CONTENT_FALLBACK, CRISIS_BUTTON_CONTENT_FALLBACK };
