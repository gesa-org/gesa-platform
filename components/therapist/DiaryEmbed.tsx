"use client";

import { useState } from "react";
import { CalendarOff, ExternalLink, Maximize2, Minimize2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { CALENDAR_EMBED_PROVIDER_LABEL } from "@/lib/diary/embedAllowlist";
import type { CalendarEmbedProvider } from "@/lib/database.types";

// Phase 208 — Therapist Diary Calendar Embed ("My Diary"). Renders one of
// three states, decided entirely by the server component that fetched this
// therapist's own row (app/therapist/diary/page.tsx): not configured, or
// configured-and-embeddable (this component). The "already validated"
// contract matters — validateEmbedUrl() is checked again here defensively
// (see the parent page), so this component never trusts that a URL it's
// handed is safe to put in an iframe without re-confirming that itself.
//
// A note on "error state" detection: a provider that blocks iframing via
// X-Frame-Options/CSP does *not* reliably fire a JS-visible error on the
// <iframe> element in most browsers — the browser just shows a blank frame
// or its own "refused to connect" page inside it, with no onError event and
// no way for this component's JS to inspect cross-origin frame content.
// There is no fully reliable way to detect this from client-side JS alone.
// Rather than pretend otherwise, this always keeps the "Open Diary Securely"
// fallback visible alongside the iframe (not hidden behind a failure state
// that might never fire) — so a therapist whose provider silently blocks
// embedding always has a one-click way to see their real calendar, and nothing
// here ever claims a blocked embed "failed" when it may just be slow to load.
export default function DiaryEmbed({
  embedUrl,
  provider,
}: {
  embedUrl: string;
  provider: CalendarEmbedProvider;
}) {
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-muted-fg">
          {provider ? `Provider: ${CALENDAR_EMBED_PROVIDER_LABEL[provider] ?? provider}` : null}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {expanded ? "Collapse" : "Expand"}
          </Button>
          {/* Phase 208 — always available, not only as a fallback: some
              providers' embedded view is intentionally limited (e.g. no
              multi-week navigation), so a therapist may want their real
              calendar in a full tab even when the embed is working fine.
              noopener,noreferrer — this only ever opens this therapist's
              own embedUrl, passed down from a page that already scoped the
              query to `self.therapist.id`; never another therapist's link
              and never client/booking data. */}
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-[13px] font-medium text-primary transition-colors hover:bg-secondary"
          >
            <ExternalLink size={14} /> Open Diary Securely
          </a>
        </div>
      </div>

      <div
        className={`relative overflow-hidden rounded-[var(--radius)] border border-border bg-card transition-[height] ${
          expanded ? "h-[85vh]" : "h-[520px] sm:h-[620px]"
        }`}
      >
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
            <p className="text-[13px] text-muted-fg">Loading your calendar…</p>
          </div>
        )}
        <iframe
          src={embedUrl}
          title="Professional diary calendar"
          onLoad={() => setLoaded(true)}
          className="h-full w-full border-0"
          // Conservative on purpose — only what a read-only calendar view
          // needs. No allow-top-navigation (can't hijack the parent tab), no
          // allow-modals, no allow-downloads. allow-same-origin is required
          // for Google Calendar/Outlook's own embed scripts to run at all,
          // paired with allow-scripts; allow-popups/allow-popups-to-escape-
          // sandbox let a "view full event" link open a normal new tab
          // instead of silently failing inside the sandboxed frame.
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          // Restrictive referrer policy per spec — never leaks this GESA
          // page's URL (which could otherwise embed a therapist's slug/id)
          // to the calendar provider's servers.
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </div>

      <p className="flex items-start gap-1.5 text-[12px] text-muted-fg">
        <CalendarOff size={13} className="mt-0.5 flex-none" aria-hidden="true" />
        This is a read-only view of your external calendar. It does not create or change GESA bookings — your
        My Bookings page and GESA&apos;s own records are always the source of truth for confirmed sessions.
      </p>
    </div>
  );
}
