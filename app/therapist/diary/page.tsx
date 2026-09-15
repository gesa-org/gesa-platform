import { CalendarDays, ExternalLink, Settings2 } from "lucide-react";
import { requireTherapist } from "@/lib/auth/requireTherapist";
import { createClient } from "@/lib/supabase/server";
import { validateEmbedUrl } from "@/lib/diary/embedAllowlist";
import DiaryEmbed from "@/components/therapist/DiaryEmbed";

export const dynamic = "force-dynamic";

// Phase 208 — "My Diary" (Therapist Diary Calendar Embed), placed
// immediately after "My Bookings" in the sidebar (see app/therapist/
// layout.tsx's NAV order). This page only ever reads this signed-in
// therapist's own row: `.eq("profile_id", profile.id)` inside
// requireTherapist() resolves the current therapist id server-side, and the
// query below adds its own `.eq("id", self.therapist.id)` on top of what
// the therapists_self_read RLS policy already enforces — the same
// defense-in-depth convention as every other therapist-scoped query in this
// app (see app/therapist/bookings/page.tsx's own comment). A therapist can
// never reach another therapist's calendar_embed_url by editing a URL
// parameter, since there isn't one — this page takes no id from the
// request at all, only from the signed-in session.
//
// calendar_embed_url/provider/enabled are never exposed to an
// unauthenticated visitor or to another therapist: they're absent from
// therapists_public/PublicTherapistRow entirely (see lib/database.types.ts),
// and the phase_208 migration's extended trigger means even a signed-in
// therapist can never set these on their own row — only an admin can, via
// components/admin/TherapistEditForm.tsx.
export default async function TherapistDiaryPage() {
  const self = await requireTherapist();

  if (!self) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-card p-6">
        <h2 className="mb-1.5 text-lg">Your account isn&apos;t linked to a professional profile yet</h2>
        <p className="text-[14px] text-muted-fg">
          This login exists, but no professional record points to it yet. Contact the GESA team so an admin can
          link your account from your profile&apos;s edit page.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: embedConfig } = await supabase
    .from("therapists")
    .select("calendar_embed_url, calendar_embed_provider, calendar_embed_enabled")
    .eq("id", self.therapist.id)
    .maybeSingle();

  const url = embedConfig?.calendar_embed_url ?? null;
  const enabled = embedConfig?.calendar_embed_enabled ?? false;
  const provider = embedConfig?.calendar_embed_provider ?? null;
  const validation = url ? validateEmbedUrl(url) : null;
  const canEmbed = Boolean(url && enabled && validation?.ok);

  return (
    <div className="rounded-[var(--radius)] border border-border bg-card p-6">
      <h2 className="mb-1 flex items-center gap-2 text-lg">
        <CalendarDays size={18} className="text-primary" /> My Diary
      </h2>
      <p className="mb-4 text-[13px] text-muted-fg">
        View your upcoming scheduled sessions in your calendar, without leaving GESA.
      </p>

      {canEmbed && url ? (
        <DiaryEmbed embedUrl={url} provider={provider} />
      ) : url && enabled && !validation?.ok ? (
        // Configured, but the saved URL no longer passes GESA's embed
        // allowlist (e.g. an admin pasted a personal Calendly login link
        // instead of a provider-approved embed link) — a safe fallback
        // instead of silently trying to render it anyway. Never attempts to
        // work around the provider's own restriction (see
        // lib/diary/embedAllowlist.ts's own comment).
        <div className="flex flex-col items-start gap-3 rounded-[var(--radius)] border border-dashed border-border bg-secondary/40 p-6">
          <Settings2 size={20} className="text-muted-fg" />
          <p className="text-[14px] text-muted-fg">
            Your calendar link is configured, but it can&apos;t be safely embedded here — you can still open it
            directly.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-600"
          >
            <ExternalLink size={15} /> Open Diary Securely
          </a>
        </div>
      ) : (
        // Empty/configuration state — no admin-managed embed set up yet (or
        // an admin has temporarily disabled it via the Embed enabled toggle).
        <div className="flex flex-col items-start gap-3 rounded-[var(--radius)] border border-dashed border-border bg-secondary/40 p-6">
          <CalendarDays size={20} className="text-muted-fg" />
          <p className="text-[14px] text-muted-fg">
            Your diary calendar has not yet been connected. Please contact the GESA administrator for assistance.
          </p>
        </div>
      )}
    </div>
  );
}
