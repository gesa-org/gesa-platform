"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function ContactForm() {
  const params = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
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
          subject: String(data.get("subject") ?? ""),
          message: String(data.get("message") ?? ""),
        };
        const supabase = createClient();
        const { error: insertError } = await supabase.from("inquiries").insert({
          name: payload.name,
          email: payload.email,
          type: payload.subject,
          message: payload.message,
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
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" block>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
