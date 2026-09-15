// Phase 208 — Therapist Diary Calendar Embed. Shared by the admin CRM's
// embed-config form (components/admin/TherapistEditForm.tsx) and the
// therapist-facing embed itself (components/therapist/DiaryEmbed.tsx), so
// there is exactly one place that decides "is this URL safe to put in an
// iframe" — not one check at save time and a different one at render time.
//
// Why an allowlist at all, and why this particular list: most calendar/
// scheduling providers don't offer a "here's an iframe-embeddable view of my
// own booked appointments" URL — Calendly in particular has no such feature;
// its only embeddable surface is the public "book a new time with me"
// widget, which is a different concept entirely (that's what the existing
// public `diary_link` already covers). Only providers with an explicit,
// provider-documented "publish/embed my calendar as a read-only view" export
// are included here:
//   - Google Calendar's own "Settings > Integrate calendar > Embed code"
//     feature (produces a calendar.google.com/calendar/embed?... URL).
//   - Outlook/Microsoft 365's "Publish a calendar" feature (produces an
//     outlook.office.com/.../view.html or outlook.live.com/.../view.html
//     published-HTML-view URL).
// Calendly is deliberately NOT in this allowlist for the "my own calendar"
// embed — see EXECUTION_PLAN.md's Phase 208 entry for why, and the
// CALENDLY note below. Roy asked (or an admin later asks) to add a provider
// here only after confirming, for that specific provider, that it (a) offers
// a real read-only "my calendar" embed/publish URL, not just a public
// booking widget, and (b) doesn't block iframing via X-Frame-Options/CSP.
const ALLOWED_EMBED_HOSTS = [
  "calendar.google.com",
  "calendar.app.google",
  "outlook.office.com",
  "outlook.office365.com",
  "outlook.live.com",
];

export type EmbedUrlValidation = { ok: true } | { ok: false; reason: string };

// Deliberately conservative: HTTPS-only, host must exactly match (or be a
// subdomain of) an allowlisted host, and the URL must parse at all. This is
// checked both when an admin saves a URL (TherapistEditForm.tsx) and, as a
// second independent gate, immediately before DiaryEmbed.tsx ever renders an
// <iframe src=...> — so a value that somehow reached the database any other
// way (a future admin tool, a manual SQL edit) still can't be rendered
// unless it also passes this same check at render time.
export function validateEmbedUrl(rawUrl: string): EmbedUrlValidation {
  const trimmed = rawUrl.trim();
  if (!trimmed) return { ok: false, reason: "A calendar embed URL is required." };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, reason: "That doesn't look like a valid URL." };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, reason: "Only secure https:// calendar links can be embedded." };
  }

  const host = parsed.hostname.toLowerCase();
  const isAllowed = ALLOWED_EMBED_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
  if (!isAllowed) {
    return {
      ok: false,
      reason:
        "This domain isn't on GESA's approved calendar-embed list yet (Google Calendar or Outlook published-calendar links only). Use the provider's own \"embed\" or \"publish calendar\" link, not a personal login URL.",
    };
  }

  return { ok: true };
}

export function isEmbeddableCalendarUrl(rawUrl: string | null | undefined): boolean {
  if (!rawUrl) return false;
  return validateEmbedUrl(rawUrl).ok;
}

export const CALENDAR_EMBED_PROVIDER_LABEL: Record<string, string> = {
  google_calendar: "Google Calendar",
  outlook: "Outlook / Microsoft 365",
  calendly: "Calendly",
  other: "Other",
};
