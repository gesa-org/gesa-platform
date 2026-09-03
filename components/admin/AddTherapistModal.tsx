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
export default function AddTherapistModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setFullName("");
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const supabase = createClient();
    const baseSlug = slugify(fullName);

    // Up to 5 attempts with a numeric suffix if the slug is already taken —
    // the same small retry-on-conflict shape used elsewhere in this
    // codebase (the conflict-free session-booking flow) rather than a
    // separate "check if it exists first" query that could itself race.
    let lastError: string | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
      const { data, error } = await supabase
        .from("therapists")
        .insert({ full_name: fullName.trim(), slug, is_active: false })
        .select("id")
        .single();

      if (!error && data) {
        setPending(false);
        router.push(`/admin/therapists/${data.id}`);
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
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold">Add Professional</h3>
            <p className="mt-1 text-[13px] text-muted-fg">
              Creates a new, inactive professional record and takes you straight to the full profile editor — photo,
              bio, credentials, specialties, and activating them for the public directory all happen there.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">Full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
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
      </Modal>
    </>
  );
}
