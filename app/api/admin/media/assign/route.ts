import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createAdminClient } from "@/lib/supabase/admin";

// Phase 201 — assigns (or reassigns) which media_assets row a given
// (pageKey, sectionKey) slot currently points at. Upsert on the
// media_asset_usages.page_key/section_key unique constraint, so re-assigning
// a slot to a different asset replaces the old row rather than accumulating
// duplicates — a slot has exactly one current image, by design (this is not
// a history/versioning table; Phase 206's revision-history work, if it
// happens, is a separate concern).
export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ error: "not authorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const assetId = body?.assetId as string | undefined;
  const pageKey = body?.pageKey as string | undefined;
  const sectionKey = body?.sectionKey as string | undefined;
  if (!assetId || !pageKey || !sectionKey) {
    return NextResponse.json({ error: "assetId, pageKey, and sectionKey are all required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("media_asset_usages")
    .upsert({ media_asset_id: assetId, page_key: pageKey, section_key: sectionKey }, { onConflict: "page_key,section_key" });

  if (error) {
    return NextResponse.json({ error: "could not assign image to that section" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// Unassigns a slot (reverts it to that page's hardcoded fallback image)
// without deleting the underlying media_assets row, since the same asset
// may still be assigned elsewhere.
export async function DELETE(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ error: "not authorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const pageKey = body?.pageKey as string | undefined;
  const sectionKey = body?.sectionKey as string | undefined;
  if (!pageKey || !sectionKey) {
    return NextResponse.json({ error: "pageKey and sectionKey are both required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("media_asset_usages")
    .delete()
    .eq("page_key", pageKey)
    .eq("section_key", sectionKey);

  if (error) {
    return NextResponse.json({ error: "could not unassign that section" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
