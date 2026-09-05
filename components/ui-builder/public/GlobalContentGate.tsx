"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
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
// client-side here instead: useSearchParams() works at any component depth,
// but only inside a <Suspense> boundary (Next's own requirement — without
// it, a client component reading the search string forces the *entire*
// route to de-opt to client-only rendering; wrapped in Suspense, only this
// one subtree does).
//
// The published Header/Footer/CrisisButton content is still fetched
// server-side in app/layout.tsx (unchanged, zero risk to every normal
// request) and passed in as `headerContent`/`footerContent`/
// `crisisButtonContent` — this component's Suspense fallback renders that
// exact published content, so a normal visitor (and the very first paint of
// an admin's own preview, before the client fetch below resolves) sees
// nothing different from before this phase. Only once mounted client-side,
// with `?editorPreview=true` in the URL, does this fetch the *same*
// admin-gated `/api/admin/ui-builder/page-content/draft?pageKey=global`
// route every other page's inspector already uses (no new API route) and
// overlay the result — a 401/403 (not signed in, or signed in as a
// non-admin) simply leaves the published content in place, matching every
// other page's own server-side admin gate exactly.
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

function StaticGlobalContent({ headerContent, footerContent, crisisButtonContent, children }: GateProps) {
  return (
    <>
      <Header content={headerContent} />
      {children}
      <SiteFooterSlot footerContent={footerContent} headerContent={headerContent} />
      <CrisisButton content={crisisButtonContent} />
    </>
  );
}

function GlobalContentInner({ headerContent, footerContent, crisisButtonContent, children }: GateProps) {
  const searchParams = useSearchParams();
  const wantsPreview = searchParams.get("editorPreview") === "true";
  const [isEditorPreview, setIsEditorPreview] = useState(false);
  const [overlay, setOverlay] = useState<{
    header: Partial<HeaderContent>;
    footer: Partial<FooterContent>;
    crisisButton: Partial<CrisisButtonContent>;
  } | null>(null);

  useEffect(() => {
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
  }, [wantsPreview]);

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

export default function GlobalContentGate(props: GateProps) {
  return (
    <Suspense fallback={<StaticGlobalContent {...props} />}>
      <GlobalContentInner {...props} />
    </Suspense>
  );
}

export { HEADER_CONTENT_FALLBACK, FOOTER_CONTENT_FALLBACK, CRISIS_BUTTON_CONTENT_FALLBACK };
