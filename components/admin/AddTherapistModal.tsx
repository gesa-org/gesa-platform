"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "therapist";
}

// Phase 82 — "Add therapist" on /admin/therapists. Unlike "Add user", this
// genuinely is a plain client-side insert: the `therapists_admin_insert`
// RLS policy (verified directly against both the Dev and Production
// Supabase projects before building this) already lets an admin/reviewer
// role INSERT into `therapists` — this had just never been exercised by any
// code path before, since the only route into this table so far was editing
// an existing row. Mirrors the same "insert a minimal placeholder, then let
// the admin fill in the rest" pattern FaqManager already uses for FAQs:
// collects just `full_name` here, derives a URL slug from it (retrying with
// a numeric suffix on a collision, since `slug` is unique), inserts with
// `is_active: false` so a bare new record never appears in the public
// directory before someone's actually filled in a bio/photo, then routes
// straight into the existing TherapistEditForm for everything else.
//
// Phase 187 — added an optional email field and, once the profile saves, the
// spec's required prompt: "Professional profile created. Would you like to
// send an account invitation now?" with three choices. This is the "new
// therapist member added" path from the invitation spec (distinct from the
// bulk flow for the pre-existing 34, and from the volunteer-application
// approve-and-invite flow) — same underlying /api/admin/invitations route,
// just triggered from here instead.
export default function AddTherapistModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; email: string } | null>(null);
  const [invitePending, setInvitePending] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setFullName("");
    setEmail("");
    setError(null);
    setCreated(null);
    setInviteError(null);
    router.refresh();
  }

  function goToProfile() {
    if (!created) return;
    router.push(`/admin/therapists/${created.id}`);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const supabase = createClient();
    const baseSlug = slugify(fullName);
    const trimmedEmail = email.trim();

    let lastError: string | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
      const { data, error } = await supabase
        .from("therapists")
        .insert({ full_name: fullName.trim(), slug, is_active: false, contact_email: trimmedEmail || null })
        .select("id")
        .single();

      if (!error && data) {
        setPending(false);
        setCreated({ id: data.id, email: trimmedEmail });
        return;
      }
      if (error?.code === "23505") {
        lastError = "That name's URL is already taken — trying another.";
        continue;
      }
      lastError = "Could not create the professional. Please try again.";
      break;
    }

    setPending(false);
    setError(lastError);
  }

  async function sendInviteNow() {
    if (!created) return;
    setInvitePending(true);
    setInviteError(null);
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: created.email,
          invitedRole: "therapist",
          therapistProfileId: created.id,
          firstName: fullName.trim().split(/\s+/)[0] ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send the invitation.");
      goToProfile();
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : "Could not send the invitation.");
    } finally {
      setInvitePending(false);
    }
  }

  return (
    <>
      {/* Phase 125 — "Add therapist" -> "Add Professional" (button, modal
          title, and body copy), matching the CRM-wide rename. The `slugify`
          fallback ("therapist"), the `therapists` table name, and the route
          this pushes to (/admin/therapists/[id]) are all internal
          identifiers, left unchanged per Roy's instruction. */}
      <Button size="sm" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5">
        <Plus size={15} /> Add Professional
      </Button>

      <Modal open={open} onClose={close}>
        {created ? (
          <div>
            <h3 className="text-lg font-semibold">Professional profile created</h3>
            <p className="mt-1.5 text-[13.5px] text-muted-fg">
              Would you like to send an account invitation now? They&apos;ll be able to sign in once they accept it —
              this doesn&apos;t publish their profile publicly.
            </p>
            {!created.email && (
              <p className="mt-3 text-[12.5px] text-destructive">
                No email was entered, so an invitation can&apos;t be sent yet — add one from the profile editor first.
              </p>
            )}
            {inviteError && <p className="mt-3 text-[13px] text-destructive">{inviteError}</p>}
            <div className="mt-5 flex flex-col gap-2.5 border-t border-border pt-4">
              <Button type="button" onClick={sendInviteNow} disabled={invitePending || !created.email}>
                {invitePending ? "Sending…" : "Send invitation now"}
              </Button>
              <Button type="button" variant="outline" onClick={goToProfile} disabled={invitePending}>
                Save without inviting
              </Button>
              <button type="button" onClick={close} disabled={invitePending} className="text-[13px] font-medium text-muted-fg hover:text-foreground">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold">Add Professional</h3>
              <p className="mt-1 text-[13px] text-muted-fg">
                Creates a new, inactive professional record and takes you straight to the full profile editor — photo,
                bio, credentials, specialties, and activating them for the public directory all happen there.
              </p>
            </div>

            <div>
              <label htmlFor="add-therapist-name" className="mb-1.5 block text-sm font-semibold">
                Full name
              </label>
              <input
                id="add-therapist-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoFocus
                className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="add-therapist-email" className="mb-1.5 block text-sm font-semibold">
                Email <span className="font-normal text-muted-fg">(optional — needed to send an account invitation)</span>
              </label>
              <input
                id="add-therapist-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
              />
            </div>

            {error && <p className="text-[13px] text-destructive">{error}</p>}

            <div className="flex items-center gap-3 border-t border-border pt-4">
              <Button type="submit" disabled={pending || !fullName.trim()}>
                {pending ? "Creating…" : "Create & edit profile"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
