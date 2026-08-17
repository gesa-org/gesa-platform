"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import type { Tables } from "@/lib/database.types";

export default function TherapistEditForm({ therapist }: { therapist: Tables<"therapists"> }) {
  const [photoUrl, setPhotoUrl] = useState(therapist.photo_url ?? "");
  const [fullName, setFullName] = useState(therapist.full_name);
  const [shortSummary, setShortSummary] = useState(therapist.short_summary ?? "");
  const [bio, setBio] = useState(therapist.bio ?? "");
  const [credentials, setCredentials] = useState(therapist.credentials ?? "");
  const [specialties, setSpecialties] = useState(therapist.specialties.join(", "));
  const [languages, setLanguages] = useState(therapist.languages.join(", "));
  const [isActive, setIsActive] = useState(therapist.is_active);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${therapist.id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("therapist-photos").upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (!uploadError) {
      const { data: publicUrl } = supabase.storage.from("therapist-photos").getPublicUrl(path);
      setPhotoUrl(publicUrl.publicUrl);
    }
    setUploading(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setStatus("idle");
    const supabase = createClient();
    const { error } = await supabase
      .from("therapists")
      .update({
        photo_url: photoUrl || null,
        full_name: fullName,
        short_summary: shortSummary || null,
        bio: bio || null,
        credentials: credentials || null,
        specialties: specialties
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        languages: languages
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
      })
      .eq("id", therapist.id);
    setPending(false);
    setStatus(error ? "error" : "saved");
  }

  async function toggleActive() {
    const next = !isActive;
    const supabase = createClient();
    const { error } = await supabase.from("therapists").update({ is_active: next }).eq("id", therapist.id);
    if (!error) setIsActive(next);
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <div className="relative h-20 w-20 flex-none overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent">
          {photoUrl && <Image src={photoUrl} alt={fullName} fill className="object-cover object-[center_22%]" />}
        </div>
        <div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoSelected} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload size={14} /> {uploading ? "Uploading…" : "Upload new photo"}
          </Button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Full name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Short summary</label>
          <input
            value={shortSummary}
            onChange={(e) => setShortSummary(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Bio</label>
          <textarea
            rows={5}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Credentials</label>
          <input
            value={credentials}
            onChange={(e) => setCredentials(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Specialties (comma-separated)</label>
          <input
            value={specialties}
            onChange={(e) => setSpecialties(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Spoken languages (comma-separated)</label>
          <input
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-4 border-t border-border pt-4">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
          {status === "saved" && <span className="text-[13.5px] font-medium text-primary">Saved.</span>}
          {status === "error" && <span className="text-[13.5px] font-medium text-destructive">Couldn&apos;t save — try again.</span>}
        </div>
      </form>

      <div className="mt-6 border-t border-border pt-5">
        <h3 className="mb-1.5 text-[15px] font-semibold">Danger zone</h3>
        <p className="mb-3 text-[13px] text-muted-fg">
          Deactivating hides this therapist from the public directory and matching, without deleting their record —
          reversible any time.
        </p>
        <Button variant={isActive ? "outline" : "primary"} onClick={toggleActive}>
          {isActive ? "Deactivate therapist" : "Reactivate therapist"}
        </Button>
      </div>
    </div>
  );
}
