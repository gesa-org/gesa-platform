"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, CalendarCheck2, CalendarX2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import type { DiaryLinkStatus } from "@/lib/database.types";

// Phase 65 — Roy said toggling therapists active/deactivated one at a time
// through "Edit" was tiring once there are a lot of them, and asked for a
// shortcut to select several (or all) and change their status in one
// action. This wraps the same `therapists.update({ is_active })` call
// TherapistEditForm.tsx already uses for a single row, but batched via
// `.in("id", selectedIds)` for as many rows as are checked — the RLS
// policy gating that write is identical either way (Phase 24's
// admin-only update policy doesn't care how many ids are in the request).
export type TherapistListRow = {
  id: string;
  photo_url: string | null;
  full_name: string;
  languages: string[];
  is_active: boolean;
  // Phase 129 — surfaced here (not just on the individual edit page) per
  // Roy's "see whether a diary link is configured / active or missing"
  // requirement — an admin scanning the whole list can now spot a
  // therapist with no working scheduling link without opening each one.
  diary_link: string | null;
  diary_link_status: DiaryLinkStatus;
};

function DiaryLinkBadge({ diaryLink, status }: { diaryLink: string | null; status: DiaryLinkStatus }) {
  if (!diaryLink) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[12px] font-medium text-muted-fg">
        <CalendarX2 size={12} /> No diary link
      </span>
    );
  }
  if (status === "invalid") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-[12px] font-medium text-destructive">
        <AlertTriangle size={12} /> Link needs review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-medium text-primary">
      <CalendarCheck2 size={12} /> Diary link set
    </span>
  );
}

export default function TherapistsTable({ therapists: initialTherapists }: { therapists: TherapistListRow[] }) {
  const [therapists, setTherapists] = useState(initialTherapists);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = therapists.length > 0 && selectedIds.size === therapists.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(therapists.map((t) => t.id)));
  }

  async function bulkSetActive(nextActive: boolean) {
    if (selectedIds.size === 0) return;
    setPending(true);
    setError(null);
    const ids = Array.from(selectedIds);
    const supabase = createClient();
    const { error: updateError } = await supabase.from("therapists").update({ is_active: nextActive }).in("id", ids);
    setPending(false);
    if (updateError) {
      setError("Couldn't update those professionals — try again.");
      return;
    }
    // Optimistic local update, same pattern as TherapistEditForm's single-row
    // toggleActive — no full page refetch needed since the write already
    // succeeded under RLS.
    setTherapists((prev) => prev.map((t) => (selectedIds.has(t.id) ? { ...t, is_active: nextActive } : t)));
    setSelectedIds(new Set());
  }

  return (
    <div>
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-secondary/40 px-5 py-3">
          <span className="text-[13.5px] font-medium text-foreground">
            {selectedIds.size} selected
          </span>
          <Button size="sm" variant="primary" onClick={() => bulkSetActive(true)} disabled={pending}>
            {pending ? "Updating…" : "Activate selected"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulkSetActive(false)} disabled={pending}>
            {pending ? "Updating…" : "Deactivate selected"}
          </Button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-[13px] font-medium text-muted-fg hover:text-foreground"
          >
            Clear
          </button>
          {error && <span className="text-[13px] font-medium text-destructive">{error}</span>}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[14px]">
          <thead className="bg-secondary/60 text-[12.5px] uppercase tracking-wide text-muted-fg">
            <tr>
              <th className="px-5 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all professionals"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
                />
              </th>
              <th className="px-5 py-3">Photo</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Languages</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Diary link</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {therapists.map((t) => (
              <tr key={t.id} className={`border-t border-border ${selectedIds.has(t.id) ? "bg-accent-soft/40" : ""}`}>
                <td className="px-5 py-3">
                  <input
                    type="checkbox"
                    aria-label={`Select ${t.full_name}`}
                    checked={selectedIds.has(t.id)}
                    onChange={() => toggleOne(t.id)}
                    className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
                  />
                </td>
                <td className="px-5 py-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent">
                    {t.photo_url && (
                      <Image src={t.photo_url} alt={t.full_name} fill className="object-cover object-[center_22%]" />
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 font-medium">{t.full_name}</td>
                <td className="px-5 py-3 text-muted-fg">{t.languages.join(", ") || "—"}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
                      t.is_active ? "bg-accent-soft text-primary" : "bg-secondary text-muted-fg"
                    }`}
                  >
                    {t.is_active ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <DiaryLinkBadge diaryLink={t.diary_link} status={t.diary_link_status} />
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/admin/therapists/${t.id}`} className="font-semibold text-primary underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
