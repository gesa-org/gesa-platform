"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

// Phase 150 — this is the retained, single general-inquiry form on the
// public website (confirmed via a full-repo audit: no other standalone
// "inquiry modal"/contact form exists — HelpUsGrowForm in the footer is a
// second, lighter entry point into this same `inquiries` table, not a
// duplicate). Added a phone field and a required consent/privacy-policy
// checkbox this phase, and tags every row it creates with
// `source: "contact_form"` so /admin/inquiries can show where each inquiry
// came from.
export default function ContactForm() {
  const params = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Phase 150 — this is the retained, single general-inquiry form; the
  // spec for it requires a consent/privacy-policy confirmation, which this
  // form didn't previously collect (HelpUsGrowForm, the footer's lighter
  // entry point into the same `inquiries` table, already had one). Added
  // here to match, and gated on the submit button so a client can't send
  // without checking it.
  const [consent, setConsent] = useState(false);
  const defaultSubject = params.get("subject") ?? "";

  if (submitted) {
    return (
      <div className="mt-8 rounded-2xl bg-accent-soft p-6 text-center text-primary-600">
        Thank you — your message has been received. We&apos;ll be in touch soon.
      </div>
    );
  }

  return (
    <form
      className="mt-8 flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        const form = e.currentTarget;
        const data = new FormData(form);
        const payload = {
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          phone: String(data.get("phone") ?? ""),
          subject: String(data.get("subject") ?? ""),
          message: String(data.get("message") ?? ""),
        };
        const supabase = createClient();
        const { error: insertError } = await supabase.from("inquiries").insert({
          name: payload.name,
          email: payload.email,
          phone: payload.phone || null,
          type: payload.subject,
          message: payload.message,
          // Phase 150 — status/source/consent added to the inquiries table
          // this phase (see the extend_inquiries_status_notes_source_
          // consent migration); status defaults to "New" at the DB level,
          // so only source/consent need setting explicitly here.
          source: "contact_form",
          consent,
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
          body: JSON.stringify(payload),
        }).catch(() => {});
      }}
    >
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Name</label>
        <input
          name="name"
          required
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Phone (optional)</label>
        <input
          name="phone"
          type="tel"
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Subject</label>
        <select
          name="subject"
          defaultValue={defaultSubject}
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        >
          <option value="">General inquiry</option>
          <option value="Donation">Donation</option>
          <option value="Volunteer">Volunteer as a therapist</option>
          <option value="Support">I need support</option>
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Message</label>
        <textarea
          name="message"
          required
          rows={5}
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
      </div>
      <label className="flex items-start gap-2.5 text-[13px]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
          className="mt-0.5"
        />
        <span>
          I agree to be contacted by GESA about this inquiry, in line with the{" "}
          <a href="/privacy-policy" target="_blank" rel="noreferrer" className="font-semibold text-primary underline">
            Privacy Policy
          </a>
          .
        </span>
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" block disabled={pending || !consent}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
