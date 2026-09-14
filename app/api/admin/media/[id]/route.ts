import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createAdminClient } from "@/lib/supabase/admin";

// Phase 201 — edit an asset's metadata (alt text, caption, credit,
// decorative flag, focal point). Never touches storage or usages.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ error: "not authorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid request body" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  for (const key of ["alt_text", "caption", "credit", "is_decorative", "focal_point_x", "focal_point_y"]) {
    if (key in body) updates[key] = body[key];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no editable fields provided" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("media_assets").update(updates).eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: "could not save changes" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// Phase 201 — delete an asset only when nothing currently uses it. The
// media_asset_usages.media_asset_id FK is `on delete restrict`, so an
// in-use asset's delete fails at the database level even if this check
// were ever bypassed — this pre-check just turns that into a friendly
// message with the actual usage list instead of a raw Postgres FK error.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ error: "not authorized" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: usages } = await admin
    .from("media_asset_usages")
    .select("page_key, section_key")
    .eq("media_asset_id", params.id);

  if (usages && usages.length > 0) {
    return NextResponse.json(
      {
        error: "This image is still in use and can't be deleted.",
        usages,
      },
      { status: 409 }
    );
  }

  const { data: asset } = await admin.from("media_assets").select("storage_bucket, storage_path").eq("id", params.id).maybeSingle();
  if (asset) {
    await admin.storage.from(asset.storage_bucket).remove([asset.storage_path]);
  }

  const { error } = await admin.from("media_assets").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: "could not delete this image" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
