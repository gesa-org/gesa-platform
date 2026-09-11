"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { TherapistOnboardingRow } from "@/lib/queries";

// Client-safe copy of lib/invitations.ts's default — that module also pulls
// in `crypto`/the service-role client and must never be imported into a
// "use client" bundle. Only used here to *display* the expiry date in the
// review step; the real expiry is always set server-side.
function clientSideExpiryLabel(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" });
}

type BulkResult = {
  sent: { id: string; email: string }[];
  skippedNoEmail: { id: string; fullName: string }[];
  skippedHasAccount: { id: string; fullName: string }[];
  failed: { id: string; email: string; reason: string }[];
};

// Phase 187 — the bulk-invite workflow for the 34 existing active
// therapists (and any future batch), per the spec's step-by-step: filter to
// Active + No account, multi-select, a review modal naming each person +
// email + role + expiry with a warning for missing emails, send only to
// valid emails, then a clear success/failure/skipped report.
export default function BulkInviteTherapistsModal({ candidates }: { candidates: TherapistOnboardingRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reviewing, setReviewing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkResult | null>(null);

  const eligible = useMemo(
    () => candidates.filter((t) => t.profile_status === "active" && !t.profile_id),
    [candidates]
  );

  function close() {
    setOpen(false);
    setSelected(new Set());
    setReviewing(false);
    setError(null);
    setResult(null);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === eligible.length ? new Set() : new Set(eligible.map((t) => t.id))));
  }

  const selectedTherapists = eligible.filter((t) => selected.has(t.id));
  const withEmail = selectedTherapists.filter((t) => t.contact_email);
  const withoutEmail = selectedTherapists.filter((t) => !t.contact_email);
  const expiryLabel = clientSideExpiryLabel();

  async function sendInvitations() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/invitations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ therapistIds: withEmail.map((t) => t.id) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not send invitations.");
      setResult(data as BulkResult);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send invitations.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5">
        <Send size={15} /> Invite professionals
      </Button>

      <Modal open={open} onClose={close}>
        {result ? (
          <div>
            <h3 className="text-lg font-semibold">Invitations sent</h3>
            <div className="mt-3 flex flex-col gap-3 text-[13.5px]">
              <p className="text-accent">
                <strong>{result.sent.length}</strong> invitation{result.sent.length === 1 ? "" : "s"} sent successfully.
              </p>
              {result.failed.length > 0 && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                  <p className="font-semibold text-destructive">{result.failed.length} failed</p>
                  <ul className="mt-1 list-disc pl-4 text-muted-fg">
                    {result.failed.map((f) => (
                      <li key={f.id}>{f.email} — {f.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.skippedNoEmail.length > 0 && (
                <div className="rounded-xl border border-border bg-secondary/50 p-3">
                  <p className="font-semibold">{result.skippedNoEmail.length} skipped — no email on file</p>
                  <ul className="mt-1 list-disc pl-4 text-muted-fg">
                    {result.skippedNoEmail.map((s) => (
                      <li key={s.id}>{s.fullName}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.skippedHasAccount.length > 0 && (
                <p className="text-muted-fg">{result.skippedHasAccount.length} already had an account and were skipped.</p>
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <Button onClick={close}>Done</Button>
            </div>
          </div>
        ) : reviewing ? (
          <div>
            <h3 className="text-lg font-semibold">Review before sending</h3>
            <p className="mt-1 text-[13px] text-muted-fg">
              Each person below will get a Professional invitation email, expiring {expiryLabel}.
            </p>
            <div className="mt-3 max-h-[40vh] overflow-y-auto rounded-xl border border-border">
              {withEmail.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 border-b border-border px-3.5 py-2.5 text-[13px] last:border-b-0">
                  <div>
                    <p className="font-medium">{t.full_name}</p>
                    <p className="text-muted-fg">{t.contact_email}</p>
                  </div>
                  <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11.5px] font-semibold text-primary">Professional</span>
                </div>
              ))}
            </div>
            {withoutEmail.length > 0 && (
              <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-[12.5px] text-destructive">
                <strong>{withoutEmail.length}</strong> selected professional{withoutEmail.length === 1 ? "" : "s"} — {withoutEmail.map((t) => t.full_name).join(", ")} — {withoutEmail.length === 1 ? "has" : "have"} no email on file and will be skipped.
              </div>
            )}
            {error && <p className="mt-3 text-[13px] text-destructive">{error}</p>}
            <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
              <Button onClick={sendInvitations} disabled={pending || withEmail.length === 0}>
                {pending ? "Sending…" : `Send ${withEmail.length} invitation${withEmail.length === 1 ? "" : "s"}`}
              </Button>
              <Button variant="outline" onClick={() => setReviewing(false)} disabled={pending}>
                Back
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold">Invite professionals</h3>
            <p className="mt-1 text-[13px] text-muted-fg">
              Active professionals with no account yet. Selecting a person here doesn&apos;t change their public
              listing — it only sends an account invitation.
            </p>
            {eligible.length === 0 ? (
              <p className="mt-4 rounded-xl border border-border bg-secondary/50 p-4 text-[13.5px] text-muted-fg">
                Every active professional already has an account or a pending invitation.
              </p>
            ) : (
              <>
                <label className="mt-4 flex items-center gap-2 border-b border-border pb-2 text-[13px] font-semibold">
                  <input type="checkbox" checked={selected.size === eligible.length && eligible.length > 0} onChange={toggleAll} />
                  Select all ({eligible.length})
                </label>
                <div className="mt-2 max-h-[40vh] overflow-y-auto">
                  {eligible.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 border-b border-border py-2 text-[13px] last:border-b-0">
                      <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} />
                      <span className="flex-1">{t.full_name}</span>
                      <span className={t.contact_email ? "text-muted-fg" : "text-destructive"}>
                        {t.contact_email || "No email on file"}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}
            <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
              <Button onClick={() => setReviewing(true)} disabled={selected.size === 0}>
                Review {selected.size > 0 ? `(${selected.size})` : ""}
              </Button>
              <Button variant="outline" onClick={close}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
