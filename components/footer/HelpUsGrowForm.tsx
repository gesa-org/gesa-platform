"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Phase 70 — Roy sent a reference screenshot of a "Help us grow" mini-form
// (Name / Phone / Email / Subject dropdown / 18+-and-privacy-policy consent
// / Sent button) and asked for it inside the footer, wired to actually save
// submissions to the CRM. Reuses the existing "inquiries" table (already
// public-insert via RLS, already has an admin review page at
// /admin/inquiries) rather than inventing a parallel table — this is just
// another inquiry entry point, distinguished from the full Contact page by
// `type: "Help us grow"` so Roy can tell them apart in the CRM list. The
// table had no `phone` column before this phase; one was added (nullable)
// since the reference design has a dedicated phone field the full Contact
// form doesn't.
//
// The reference design has no message/body textarea, but the shared
// /api/email/contact route (also used by the full Contact form) requires a
// non-empty `message` to send the admin-notification email — so a short
// summary line is generated from the subject + phone rather than adding a
// textarea the reference design doesn't show.
const SUBJECT_OPTIONS = ["Donate", "Volunteer as a therapist", "Partnership", "General inquiry"];

export default function HelpUsGrowForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [consent, setConsent] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-2xl bg-card p-6 text-center text-[13.5px] text-primary-600">
        Thank you — we&apos;ve received your message and will be in touch soon.
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-2xl bg-card p-6 text-left shadow-lg"
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
      <h4 className="text-[17px] font-semibold text-foreground">Help us grow</h4>
      <p className="mb-1 text-[13px] leading-relaxed text-muted-fg">
        We will continue to contribute and succeed, also thanks to you.
      </p>
      <input
        name="name"
        placeholder="Name"
        required
        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-muted-fg focus:border-primary focus:outline-none"
      />
      <input
        name="phone"
        type="tel"
        placeholder="Phone"
        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-muted-fg focus:border-primary focus:outline-none"
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-muted-fg focus:border-primary focus:outline-none"
      />
      <select
        name="subject"
        defaultValue={SUBJECT_OPTIONS[0]}
        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[13.5px] text-foreground focus:border-primary focus:outline-none"
      >
        {SUBJECT_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <label className="flex items-start gap-2 text-[12px] leading-relaxed text-muted-fg">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 flex-none"
        />
        <span>
          I confirm that I am over 18 years of age and have read the{" "}
          <a href="/privacy-policy" className="text-primary underline">
            Privacy Policy
          </a>
        </span>
      </label>
      {error && <p className="text-[12px] text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 w-full rounded-full bg-primary py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Sent"}
      </button>
    </form>
  );
}
