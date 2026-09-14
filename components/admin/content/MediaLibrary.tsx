"use client";

import { useRef, useState } from "react";
import { Upload, Trash2, Pencil, Check, X } from "lucide-react";
import Button from "@/components/ui/Button";
import type { MediaAssetRow, MediaAssetUsageRow } from "@/lib/database.types";
import { mediaSlotLabel, MEDIA_SLOT_LABELS } from "@/lib/mediaSlots";

const ASSIGNABLE_SLOTS = Object.entries(MEDIA_SLOT_LABELS).map(([key, label]) => {
  const [pageKey, sectionKey] = key.split(":");
  return { pageKey, sectionKey, label };
});

type AssetWithUsages = MediaAssetRow & { publicUrl: string; usages: MediaAssetUsageRow[] };

// Phase 201 — the Media Library tab. Every image currently uploaded through
// this system (not the older per-field ImageUploadField.tsx uploads, which
// store a bare URL string on a content row with no tracking — those still
// work as before and are out of scope here) shows up with its usage list,
// so an admin can see exactly which page/section a photo feeds before
// replacing or deleting it, per the brief's "remove only when not in use,
// else show a usage warning" rule. All writes go through
// app/api/admin/media/* (service-role, re-checks admin/super_admin
// server-side) rather than direct table access, since uploads need the
// service-role client to bypass a storage-policy gap that predates this
// feature (see that route's own comment) and deletes need a pre-check
// against media_asset_usages before the database's own `on delete restrict`
// would otherwise reject them with a raw error.
export default function MediaLibrary({ initialAssets }: { initialAssets: AssetWithUsages[] }) {
  const [assets, setAssets] = useState<AssetWithUsages[]>(initialAssets);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAlt, setEditAlt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("altText", "");
    formData.append("pathPrefix", "media-library");
    const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
    const data = await res.json().catch(() => null);
    setUploading(false);
    if (!res.ok || !data?.asset) {
      setError(data?.error || "Upload failed — try again.");
      return;
    }
    setAssets((prev) => [{ ...data.asset, usages: [] }, ...prev]);
  }

  async function saveAlt(id: string) {
    const res = await fetch(`/api/admin/media/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alt_text: editAlt }),
    });
    if (res.ok) {
      setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, alt_text: editAlt } : a)));
      setEditingId(null);
    } else {
      setError("Couldn't save that alt text — try again.");
    }
  }

  async function assignToSlot(assetId: string, slotKey: string) {
    if (!slotKey) return;
    const [pageKey, sectionKey] = slotKey.split(":");
    const res = await fetch("/api/admin/media/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId, pageKey, sectionKey }),
    });
    if (!res.ok) {
      setError("Couldn't assign that image — try again.");
      return;
    }
    // Optimistic update: drop this (pageKey, sectionKey) usage from every
    // other asset that had it (a slot can only point at one asset at a
    // time — see assign/route.ts's upsert), then add it to this one.
    setAssets((prev) =>
      prev.map((a) => {
        const usages = a.usages.filter((u) => !(u.page_key === pageKey && u.section_key === sectionKey));
        if (a.id === assetId) {
          usages.push({ id: crypto.randomUUID(), media_asset_id: assetId, page_key: pageKey, section_key: sectionKey, created_at: new Date().toISOString() });
        }
        return { ...a, usages };
      })
    );
  }

  async function removeAsset(asset: AssetWithUsages) {
    if (asset.usages.length > 0) {
      setError(
        `"${asset.file_name}" is still in use on: ${asset.usages
          .map((u) => mediaSlotLabel(u.page_key, u.section_key))
          .join(", ")}. Unassign it there first.`
      );
      return;
    }
    if (!confirm(`Delete "${asset.file_name}"? This can't be undone.`)) return;
    const res = await fetch(`/api/admin/media/${asset.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    } else {
      setError(data?.error || "Couldn't delete this image.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-fg">
          Every image uploaded here is tracked with its own alt text and a live usage list, so you can see exactly
          which page and section a photo feeds before replacing or deleting it.
        </p>
        <div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
          <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload size={14} /> {uploading ? "Uploading…" : "Upload image"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-[13px] text-destructive">
          {error}
        </p>
      )}

      {assets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-[13.5px] text-muted-fg">
          No images uploaded yet. Images uploaded here can be assigned to any page section that supports the Media
          Library (currently: the Donate page&apos;s &quot;Why your support matters&quot; photos — more sections
          adopt this as their editors are migrated).
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <div key={asset.id} className="overflow-hidden rounded-xl border border-border">
              <div className="aspect-[4/3] w-full bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.publicUrl} alt={asset.alt_text} className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col gap-2 p-3">
                <p className="truncate text-[12.5px] font-semibold" title={asset.file_name}>
                  {asset.file_name}
                </p>

                {editingId === asset.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      value={editAlt}
                      onChange={(e) => setEditAlt(e.target.value)}
                      placeholder="Alt text"
                      className="w-full rounded-lg border border-border px-2 py-1 text-[12.5px] focus:border-primary focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => saveAlt(asset.id)}
                      className="rounded-lg p-1 text-primary hover:bg-secondary"
                      aria-label="Save alt text"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-lg p-1 text-muted-fg hover:bg-secondary"
                      aria-label="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(asset.id);
                      setEditAlt(asset.alt_text);
                    }}
                    className="flex items-center gap-1 text-left text-[12px] text-muted-fg hover:text-primary"
                  >
                    <Pencil size={12} />{" "}
                    {asset.alt_text ? asset.alt_text : <span className="italic text-destructive">Missing alt text</span>}
                  </button>
                )}

                <div className="text-[11.5px] text-muted-fg">
                  {asset.usages.length > 0 ? (
                    <span>
                      Used on: {asset.usages.map((u) => mediaSlotLabel(u.page_key, u.section_key)).join("; ")}
                    </span>
                  ) : (
                    <span className="italic">Not currently used anywhere</span>
                  )}
                </div>

                <select
                  defaultValue=""
                  onChange={(e) => assignToSlot(asset.id, e.target.value)}
                  className="w-full rounded-lg border border-border px-2 py-1 text-[12px] focus:border-primary focus:outline-none"
                >
                  <option value="" disabled>
                    Assign to section…
                  </option>
                  {ASSIGNABLE_SLOTS.map((slot) => (
                    <option key={`${slot.pageKey}:${slot.sectionKey}`} value={`${slot.pageKey}:${slot.sectionKey}`}>
                      {slot.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => removeAsset(asset)}
                  className="mt-1 flex w-fit items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
