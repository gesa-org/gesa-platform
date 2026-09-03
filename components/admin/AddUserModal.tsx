"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Copy, Check } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { AppRole } from "@/lib/database.types";

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "client", label: "Client" },
  { value: "therapist", label: "Professional" }, // internal role value unchanged (Phase 125), only the admin-facing label renamed
  { value: "reviewer", label: "Reviewer" },
  { value: "finance", label: "Finance" },
  { value: "admin", label: "Admin" },
];

// Phase 82 — "Add user" on /admin/users. Creating a user is structurally a
// server-side operation (see app/api/admin/users/route.ts's comment for
// why), so this modal is a thin form that POSTs and displays whatever comes
// back — no direct Supabase client call here, unlike most other admin
// "add" forms in this codebase.
export default function AddUserModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("client");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setFullName("");
    setEmail("");
    setRole("client");
    setError(null);
    setResult(null);
    setCopied(false);
  }

  function close() {
    setOpen(false);
    reset();
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create the user.");
        return;
      }
      setResult({ tempPassword: data.tempPassword });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5">
        <Plus size={15} /> Add user
      </Button>

      <Modal open={open} onClose={close}>
        {result ? (
          <div>
            <h3 className="text-lg font-semibold">User created</h3>
            <p className="mt-1.5 text-[13.5px] text-muted-fg">
              Share this temporary password with <strong>{email}</strong> through a secure channel — it won&apos;t be
              shown again. They can change it after signing in, or use &quot;Forgot password?&quot; on the login page
              at any time.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5">
              <code className="flex-1 select-all text-[14px] font-medium">{result.tempPassword}</code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(result.tempPassword).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
                className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-muted-fg hover:bg-secondary"
                aria-label="Copy password"
              >
                {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
              </button>
            </div>
            <div className="mt-5 flex justify-end">
              <Button onClick={close}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold">Add user</h3>
              <p className="mt-1 text-[13px] text-muted-fg">
                Creates a real account with a temporary password — for staff, reviewers, or a professional you want
                signed in and messaging clients directly.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as AppRole)}
                className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-[13px] text-destructive">{error}</p>}

            <div className="flex items-center gap-3 border-t border-border pt-4">
              <Button type="submit" disabled={pending}>
                {pending ? "Creating…" : "Create user"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
