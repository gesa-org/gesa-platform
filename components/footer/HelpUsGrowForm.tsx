"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Phase 70 — reuses the existing "inquiries" table (already public-insert
// via RLS, already reviewed at /admin/inquiries) rather than a new table —
// this is just another inquiry entry point, distinguished from the full
// Contact page by `type: "Help us grow"` so Roy can tell them apart in the
// CRM list. The reference design has no message/body textarea, but the
// shared /api/email/contact route (also used by the full Contact form)
// requires a non-empty `message` to send the admin-notification email — a
// short summary line is generated from the subject + phone rather than
// adding a textarea the reference design doesn't show.
//
// Phase 70 follow-up — Roy sent a second reference (a full-width, two-
// column "brushed metal" card: intro copy on the left, a labeled-field
// form on the right, Name/Phone/Subject sharing one row, Email full width,
// consent row, full-width submit) and asked to adopt that layout/format
// while keeping all of this project's own text as-is — so only the
// structure/visual treatment changed here, not the heading, subtitle,
// placeholders, checkbox copy, subject options, or button label below.
const SUBJECT_OPTIONS = ["Donate", "Volunteer as a therapist", "Partnership", "General inquiry"];

const fieldClass =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none";
const labelClass = "mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-white/70";

// Content Manager audit pass — heading/subtitle/submit-state copy now comes
// from Footer.tsx's content prop (FooterContent's helpGrow* fields) instead
// of being hardcoded here. Defaults match today's live copy exactly so
// nothing changes visually until an admin edits the Footer tab.
export default function HelpUsGrowForm({
  heading = "Help us grow",
  subtitle = "We will continue to contribute and succeed, also thanks to you.",
  submitLabel = "Sent",
  sendingLabel = "Sending…",
  submittedMessage = "Thank you — we've received your message and will be in touch soon.",
}: {
  heading?: string;
  subtitle?: string;
  submitLabel?: string;
  sendingLabel?: string;
  submittedMessage?: string;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [consent, setConsent] = useState(false);

  const cardClass =
    "relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900 p-7 sm:p-9 shadow-2xl";

  if (submitted) {
    return (
      <div className={cardClass}>
        <p className="text-center text-[14px] text-white">{submittedMessage}</p>
      </div>
    );
  }

  return (
    <form
      className={`${cardClass} grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:items-start`}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!consent) {
          setError("Please confirm you're over 18 and have read the Privacy Policy.");
          return;
        }
        setPending(true);
        setError(null);
        const form = e.currentTarget;
        const data = new FormData(form);
        const name = String(data.get("name") ?? "");
        const phone = String(data.get("phone") ?? "");
        const email = String(data.get("email") ?? "");
        const subject = String(data.get("subject") ?? SUBJECT_OPTIONS[0]);
        const message = `Help us grow submission — subject: ${subject}${phone ? `, phone: ${phone}` : ""}`;

        const supabase = createClient();
        const { error: insertError } = await supabase.from("inquiries").insert({
          name,
          email,
          phone,
          type: "Help us grow",
          message,
        });
        setPending(false);
        if (insertError) {
          setError("Something went wrong sending your message. Please try again.");
          return;
        }
        setSubmitted(true);
        // Best-effort — the inquiry is already saved even if email sending fails.
        fetch("/api/email/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, subject, message }),
        }).catch(() => {});
      }}
    >
      <div>
        <h4 className="text-[22px] font-semibold text-white">{heading}</h4>
        <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/70">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="help-grow-name">
              Name
            </label>
            <input id="help-grow-name" name="name" placeholder="Name" required className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="help-grow-phone">
              Phone
            </label>
            <input id="help-grow-phone" name="phone" type="tel" placeholder="Phone" className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="help-grow-subject">
              Subject
            </label>
            <select id="help-grow-subject" name="subject" defaultValue={SUBJECT_OPTIONS[0]} className={fieldClass}>
              {SUBJECT_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="text-foreground">
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="help-grow-email">
            Email
          </label>
          <input id="help-grow-email" name="email" type="email" placeholder="Email" required className={fieldClass} />
        </div>

        <label className="flex items-start gap-2 text-[12px] leading-relaxed text-white/70">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 flex-none"
          />
          <span>
            I confirm that I am over 18 years of age and have read the{" "}
            <a href="/privacy-policy" className="text-white underline">
              Privacy Policy
            </a>
          </span>
        </label>

        {error && <p className="text-[12px] text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-white py-3 text-[14.5px] font-semibold text-slate-900 transition-colors hover:bg-white/90 disabled:opacity-60"
        >
          {pending ? sendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
