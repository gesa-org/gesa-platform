"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, GripVertical, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import type { Tables } from "@/lib/database.types";

type Partner = Tables<"partners">;

// Phase 203 — Trusted Partners. Follows FaqManager.tsx's existing pattern
// exactly: writes go straight to the table from the browser Supabase client
// (RLS-enforced via the new partners_admin_write policy, admin/super_admin),
// not a dedicated API route — this table has no storage or usage-tracking
// concerns of its own beyond the logo file, which is why logo upload is the
// one operation that goes through the existing Phase 201
// `/api/admin/media/upload` route instead (service-role, admin-checked,
// registers a media_assets row) — this component then just saves the
// returned publicUrl onto the partner's own `logo_url` column, the same
// "upload via the shared route, save the URL onto our own row" shape
// ImageFieldInspector.tsx uses for the Donate page's photos.
export default function PartnersManager({ initialPartners }: { initialPartners: Partner[] }) {
  const [partners, setPartners] = useState<Partner[]>(initialPartners);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function update(id: string, field: "name" | "link_url" | "logo_alt", val: string) {
    setPartners((ps) => ps.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
  }

  function toggleActive(id: string) {
    setPartners((ps) => ps.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p)));
  }

  async function save(partner: Partner) {
    setSavingId(partner.id);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("partners")
      .update({
        name: partner.name,
        link_url: partner.link_url,
        logo_alt: partner.logo_alt,
        is_active: partner.is_active,
        sort: partner.sort,
      })
      .eq("id", partner.id);
    setSavingId(null);
    if (error) setError("Couldn't save that partner — try again.");
  }

  async function addPartner() {
    const supabase = createClient();
    const nextSort = partners.length ? Math.max(...partners.map((p) => p.sort)) + 1 : 0;
    const { data, error } = await supabase
      .from("partners")
      .insert({ name: "New partner", sort: nextSort })
      .select()
      .single();
    if (!error && data) setPartners((ps) => [...ps, data]);
    else setError("Couldn't add a new partner — try again.");
  }

  async function removePartner(id: string) {
    if (!confirm("Delete this partner? This can't be undone.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("partners").delete().eq("id", id);
    if (!error) setPartners((ps) => ps.filter((p) => p.id !== id));
    else setError("Couldn't delete that partner — try again.");
  }

  async function moveSort(id: string, direction: -1 | 1) {
    const sorted = [...partners].sort((a, b) => a.sort - b.sort);
    const idx = sorted.findIndex((p) => p.id === id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    const supabase = createClient();
    await Promise.all([
      supabase.from("partners").update({ sort: b.sort }).eq("id", a.id),
      supabase.from("partners").update({ sort: a.sort }).eq("id", b.id),
    ]);
    setPartners((ps) => ps.map((p) => (p.id === a.id ? { ...p, sort: b.sort } : p.id === b.id ? { ...p, sort: a.sort } : p)));
  }

  async function onLogoSelected(partnerId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPG, PNG, or WebP logos are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Logo must be under 10MB.");
      return;
    }
    setUploadingId(partnerId);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("altText", "");
      formData.append("pathPrefix", "partners");
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.asset?.publicUrl) {
        setError(data?.error || "Upload failed — try again.");
        return;
      }
      const supabase = createClient();
      const { error } = await supabase.from("partners").update({ logo_url: data.asset.publicUrl }).eq("id", partnerId);
      if (error) {
        setError("Logo uploaded, but couldn't be saved to this partner — try again.");
        return;
      }
      setPartners((ps) => ps.map((p) => (p.id === partnerId ? { ...p, logo_url: data.asset.publicUrl } : p)));
    } catch {
      setError("Upload failed — check your connection and try again.");
    } finally {
      setUploadingId(null);
    }
  }

  const sortedPartners = [...partners].sort((a, b) => a.sort - b.sort);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-muted-fg">
        Shown in the footer&apos;s &quot;Our Trusted Partners&quot; row. Inactive partners stay here (for reuse
        later) but don&apos;t appear on the live site.
      </p>
      {error && <p className="text-[13px] text-destructive">{error}</p>}
      {sortedPartners.map((p, i) => (
        <div key={p.id} className="rounded-xl border border-border p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[12.5px] font-semibold uppercase tracking-wide text-muted-fg">
              <GripVertical size={14} /> Partner {i + 1}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveSort(p.id, -1)}
                disabled={i === 0}
                className="rounded-lg px-2 py-1 text-[12px] text-muted-fg hover:bg-secondary disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveSort(p.id, 1)}
                disabled={i === sortedPartners.length - 1}
                className="rounded-lg px-2 py-1 text-[12px] text-muted-fg hover:bg-secondary disabled:opacity-40"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removePartner(p.id)}
                className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
                aria-label="Delete partner"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary">
              {p.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.logo_url} alt={p.logo_alt ?? ""} className="h-full w-full object-contain" />
              ) : (
                <span className="text-[10px] text-muted-fg">No logo</span>
              )}
            </div>
            <input
              ref={(el) => {
                fileInputRefs.current[p.id] = el;
              }}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => onLogoSelected(p.id, e)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRefs.current[p.id]?.click()}
              disabled={uploadingId === p.id}
            >
              <Upload size={14} /> {uploadingId === p.id ? "Uploading…" : p.logo_url ? "Replace logo" : "Upload logo"}
            </Button>
          </div>

          <input
            value={p.name}
            onChange={(e) => update(p.id, "name", e.target.value)}
            placeholder="Partner name"
            className="mb-2 w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
          <input
            value={p.link_url ?? ""}
            onChange={(e) => update(p.id, "link_url", e.target.value)}
            placeholder="Link (optional) — https://…"
            className="mb-2 w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
          <input
            value={p.logo_alt ?? ""}
            onChange={(e) => update(p.id, "logo_alt", e.target.value)}
            placeholder="Logo alt text (optional)"
            className="mb-2 w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[13px] text-muted-fg">
              <input type="checkbox" checked={p.is_active} onChange={() => toggleActive(p.id)} />
              Active (shown on the live site)
            </label>
            <Button size="sm" variant="outline" onClick={() => save(p)} disabled={savingId === p.id}>
              {savingId === p.id ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addPartner}
        className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[13px] font-medium text-primary hover:bg-secondary"
      >
        <Plus size={14} /> Add partner
      </button>
    </div>
  );
}
