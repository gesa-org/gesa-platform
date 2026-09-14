import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MediaAssetRow, MediaAssetUsageRow } from "@/lib/database.types";

// Phase 201 — Media Library. This is the read-side of the new
// media_assets/media_asset_usages tables (see migration
// phase_201_media_library and EXECUTION_PLAN.md Phase 201): a public page
// can ask "what image is currently assigned to this page/section slot?" by
// a stable (pageKey, sectionKey) pair instead of a hardcoded file path, and
// falls back to that page's own built-in default the moment nothing is
// assigned yet — same "never render blank" contract getPageContent() already
// gives text content. Write operations (upload/assign/replace/delete) live
// in app/api/admin/media/* routes, all server-authorized and using the
// service-role client, never called from here.

export type MediaAssetWithUrl = MediaAssetRow & { publicUrl: string };

function publicUrlFor(bucket: string, path: string): string {
  // Storage buckets referenced here are all public-read (see the
  // site_content_images_public_read policy), so a plain public URL is
  // always resolvable without a signed URL — same approach
  // ImageUploadField.tsx already uses via supabase.storage.getPublicUrl().
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Resolve the image currently assigned to one (pageKey, sectionKey) slot.
 * Returns null if nothing is assigned yet — callers MUST have a hardcoded
 * fallback src/alt ready, same convention as every other CMS-backed field
 * on this site. Never throws: a media lookup failing is not a reason to
 * break a public page.
 */
export async function getMediaAssetForSlot(
  pageKey: string,
  sectionKey: string
): Promise<MediaAssetWithUrl | null> {
  try {
    const supabase = await createClient();
    const { data: usage } = await supabase
      .from("media_asset_usages")
      .select("media_asset_id")
      .eq("page_key", pageKey)
      .eq("section_key", sectionKey)
      .maybeSingle();
    if (!usage) return null;

    const { data: asset } = await supabase
      .from("media_assets")
      .select("*")
      .eq("id", usage.media_asset_id)
      .maybeSingle();
    if (!asset) return null;

    return { ...asset, publicUrl: publicUrlFor(asset.storage_bucket, asset.storage_path) };
  } catch {
    return null;
  }
}

/**
 * Batch version of getMediaAssetForSlot for a page with several photo
 * slots (e.g. Donate's 3 "why your support matters" photos) — one round
 * trip instead of N, returned as a Map keyed by sectionKey for O(1) lookup.
 */
export async function getMediaAssetsForPage(pageKey: string): Promise<Map<string, MediaAssetWithUrl>> {
  const result = new Map<string, MediaAssetWithUrl>();
  try {
    const supabase = await createClient();
    const { data: usages } = await supabase
      .from("media_asset_usages")
      .select("section_key, media_asset_id")
      .eq("page_key", pageKey);
    if (!usages || usages.length === 0) return result;

    const ids = usages.map((u) => u.media_asset_id);
    const { data: assets } = await supabase.from("media_assets").select("*").in("id", ids);
    if (!assets) return result;

    const byId = new Map(assets.map((a) => [a.id, a]));
    for (const u of usages) {
      const asset = byId.get(u.media_asset_id);
      if (asset) result.set(u.section_key, { ...asset, publicUrl: publicUrlFor(asset.storage_bucket, asset.storage_path) });
    }
  } catch {
    // Swallow — callers fall back to their hardcoded defaults per slot.
  }
  return result;
}

// Admin-only (Media Library tab, Content Manager): every asset plus its
// current usage list, so the admin UI can show "used on Donate > Why your
// support matters > Photo 1" before offering replace/remove, per the brief's
// "remove only when not in use, else show a usage warning" rule. Uses the
// service-role client deliberately — the Media Library tab needs to see
// every asset regardless of the signed-in admin's own row-level access,
// same reasoning every other admin list page (getFaqs, getAllLegalPages)
// already runs under RLS for tables with public-read policies; this one
// uses the admin client instead only because usage-join is easier to reason
// about in one place without relying on two separate public-read policies.
export async function getAllMediaAssetsForAdmin(): Promise<
  Array<MediaAssetWithUrl & { usages: MediaAssetUsageRow[] }>
> {
  const admin = createAdminClient();
  const [{ data: assets }, { data: usages }] = await Promise.all([
    admin.from("media_assets").select("*").order("created_at", { ascending: false }),
    admin.from("media_asset_usages").select("*"),
  ]);
  const usagesByAsset = new Map<string, MediaAssetUsageRow[]>();
  for (const u of usages ?? []) {
    const list = usagesByAsset.get(u.media_asset_id) ?? [];
    list.push(u);
    usagesByAsset.set(u.media_asset_id, list);
  }
  return (assets ?? []).map((a) => ({
    ...a,
    publicUrl: publicUrlFor(a.storage_bucket, a.storage_path),
    usages: usagesByAsset.get(a.id) ?? [],
  }));
}

// MEDIA_SLOT_LABELS / mediaSlotLabel moved to lib/mediaSlots.ts (Phase 201)
// so the client-side MediaLibrary.tsx can import the labels without pulling
// this file's service-role client into the browser bundle. Re-exported here
// too, purely so any existing server-side import of `mediaSlotLabel` from
// "@/lib/media" keeps working without a find-replace.
export { MEDIA_SLOT_LABELS, mediaSlotLabel } from "@/lib/mediaSlots";
