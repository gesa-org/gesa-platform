"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import Button from "@/components/ui/Button";
import InquiryStatusSelect from "@/components/admin/InquiryStatusSelect";
import DeleteRowButton from "@/components/admin/DeleteRowButton";
import type { getAllInquiries } from "@/lib/queries";

type Inquiry = Awaited<ReturnType<typeof getAllInquiries>>[number];

const SOURCE_LABELS: Record<string, string> = {
  contact_form: "Contact page",
  help_us_grow: "Footer — Help us grow",
  legacy: "Legacy (pre-migration)",
};

// Phase 150 — the detail drawer/modal required by the Inquiries Page spec:
// full message, all client fields, status control, an editable internal
// admin-notes field (new this phase — admin_notes column), the source tag
// for audit purposes, and the same Delete action available on the row.
export default function InquiryDetailModal({
  inquiry,
  onClose,
  onDeleted,
  onStatusChanged,
}: {
  inquiry: Inquiry;
  onClose: () => void;
  onDeleted: (id: string) => void;
  onStatusChanged: (id: string, status: string) => void;
}) {
  const [notes, setNotes] = useState(inquiry.admin_notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesStatus, setNotesStatus] = useState<"idle" | "saved" | "error">("idle");

  async function saveNotes() {
    setSavingNotes(true);
    setNotesStatus("idle");
    try {
      const res = await fetch("/api/admin/inquiries/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inquiry.id, adminNotes: notes }),
      });
      if (!res.ok) throw new Error("failed");
      setNotesStatus("saved");
    } catch {
      setNotesStatus("error");
    } finally {
      setSavingNotes(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Inquiry from ${inquiry.name || inquiry.email || "client"}`}
    >
      <div
        className="max-h-[85vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[19px] font-semibold">{inquiry.name || "Unnamed client"}</h3>
            <p className="text-[12.5px] text-muted-fg">
              {/* Phase 185 — fixed locale/timeZone; see
                  BookingRequestsTable.tsx's Phase 185 comment. */}
              Submitted {new Date(inquiry.created_at).toLocaleString("en-US", { timeZone: "UTC" })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-muted-fg hover:bg-secondary"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-3 text-[13.5px] sm:grid-cols-2">
          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-fg">Email</div>
            {inquiry.email ? (
              <a href={`mailto:${inquiry.email}`} className="text-primary underline">
                {inquiry.email}
              </a>
            ) : (
              "—"
            )}
          </div>
          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-fg">Phone</div>
            {inquiry.phone || "—"}
          </div>
          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-fg">Subject</div>
            {inquiry.type || "General"}
          </div>
          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-fg">Source</div>
            {SOURCE_LABELS[inquiry.source ?? ""] ?? inquiry.source ?? "—"}
          </div>
          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-fg">Consent</div>
            {inquiry.consent ? "Confirmed" : "Not recorded"}
          </div>
          <div>
            <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-muted-fg">Status</div>
            <InquiryStatusSelect
              id={inquiry.id}
              status={inquiry.status}
              onChanged={(next) => onStatusChanged(inquiry.id, next)}
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-muted-fg">Message</div>
          <p className="whitespace-pre-line rounded-xl border border-border bg-secondary/40 p-3.5 text-[13.5px]">
            {inquiry.message || "—"}
          </p>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-[11.5px] font-semibold uppercase tracking-wide text-muted-fg">
            Internal admin notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Not visible to the client — for your own team's reference."
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-[13.5px] focus:border-primary focus:outline-none"
          />
          <div className="mt-2 flex items-center gap-3">
            <Button type="button" size="sm" variant="outline" onClick={saveNotes} disabled={savingNotes}>
              {savingNotes ? <Loader2 size={14} className="animate-spin" /> : null}
              {savingNotes ? "Saving…" : "Save notes"}
            </Button>
            {notesStatus === "saved" && <span className="text-[12.5px] font-medium text-primary">Saved.</span>}
            {notesStatus === "error" && (
              <span className="text-[12.5px] font-medium text-destructive">Couldn&apos;t save — try again.</span>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-border pt-4">
          <DeleteRowButton
            endpoint="/api/admin/inquiries/delete"
            id={inquiry.id}
            confirmTitle={`Delete inquiry from ${inquiry.name || inquiry.email || "this client"}?`}
            confirmDescription="This will permanently remove this inquiry record."
            onDeleted={(id) => {
              onDeleted(id);
              onClose();
            }}
            label="Delete inquiry"
          />
        </div>
      </div>
    </div>
  );
}
