"use client";

import { useRef, useState } from "react";
import { Upload, Trash2, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024; // 10MB, per spec

function fileNameFromUrl(url: string): string {
  if (!url) return "";
  try {
    const path = url.split("?")[0];
    return decodeURIComponent(path.substring(path.lastIndexOf("/") + 1));
  } catch {
    return url;
  }
}

// Phase 202 — the image-editing panel for any `type: "image"` field in the
// visual Page Editor's Inspector (PageEditorShell.tsx), starting with the
// Donate page's 3 "why your support matters" photos. Uploads go through the
// existing Phase 201 `/api/admin/media/upload` route (admin/super_admin-
// checked, service-role storage write, registers a media_assets row) — this
// panel doesn't talk to Storage directly, and doesn't create/touch a
// media_asset_usages row either, since these fields' "current usage" is
// simply whatever `site_content`/`crm_ui_drafts` value they're at, tracked
// the same way every other page-content field on this site already is.
//
// Everything here writes to the *draft* only (via the `onImageChange`/
// `onAltChange` callbacks PageEditorShell wires to `editor.setField` +
// a live iframe postMessage) — nothing is fetched from or written to
// `site_content` (the published row) until the Inspector's own Publish
// button runs, exactly like every text field's draft/publish flow.
export default function ImageFieldInspector({
  imageValue,
  altValue,
  hasAltField,
  onImageChange,
  onAltChange,
}: {
  imageValue: string;
  altValue: string;
  /** False for an "image" field that (unexpectedly) has no paired altText
   * field registered — the alt input still renders, but changes to it have
   * nowhere to be saved, so this disables it with an explanatory note
   * rather than silently discarding what an admin types. */
  hasAltField: boolean;
  onImageChange: (url: string) => void;
  onAltChange: (alt: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, or WebP images are supported.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 10MB.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("altText", altValue);
      formData.append("pathPrefix", "ui-builder");
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.asset?.publicUrl) {
        setError(data?.error || "Upload failed — try again.");
        return;
      }
      onImageChange(data.asset.publicUrl);
    } catch {
      setError("Upload failed — check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    onImageChange("");
    setConfirmingRemove(false);
  }

  const missingAlt = Boolean(imageValue) && !altValue.trim();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary">
        {imageValue ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageValue} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[12px] text-muted-fg">No image set — the page&apos;s built-in default renders instead</span>
        )}
      </div>

      {imageValue && (
        <p className="truncate text-[11.5px] text-muted-fg" title={imageValue}>
          {fileNameFromUrl(imageValue)}
        </p>
      )}

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileSelected} />
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <Upload size={14} /> {uploading ? "Uploading…" : imageValue ? "Replace image" : "Upload image"}
        </Button>
        {imageValue && !confirmingRemove && (
          <button
            type="button"
            onClick={() => setConfirmingRemove(true)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-destructive hover:bg-destructive/10"
          >
            <Trash2 size={13} /> Remove
          </button>
        )}
      </div>

      {confirmingRemove && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5">
          <p className="mb-2 text-[12.5px] text-destructive">
            Remove this image? The page will show its built-in default until you upload a new one. This won&apos;t
            affect the live site until you Publish.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={removeImage} className="rounded-lg bg-destructive px-2.5 py-1 text-[12px] font-medium text-white">
              Remove
            </button>
            <button type="button" onClick={() => setConfirmingRemove(false)} className="rounded-lg px-2.5 py-1 text-[12px] text-muted-fg hover:bg-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="flex items-start gap-1.5 text-[12px] text-destructive">
          <AlertTriangle size={13} className="mt-0.5 flex-none" /> {error}
        </p>
      )}

      <div>
        <label className="mb-1 block text-[12px] font-semibold">
          Alt text <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={altValue}
          onChange={(e) => onAltChange(e.target.value)}
          disabled={!hasAltField}
          placeholder="Describe what's in the photo, for screen readers"
          maxLength={200}
          className="w-full rounded-xl border border-border px-3 py-2 text-[13px] disabled:opacity-50"
        />
        {missingAlt && (
          <p className="mt-1 flex items-center gap-1 text-[11.5px] text-destructive">
            <AlertTriangle size={12} /> Required before publishing.
          </p>
        )}
        {!hasAltField && (
          <p className="mt-1 text-[11px] text-muted-fg">No alt text field is registered for this image.</p>
        )}
      </div>

      <p className="rounded-lg bg-secondary/60 p-2.5 text-[11.5px] leading-relaxed text-muted-fg">
        Recommended: a landscape photo, at least 1600 × 1000px, as a JPG, PNG, or WebP under 10MB.
      </p>
    </div>
  );
}
