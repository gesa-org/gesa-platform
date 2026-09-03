"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import PhoneNumberInput from "@/components/ui/PhoneNumberInput";
import type { TherapistAdminRow } from "@/lib/queries";

function isLikelyUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function TherapistEditForm({ therapist }: { therapist: TherapistAdminRow }) {
  const [photoUrl, setPhotoUrl] = useState(therapist.photo_url ?? "");
  const [fullName, setFullName] = useState(therapist.full_name);
  const [shortSummary, setShortSummary] = useState(therapist.short_summary ?? "");
  const [bio, setBio] = useState(therapist.bio ?? "");
  const [credentials, setCredentials] = useState(therapist.credentials ?? "");
  const [contactEmail, setContactEmail] = useState(therapist.contact_email ?? "");
  // Phase 125 — phone field. `contact_phone` already existed as a nullable
  // text column (confirmed directly against the Production Supabase
  // project before building this — no migration needed), just never had a
  // UI. Stored as E.164 (e.g. "+639171234567"); `phoneValid` gates saving
  // (see onSubmit) so a still-invalid, non-empty number can't be saved, but
  // an intentionally empty field always can — matching the "don't block
  // saving existing professionals with no phone number" requirement.
  const [contactPhone, setContactPhone] = useState<string | null>(therapist.contact_phone ?? null);
  const [phoneValid, setPhoneValid] = useState(true);
  // Phase 126 — diary_link/country/price_note columns already existed from
  // the spreadsheet sync migration but had no admin UI until now.
  // diary_link_status is derived automatically on save (see onSubmit)
  // rather than editable directly: "valid"/"unset" based on whether the
  // field looks like a real URL, since asking admins to hand-pick a status
  // is one more way to get it wrong. An admin who knows a link is broken
  // (e.g. it 404s) can still blank it out to fall back to native booking.
  const [diaryLink, setDiaryLink] = useState(therapist.diary_link ?? "");
  const [country, setCountry] = useState(therapist.country ?? "");
  const [priceNote, setPriceNote] = useState(therapist.price_note ?? "");
  const [specialties, setSpecialties] = useState(therapist.specialties.join(", "));
  const [languages, setLanguages] = useState(therapist.languages.join(", "));
  const [isActive, setIsActive] = useState(therapist.is_active);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dashboard follow-up — links this therapist record to a real login
  // (profiles.role = "therapist") so the person can sign in at /login and
  // see their own bookings at /therapist. Kept separate from the main
  // onSubmit/save flow below: linking writes `profile_id` immediately
  // rather than waiting for "Save changes", since it involves a lookup
  // (find the profile by email) that can fail in its own way (no such
  // account, or an account that isn't the "therapist" role) and shouldn't
  // be silently bundled into — or block — an unrelated bio/photo edit.
  const [linkedEmail, setLinkedEmail] = useState(therapist.linkedAccountEmail);
  const [linkEmailInput, setLinkEmailInput] = useState("");
  const [linkPending, setLinkPending] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  async function onLinkAccount(e: React.FormEvent) {
    e.preventDefault();
    setLinkPending(true);
    setLinkError(null);
    const supabase = createClient();
    const email = linkEmailInput.trim();
    const { data: profile, error: lookupError } = await supabase
      .from("profiles")
      .select("id, role, email")
      .eq("email", email)
      .maybeSingle();
    if (lookupError || !profile) {
      setLinkError("No account found with that email. Create one first via Admin Users, then link it here.");
      setLinkPending(false);
      return;
    }
    if (profile.role !== "therapist") {
      setLinkError(`That account exists but is a "${profile.role}", not a "therapist" account — link a therapist-role account instead.`);
      setLinkPending(false);
      return;
    }
    const { error: updateError } = await supabase
      .from("therapists")
      .update({ profile_id: profile.id })
      .eq("id", therapist.id);
    setLinkPending(false);
    if (updateError) {
      setLinkError("Could not link that account — try again.");
      return;
    }
    setLinkedEmail(profile.email);
    setLinkEmailInput("");
  }

  async function onUnlinkAccount() {
    setLinkPending(true);
    setLinkError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.from("therapists").update({ profile_id: null }).eq("id", therapist.id);
    setLinkPending(false);
    if (updateError) {
      setLinkError("Could not unlink that account — try again.");
      return;
    }
    setLinkedEmail(null);
  }

  async function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${therapist.id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("therapist-photos").upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (!uploadError) {
      const { data: publicUrl } = supabase.storage.from("therapist-photos").getPublicUrl(path);
      setPhotoUrl(publicUrl.publicUrl);
    }
    setUploading(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Phone is the one field here with its own validity state (everything
    // else is free text) — block the save only when there's a non-empty,
    // still-invalid number, never for an empty one.
    if (!phoneValid) {
      setStatus("error");
      return;
    }
    setPending(true);
    setStatus("idle");
    const trimmedDiaryLink = diaryLink.trim();
    // Basic URL-format validation only — we can't actually verify the link
    // resolves to a working booking page from here, and the diary providers
    // in use (Google Calendar appointment schedules, Calendly, simplybook.it)
    // don't expose an API to check that. "valid" here means "looks like a
    // real link", not "confirmed working"; an admin who knows otherwise
    // should just clear the field.
    let diaryLinkStatus: "valid" | "unset" = "unset";
    if (trimmedDiaryLink) {
      try {
        const parsed = new URL(trimmedDiaryLink);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") diaryLinkStatus = "valid";
      } catch {
        setStatus("error");
        setPending(false);
        return;
      }
    }
    const supabase = createClient();
    const { error } = await supabase
      .from("therapists")
      .update({
        photo_url: photoUrl || null,
        full_name: fullName,
        short_summary: shortSummary || null,
        bio: bio || null,
        credentials: credentials || null,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        diary_link: trimmedDiaryLink || null,
        diary_link_status: diaryLinkStatus,
        country: country.trim() || null,
        price_note: priceNote.trim() || null,
        specialties: specialties
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        languages: languages
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
      })
      .eq("id", therapist.id);
    setPending(false);
    setStatus(error ? "error" : "saved");
  }

  async function toggleActive() {
    const next = !isActive;
    const supabase = createClient();
    const { error } = await supabase.from("therapists").update({ is_active: next }).eq("id", therapist.id);
    if (!error) setIsActive(next);
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <div className="relative h-20 w-20 flex-none overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent">
          {photoUrl && <Image src={photoUrl} alt={fullName} fill className="object-cover object-[center_22%]" />}
        </div>
        <div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoSelected} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload size={14} /> {uploading ? "Uploading…" : "Upload new photo"}
          </Button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Full name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Short summary</label>
          <input
            value={shortSummary}
            onChange={(e) => setShortSummary(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Bio</label>
          <textarea
            rows={5}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Credentials</label>
          <input
            value={credentials}
            onChange={(e) => setCredentials(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Contact email</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="professional@example.com"
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
          <p className="mt-1 text-[12.5px] text-muted-fg">
            Used for match/booking notifications sent to this professional.
          </p>
        </div>

        <PhoneNumberInput
          id="therapist-phone"
          value={contactPhone}
          onChange={(e164, isValid) => {
            setContactPhone(e164);
            setPhoneValid(isValid);
          }}
          helpText="Optional. Saved in international format; used for match/booking notifications where SMS or a call is needed."
        />

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Scheduling link (optional)</label>
          <input
            type="url"
            value={diaryLink}
            onChange={(e) => setDiaryLink(e.target.value)}
            placeholder="https://calendly.com/… or https://calendar.app.google/…"
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
          <p className="mt-1 text-[12.5px] text-muted-fg">
            If set, &quot;Book a Session&quot; sends clients here to pick their own time instead of the built-in
            date/time picker. Leave blank to use the built-in picker.
          </p>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Country (optional)</label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Israel"
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Price note (optional)</label>
            <input
              value={priceNote}
              onChange={(e) => setPriceNote(e.target.value)}
              placeholder="e.g. Free"
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Specialties (comma-separated)</label>
          <input
            value={specialties}
            onChange={(e) => setSpecialties(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Spoken languages (comma-separated)</label>
          <input
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-4 border-t border-border pt-4">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
          {status === "saved" && <span className="text-[13.5px] font-medium text-primary">Saved.</span>}
          {status === "error" && (
            <span className="text-[13.5px] font-medium text-destructive">
              {!phoneValid
                ? "Fix the phone number above, then save again."
                : diaryLink.trim() && !isLikelyUrl(diaryLink)
                  ? "That doesn't look like a valid link — check the scheduling link above."
                  : "Couldn't save — try again."}
            </span>
          )}
        </div>
      </form>

      <div className="mt-6 border-t border-border pt-5">
        <h3 className="mb-1.5 text-[15px] font-semibold">Professional login</h3>
        <p className="mb-3 text-[13px] text-muted-fg">
          Link this record to a sign-in account so this professional can see their own bookings and diary
          handoffs at their dashboard. Create the account first via{" "}
          <span className="font-medium text-foreground">Admin Users</span> with the &quot;Professional&quot;
          role, then link it here by email.
        </p>
        {linkedEmail ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-accent-soft px-3.5 py-2 text-[13.5px] font-medium text-primary-600">
              Linked to {linkedEmail}
            </span>
            <Button variant="outline" size="sm" onClick={onUnlinkAccount} disabled={linkPending}>
              {linkPending ? "Unlinking…" : "Unlink"}
            </Button>
          </div>
        ) : (
          <form onSubmit={onLinkAccount} className="flex flex-wrap items-center gap-3">
            <input
              type="email"
              required
              value={linkEmailInput}
              onChange={(e) => setLinkEmailInput(e.target.value)}
              placeholder="professional's account email"
              className="w-64 max-w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
            <Button type="submit" size="sm" disabled={linkPending || !linkEmailInput.trim()}>
              {linkPending ? "Linking…" : "Link account"}
            </Button>
          </form>
        )}
        {linkError && <p className="mt-2 text-[13px] text-destructive">{linkError}</p>}
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <h3 className="mb-1.5 text-[15px] font-semibold">Danger zone</h3>
        <p className="mb-3 text-[13px] text-muted-fg">
          Deactivating hides this professional from the public directory and matching, without deleting their record —
          reversible any time.
        </p>
        <Button variant={isActive ? "outline" : "primary"} onClick={toggleActive}>
          {isActive ? "Deactivate professional" : "Reactivate professional"}
        </Button>
      </div>
    </div>
  );
}
