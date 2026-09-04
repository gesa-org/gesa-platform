"use client";

import { useEffect, useRef, useState } from "react";
import { Undo2, Redo2, RotateCcw, UploadCloud, AlertTriangle, Lock } from "lucide-react";
import Button from "@/components/ui/Button";
import { useUIBuilderState } from "@/lib/ui-builder/useUIBuilderState";
import { designTokensToCssText } from "@/lib/ui-builder/tokensToCss";
import {
  HEADING_FONT_OPTIONS,
  BODY_FONT_OPTIONS,
  contrastRatio,
  WCAG_AA_NORMAL_TEXT,
  type DesignTokens,
} from "@/lib/ui-builder/types";

// Phase 132 — the admin UI Builder's main screen. Two functional modules
// today (Typography, Color) plus disabled placeholders for the two larger
// modules the original request also asked for (Image/Lighting,
// Layout/Reorder) — built as real, working controls rather than a full
// mockup of every module at once, so what ships is something Roy can
// actually verify and use immediately rather than a wall of unverifiable
// code (see EXECUTION_PLAN.md Phase 132 for the scoping conversation this
// followed). The placeholders are visibly disabled, not hidden — the shell
// they'll slot into (undo/redo, draft autosave, publish, live preview) is
// already built to hold them.
const COLOR_FIELDS: { key: keyof DesignTokens["colors"]; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
  { key: "background", label: "Background" },
  { key: "foreground", label: "Text (foreground)" },
];

export default function UIBuilderShell() {
  const ui = useUIBuilderState();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);

  // Live preview — postMessage the current draft's CSS into the iframe on
  // every change (spec item: "Real-Time Live Preview Pane"). The iframe
  // loads the real public site; app/layout.tsx's listener script applies
  // these as inline style overrides on <html>, so the preview always
  // reflects exactly what Publish would ship, rendered by the same code the
  // public site actually runs — not a separate mocked-up preview renderer.
  useEffect(() => {
    if (!iframeReady || !iframeRef.current?.contentWindow) return;
    const css = designTokensToCssText(ui.tokens);
    iframeRef.current.contentWindow.postMessage(
      { type: "gesa-ui-draft-preview", css },
      window.location.origin
    );
  }, [ui.tokens, iframeReady]);

  const textContrast = contrastRatio(ui.tokens.colors.foreground, ui.tokens.colors.background);
  const primaryContrast = contrastRatio(ui.tokens.colors.primary, ui.tokens.colors.background);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
      {/* Controls column */}
      <div className="flex flex-col gap-5">
        {/* Toolbar — Undo/Redo, Discard, Publish (spec item: "Global
            Actions & Workflow Engine"). */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
          <Button type="button" variant="outline" size="sm" onClick={ui.undo} disabled={!ui.canUndo}>
            <Undo2 size={14} /> Undo
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={ui.redo} disabled={!ui.canRedo}>
            <Redo2 size={14} /> Redo
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={ui.discardDraft} disabled={ui.loading}>
            <RotateCcw size={14} /> Discard draft
          </Button>
          <div className="flex-1" />
          <span className="text-[12px] text-muted-fg">
            {ui.saving ? "Saving draft…" : ui.source === "draft" ? "Draft saved" : ui.source === "published" ? "No unsaved changes" : ""}
          </span>
          <Button type="button" size="sm" onClick={ui.publish} disabled={ui.publishing || ui.loading}>
            <UploadCloud size={14} /> {ui.publishing ? "Publishing…" : "Publish"}
          </Button>
        </div>

        {ui.error && (
          <div className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3.5 py-3 text-[13px] text-destructive">
            <AlertTriangle size={15} className="mt-0.5 flex-none" />
            <span>{ui.error}</span>
          </div>
        )}
        {ui.lastPublishedAt && (
          <p className="text-[12px] text-muted-fg">
            Last published {new Date(ui.lastPublishedAt).toLocaleString()}. The live site&apos;s cache was flushed —
            visitors see this immediately, not on the next few-minute refresh.
          </p>
        )}

        {/* Color & Theme System */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 text-[15px] font-semibold">Color & Theme</h3>
          <div className="flex flex-col gap-3">
            {COLOR_FIELDS.map((f) => (
              <label key={f.key} className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-muted-fg">{f.label}</span>
                <span className="flex items-center gap-2">
                  <input
                    type="color"
                    value={ui.tokens.colors[f.key]}
                    onChange={(e) => ui.setColor(f.key, e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border border-border"
                    aria-label={`${f.label} color`}
                  />
                  <input
                    type="text"
                    value={ui.tokens.colors[f.key]}
                    onChange={(e) => ui.setColor(f.key, e.target.value)}
                    className="w-24 rounded-lg border border-border px-2 py-1 text-[13px]"
                  />
                </span>
              </label>
            ))}
          </div>
          {/* "Universal background color controls and contrast ratio
              verification safeguards" — spec item, module 3. Warns rather
              than blocks Publish; an admin may have a deliberate reason a
              particular pairing is decorative, not body text. */}
          <div className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3 text-[12px]">
            <ContrastRow label="Text on background" ratio={textContrast} />
            <ContrastRow label="Primary on background" ratio={primaryContrast} />
          </div>
        </section>

        {/* Typography & Text Engine */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 text-[15px] font-semibold">Typography</h3>
          <div className="flex flex-col gap-3 text-[13px]">
            <label className="flex flex-col gap-1">
              <span className="text-muted-fg">Heading font</span>
              <select
                value={ui.tokens.typography.headingFont}
                onChange={(e) => ui.setTypography("headingFont", e.target.value)}
                className="rounded-lg border border-border px-2 py-1.5"
              >
                {HEADING_FONT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-muted-fg">Body font</span>
              <select
                value={ui.tokens.typography.bodyFont}
                onChange={(e) => ui.setTypography("bodyFont", e.target.value)}
                className="rounded-lg border border-border px-2 py-1.5"
              >
                {BODY_FONT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <RangeRow
              label={`Base font size (${ui.tokens.typography.baseFontSize}px)`}
              min={14}
              max={20}
              step={1}
              value={ui.tokens.typography.baseFontSize}
              onChange={(v) => ui.setTypography("baseFontSize", v)}
            />
            <label className="flex flex-col gap-1">
              <span className="text-muted-fg">Heading weight</span>
              <select
                value={ui.tokens.typography.headingWeight}
                onChange={(e) => ui.setTypography("headingWeight", Number(e.target.value))}
                className="rounded-lg border border-border px-2 py-1.5"
              >
                <option value={500}>Medium (500)</option>
                <option value={600}>Semibold (600)</option>
                <option value={700}>Bold (700)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-muted-fg">Body weight</span>
              <select
                value={ui.tokens.typography.bodyWeight}
                onChange={(e) => ui.setTypography("bodyWeight", Number(e.target.value))}
                className="rounded-lg border border-border px-2 py-1.5"
              >
                <option value={300}>Light (300)</option>
                <option value={400}>Regular (400)</option>
                <option value={600}>Semibold (600)</option>
              </select>
            </label>
            <RangeRow
              label={`Line height (${ui.tokens.typography.lineHeight.toFixed(2)})`}
              min={1.2}
              max={2}
              step={0.05}
              value={ui.tokens.typography.lineHeight}
              onChange={(v) => ui.setTypography("lineHeight", v)}
            />
            <RangeRow
              label={`Label tracking, uppercase (${ui.tokens.typography.labelLetterSpacing.toFixed(2)}em)`}
              min={0}
              max={0.3}
              step={0.01}
              value={ui.tokens.typography.labelLetterSpacing}
              onChange={(v) => ui.setTypography("labelLetterSpacing", v)}
            />
          </div>
        </section>

        {/* Visual & Image Management Engine — planned, not built this phase.
            Shown (disabled) rather than omitted so the module map from the
            original request stays visible/trackable. */}
        <LockedSection
          title="Images & Media"
          note="Image insertion, backgrounds, and brightness controls — planned for a later phase."
        />

        {/* Layout, Spacing & Hierarchy Engine — planned, not built this
            phase (see note above). */}
        <LockedSection
          title="Layout & Sections"
          note="Section reordering, spacing, and trust-signal placement — planned for a later phase."
        />
      </div>

      {/* Live preview column */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <span className="text-[13px] font-semibold">Live preview</span>
          <span className="text-[12px] text-muted-fg">Reflects unsaved changes instantly</span>
        </div>
        <iframe
          ref={iframeRef}
          src="/"
          title="Live site preview"
          onLoad={() => setIframeReady(true)}
          className="h-[calc(100vh-220px)] min-h-[520px] w-full border-0"
        />
      </div>
    </div>
  );
}

function ContrastRow({ label, ratio }: { label: string; ratio: number }) {
  const passes = ratio >= WCAG_AA_NORMAL_TEXT;
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-fg">{label}</span>
      <span className={passes ? "text-primary" : "text-destructive"}>
        {ratio.toFixed(2)}:1 {passes ? "— passes AA" : "— below AA (4.5:1)"}
      </span>
    </div>
  );
}

function RangeRow({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-muted-fg">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function LockedSection({ title, note }: { title: string; note: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-secondary/30 p-4 opacity-70">
      <h3 className="mb-1 flex items-center gap-1.5 text-[15px] font-semibold text-muted-fg">
        <Lock size={14} /> {title}
      </h3>
      <p className="text-[12.5px] text-muted-fg">{note}</p>
    </section>
  );
}
