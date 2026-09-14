import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createAdminClient } from "@/lib/supabase/admin";

// Phase 201 — Media Library upload. Re-checks admin/super_admin here rather
// than trusting the page guard alone (same pattern every other admin write
// route on this project already uses), then uploads to the existing public
// "site-content-images" bucket and registers a media_assets row via the
// service-role client — bypassing that bucket's own storage RLS policies,
// which only allow the literal 'admin' role (not 'super_admin', a Phase 187
// gap that predates this feature — see EXECUTION_PLAN.md Phase 201 note).
// Using the service-role client here sidesteps that gap for this one route
// rather than silently reproducing it on a brand-new feature.
export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ error: "not authorized" }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const altText = (formData?.get("altText") as string) ?? "";
  const pathPrefix = (formData?.get("pathPrefix") as string) || "media-library";

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "a file is required" }, { status: 400 });
  }
  // Phase 202 — tightened from a generic `startsWith("image/")` check to an
  // explicit allowlist, and the cap raised from 8MB to 10MB, matching
  // ImageFieldInspector.tsx's own client-side ACCEPTED_TYPES/MAX_BYTES so the
  // client-side validation message an admin sees is never contradicted by a
  // stricter server check.
  const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "only JPG, PNG, or WebP images are supported" }, { status: 400 });
  }
  const MAX_BYTES = 10 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "image must be under 10MB" }, { status: 400 });
  }

  const admin = createAdminClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from("site-content-images")
    .upload(path, buffer, { upsert: true, contentType: file.type });
  if (uploadError) {
    return NextResponse.json({ error: "upload failed — try again" }, { status: 500 });
  }

  const { data: asset, error: insertError } = await admin
    .from("media_assets")
    .insert({
      storage_bucket: "site-content-images",
      storage_path: path,
      file_name: file.name,
      file_type: file.type,
      file_size_bytes: file.size,
      alt_text: altText,
      uploaded_by: profile.id,
    })
    .select("*")
    .single();

  if (insertError || !asset) {
    // The file is already in storage at this point; not rolling that back
    // automatically since an orphaned storage object is a much smaller
    // problem than losing an admin's upload silently. Flagged in the error
    // message so it's visible rather than a bare 500.
    return NextResponse.json({ error: "uploaded, but saving its details failed — contact support" }, { status: 500 });
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return NextResponse.json({
    asset: { ...asset, publicUrl: `${base}/storage/v1/object/public/${asset.storage_bucket}/${asset.storage_path}` },
  });
}
