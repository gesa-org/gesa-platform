"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LANGUAGES } from "@/lib/languages";
import Button from "@/components/ui/Button";
import type { Tables } from "@/lib/database.types";

export default function AccountForm({ profile }: { profile: Tables<"profiles"> }) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [language, setLanguage] = useState(profile.preferred_language ?? "en");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setStatus("idle");
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName || null,
        phone: phone || null,
        country: country || null,
        preferred_language: language,
      })
      .eq("id", profile.id);
    setPending(false);
    setStatus(error ? "error" : "saved");
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[var(--radius)] border border-border bg-card p-6">
      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-semibold">Email</label>
        <input
          value={profile.email ?? ""}
          disabled
          className="w-full rounded-xl border border-border bg-secondary/60 px-3.5 py-2.5 text-muted-fg"
        />
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-semibold">Full name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Country</label>
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-5">
        <label className="mb-1.5 block text-sm font-semibold">Preferred language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit">{pending ? "Saving…" : "Save changes"}</Button>
        {status === "saved" && <span className="text-[13.5px] font-medium text-primary">Saved.</span>}
        {status === "error" && <span className="text-[13.5px] font-medium text-destructive">Couldn't save — try again.</span>}
      </div>
    </form>
  );
}
