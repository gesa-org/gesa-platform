"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

// Phase 62 — Roy asked for the Content Manager to actually let an admin
// attach a picture wherever a section has an image field, not just paste
// in a URL — starting with "Our Founders," which had no photo field at
// all (About's founder cards were initials-only). This is the one shared
// upload control every image field across the Content Manager should use,
// modeled directly on the real upload flow already working in
// components/admin/TherapistEditForm.tsx (same pattern: pick a file,
// upload to a public Supabase Storage bucket, store the resulting public
// URL as a plain string on the content row — no new column/table needed
// anywhere, since every image field here is just a string in a site_content
// JSON blob already).
//
// Uses the "site-content-images" bucket (public read; insert/update/delete
// gated to admins via the same auth_role() check the therapist-photos
// bucket already uses) rather than reusing "therapist-photos", since these
// are a different category of image with a different retention/ownership
// story (site copy assets, not a specific therapist's own profile photo).
//
// Note on GESA's no-stock-photography policy (Phase 43): that policy is
// about not using generic/anonymous stock photos of unrelated people for
// decorative purposes, for the sake of client privacy. A founder's own
// photo of themselves, uploaded by an admin with their knowledge for their
// own bio, is a different, ordinary thing — most nonprofits show their
// real founders' faces — so this field doesn't conflict with that policy.
export default function ImageUploadField({
  label,
  value,
  onChange,
  pathPrefix,
  help,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Storage path prefix, e.g. "founders" or "hero" — keeps uploads for
   * different fields from colliding/overwriting each other in the bucket. */
  pathPrefix: string;
  help?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(false);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("site-content-images").upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (uploadError) {
      setError(true);
    } else {
      const { data } = supabase.storage.from("site-content-images").getPublicUrl(path);
      onChange(data.publicUrl);
    }
    setUploading(false);
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold">{label}</label>
      <div className="flex items-start gap-3">
        <div className="flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-xl bg-secondary">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[11px] text-muted-fg">No image</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload size={14} /> {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
            </Button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[12.5px] text-destructive hover:bg-destructive/10"
                aria-label="Remove image"
              >
                <X size={13} /> Remove
              </button>
            )}
          </div>
          {error && <p className="text-[12px] text-destructive">Upload failed — try again.</p>}
          {help && <p className="text-[12px] text-muted-fg">{help}</p>}
        </div>
      </div>
    </div>
  );
}
