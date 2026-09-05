"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Undo2,
  Redo2,
  RotateCcw,
  UploadCloud,
  AlertTriangle,
  Search,
  MousePointerClick,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react";
import dynamic from "next/dynamic";
import Button from "@/components/ui/Button";
import { usePageEditorState } from "@/lib/ui-builder/usePageEditorState";
import { PAGE_DEFINITIONS, getEditableFields, getFieldByContentId, getPageKeyForContentId, getRichTextMode, type PageGroup } from "@/lib/ui-builder/pageRegistry";

// Phase 134 — lazy-loaded, admin-only. Tiptap (~40kb) only ever downloads
// when an admin actually selects a richText field, not just for opening the
// Page Editor tab at all — matching "lazy-load rich text editor and heavy
// controls" from the original spec.
const RichTextEditor = dynamic(() => import("@/components/admin/ui-builder/RichTextEditor"), {
  ssr: false,
  loading: () => <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-border text-[13px] text-muted-fg">Loading editor…</div>,
});

// Phase 133 — the Visual Page Editor's admin-side shell. This is the parent
// half of the typed postMessage protocol; components/ui-builder/public/
// EditorPreviewBridge.tsx (mounted inside the iframe) is the other half.
// Only ever imported by app/admin/ui-builder/page.tsx — never by any public
// page — so none of this (or its heavier future siblings, a rich-text
// toolbar and media picker) ever ships in the public bundle.
const GROUP_LABELS: Record<PageGroup, string> = {
  core: "Core pages",
  support: "Support pages",
  legal: "Legal pages",
  system: "System pages",
};

const VIEWPORTS = {
  desktop: { label: "Desktop", icon: Monitor, width: "100%" },
  tablet: { label: "Tablet", icon: Tablet, width: "768px" },
  mobile: { label: "Mobile", icon: Smartphone, width: "390px" },
} as const;

type SelectMessage = { type: "GESA_EDITOR_SELECT_ELEMENT"; contentId: string; label: string };
function isSelectMessage(data: unknown): data is SelectMessage {
  return Boolean(
    data &&
      typeof data === "object" &&
      (data as { type?: unknown }).type === "GESA_EDITOR_SELECT_ELEMENT" &&
      typeof (data as { contentId?: unknown }).contentId === "string"
  );
}

// Phase 134 — character counts for richText fields count visible text, not
// markup, so wrapping a paragraph in <strong> doesn't inflate the count
// against a plain-text field's same length limit. A quick tag-strip, not a
// security boundary — sanitizeRichTextHtml (server-side, on save) is what
// actually protects the stored value.
function stripTagsForCount(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

export default function PageEditorShell() {
  const [search, setSearch] = useState("");
  const [selectedPageKey, setSelectedPageKey] = useState("home");
  const [editModeEnabled, setEditModeEnabled] = useState(false);
  const [viewport, setViewport] = useState<keyof typeof VIEWPORTS>("desktop");
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const pageDef = PAGE_DEFINITIONS.find((p) => p.pageKey === selectedPageKey);
  const editor = usePageEditorState(selectedPageKey, Boolean(pageDef?.supportsVisualEditor));

  const filteredPages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PAGE_DEFINITIONS;
    return PAGE_DEFINITIONS.filter((p) => p.title.toLowerCase().includes(q) || p.route.toLowerCase().includes(q));
  }, [search]);

  const grouped = useMemo(() => {
    const groups: Record<PageGroup, typeof PAGE_DEFINITIONS> = { core: [], support: [], legal: [], system: [] };
    for (const p of filteredPages) groups[p.group].push(p);
    return groups;
  }, [filteredPages]);

  const fields = getEditableFields(selectedPageKey);
  const layersByGroup = useMemo(() => {
    const groups = new Map<string, typeof fields>();
    for (const f of fields) {
      if (!groups.has(f.group)) groups.set(f.group, []);
      groups.get(f.group)!.push(f);
    }
    return groups;
  }, [fields]);

  // Phase 140 — a global lookup, not scoped to `selectedPageKey`: Header/
  // Footer/CrisisButton ("global" fields) render on every page's own
  // canvas, so a click there needs to resolve correctly regardless of which
  // page happens to be selected in the Navigator (see getFieldByContentId's
  // own comment in pageRegistry.ts).
  const selectedField = selectedContentId ? getFieldByContentId(selectedContentId) : undefined;
  const selectedFieldPageKey = selectedContentId ? getPageKeyForContentId(selectedContentId) : undefined;
  const selectedFieldPageTitle = selectedFieldPageKey ? PAGE_DEFINITIONS.find((p) => p.pageKey === selectedFieldPageKey)?.title : undefined;

  function postToIframe(message: unknown) {
    iframeRef.current?.contentWindow?.postMessage(message, window.location.origin);
  }

  // Selecting from either the canvas (postMessage) or the Layers list both
  // funnel through here, so the two stay in sync — clicking a Layers item
  // also tells the iframe to draw its outline on that element and scroll it
  // into view, matching the spec's "keep the tree selection synchronized
  // with canvas selection."
  function selectContentId(contentId: string | null) {
    setSelectedContentId(contentId);
    postToIframe({ type: "GESA_EDITOR_SET_SELECTION", contentId });
    if (contentId) postToIframe({ type: "GESA_EDITOR_SCROLL_TO_ELEMENT", contentId });
  }

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "GESA_EDITOR_READY") {
        setIframeReady(true);
        postToIframe({ type: "GESA_EDITOR_SET_EDIT_MODE", enabled: editModeEnabled });
        if (selectedContentId) postToIframe({ type: "GESA_EDITOR_SET_SELECTION", contentId: selectedContentId });
        return;
      }
      if (isSelectMessage(event.data)) {
        // Phase 140 — Header/Footer/CrisisButton ("global" fields) render
        // on every page's canvas alongside whatever page is selected, so a
        // click can resolve to a field that belongs to a *different* page
        // than `selectedPageKey`. Switching the Navigator's own selection to
        // that field's real owning page keeps the Layers list, inspector,
        // and draft state all pointed at the same page the clicked field
        // actually lives on — the one accepted tradeoff is that this can
        // reload the canvas to that page's own route (e.g. clicking a
        // Header link while browsing About switches to "Global," whose
        // route is Home) rather than silently failing to select at all.
        const owningPageKey = getPageKeyForContentId(event.data.contentId);
        if (owningPageKey && owningPageKey !== selectedPageKey) {
          setSelectedPageKey(owningPageKey);
        }
        selectContentId(event.data.contentId);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editModeEnabled, selectedContentId, selectedPageKey]);

  useEffect(() => {
    if (iframeReady) postToIframe({ type: "GESA_EDITOR_SET_EDIT_MODE", enabled: editModeEnabled });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editModeEnabled, iframeReady]);

  function selectPage(pageKey: string) {
    setSelectedPageKey(pageKey);
    setSelectedContentId(null);
    setIframeReady(false);
  }

  function updateSelectedField(value: string) {
    if (!selectedContentId) return;
    editor.setField(selectedContentId, value);
    postToIframe({ type: "GESA_EDITOR_UPDATE_PREVIEW", contentId: selectedContentId, value });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr_320px]">
      {/* Page Navigator + Layers */}
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-card p-3">
          <h3 className="mb-2 text-[13px] font-semibold text-muted-fg">Pages</h3>
          <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5">
            <Search size={13} className="text-muted-fg" />
            <input
              type="text"
              placeholder="Search pages"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-[13px] outline-none"
              aria-label="Search pages"
            />
          </div>
          <div className="flex max-h-[280px] flex-col gap-3 overflow-y-auto">
            {(Object.keys(GROUP_LABELS) as PageGroup[]).map((group) =>
              grouped[group].length > 0 ? (
                <div key={group}>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">{GROUP_LABELS[group]}</p>
                  <div className="flex flex-col gap-0.5">
                    {grouped[group].map((p) => (
                      <button
                        key={p.pageKey}
                        type="button"
                        onClick={() => selectPage(p.pageKey)}
                        className={`rounded-lg px-2.5 py-1.5 text-left text-[13px] ${
                          selectedPageKey === p.pageKey ? "bg-accent-soft text-primary font-medium" : "hover:bg-secondary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{p.title}</span>
                          {!p.supportsVisualEditor && <span className="text-[10px] text-muted-fg">Global only</span>}
                        </div>
                        <div className="text-[11px] text-muted-fg">{p.route}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>

        {pageDef?.supportsVisualEditor && (
          <div className="rounded-2xl border border-border bg-card p-3">
            <h3 className="mb-2 text-[13px] font-semibold text-muted-fg">Layers</h3>
            <div className="flex max-h-[320px] flex-col gap-3 overflow-y-auto">
              {Array.from(layersByGroup.entries()).map(([group, groupFields]) => (
                <div key={group}>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">{group}</p>
                  <div className="flex flex-col gap-0.5">
                    {groupFields.map((f) => (
                      <button
                        key={f.contentId}
                        type="button"
                        onClick={() => selectContentId(f.contentId)}
                        className={`rounded-lg px-2.5 py-1 text-left text-[12.5px] ${
                          selectedContentId === f.contentId ? "bg-accent-soft text-primary font-medium" : "hover:bg-secondary/50"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
          <Button
            type="button"
            size="sm"
            variant={editModeEnabled ? "primary" : "outline"}
            onClick={() => setEditModeEnabled((v) => !v)}
            disabled={!pageDef?.supportsVisualEditor}
          >
            <MousePointerClick size={14} /> {editModeEnabled ? "Edit mode: On" : "Edit mode: Off"}
          </Button>
          <div className="flex-1" />
          {(Object.keys(VIEWPORTS) as (keyof typeof VIEWPORTS)[]).map((key) => {
            const V = VIEWPORTS[key];
            const Icon = V.icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setViewport(key)}
                aria-label={V.label}
                aria-pressed={viewport === key}
                className={`rounded-lg p-1.5 ${viewport === key ? "bg-accent-soft text-primary" : "text-muted-fg hover:bg-secondary/50"}`}
              >
                <Icon size={15} />
              </button>
            );
          })}
        </div>
        <div className="flex flex-1 items-start justify-center overflow-auto bg-secondary/30 p-4">
          {pageDef?.supportsVisualEditor ? (
            <iframe
              key={selectedPageKey}
              ref={iframeRef}
              src={`${pageDef.route}?editorPreview=true`}
              title={`${pageDef.title} preview`}
              onLoad={() => setIframeReady(false)}
              style={{ width: VIEWPORTS[viewport].width }}
              className="h-[calc(100vh-260px)] min-h-[480px] w-full rounded-xl border-0 bg-white shadow-soft"
            />
          ) : (
            <div className="flex h-[300px] max-w-md flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 text-center">
              <AlertTriangle size={20} className="text-muted-fg" />
              {/* Phase 140 — the 5 legal pages now support the visual canvas
                  too (see pageRegistry.ts's `legalPageSlug` branch), so this
                  message no longer needs a legal-specific case — every page
                  reaching this branch genuinely has no field registry yet. */}
              <p className="text-[13px] text-muted-fg">
                {`${pageDef?.title ?? "This page"} doesn't support the visual click-to-edit canvas yet. Use the existing Content Manager to edit its text, or the Global Theme tab here for site-wide colors and typography.`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Inspector */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
          <Button type="button" variant="outline" size="sm" onClick={editor.undo} disabled={!editor.canUndo}>
            <Undo2 size={14} />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={editor.redo} disabled={!editor.canRedo}>
            <Redo2 size={14} />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={editor.discardDraft} disabled={editor.loading}>
            <RotateCcw size={14} /> Discard
          </Button>
          <div className="flex-1" />
          <Button type="button" size="sm" onClick={editor.publish} disabled={editor.publishing || editor.loading || !pageDef?.supportsVisualEditor}>
            <UploadCloud size={14} /> {editor.publishing ? "Publishing…" : "Publish"}
          </Button>
        </div>
        <p aria-live="polite" className="text-[12px] text-muted-fg">
          {editor.saving ? "Saving draft…" : editor.loading ? "Loading…" : "Draft up to date"}
        </p>
        {editor.error && (
          <div className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3.5 py-3 text-[13px] text-destructive" role="alert">
            <AlertTriangle size={15} className="mt-0.5 flex-none" />
            <span>{editor.error}</span>
          </div>
        )}
        {editor.lastPublishedAt && (
          <p className="text-[12px] text-muted-fg">Published {new Date(editor.lastPublishedAt).toLocaleString()}.</p>
        )}

        <div className="rounded-2xl border border-border bg-card p-4">
          {!selectedField ? (
            <>
              <h3 className="mb-1 text-[15px] font-semibold">Select an element</h3>
              <p className="text-[13px] text-muted-fg">
                Turn on Edit mode, then choose an item from the Layers list or click a highlighted element in the
                preview to edit it here.
              </p>
            </>
          ) : (
            <>
              <p className="mb-1 text-[12px] text-muted-fg">
                {selectedFieldPageTitle ?? pageDef?.title} / {selectedField.group} / {selectedField.label}
              </p>
              <h3 className="mb-3 text-[15px] font-semibold">{selectedField.label}</h3>
              {(() => {
                const richTextMode = getRichTextMode(selectedField);
                if (richTextMode === "none") {
                  return (
                    <input
                      type="text"
                      value={editor.fields[selectedField.contentId] ?? ""}
                      onChange={(e) => updateSelectedField(e.target.value)}
                      maxLength={selectedField.maxLength}
                      className="w-full rounded-xl border border-border px-3 py-2 text-[13px]"
                    />
                  );
                }
                return (
                  <RichTextEditor
                    key={selectedField.contentId}
                    value={editor.fields[selectedField.contentId] ?? ""}
                    onChange={(html) => updateSelectedField(html)}
                    mode={richTextMode}
                    maxLength={selectedField.maxLength}
                  />
                );
              })()}
              {selectedField.maxLength && (
                <p className="mt-1 text-right text-[11px] text-muted-fg">
                  {stripTagsForCount(editor.fields[selectedField.contentId] ?? "").length} / {selectedField.maxLength}
                </p>
              )}
              <p className="mt-3 border-t border-border pt-2 text-[11px] text-muted-fg">
                Content ID: <code className="rounded bg-secondary/60 px-1 py-0.5">{selectedField.contentId}</code>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
