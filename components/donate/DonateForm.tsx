"use client";

import { useState } from "react";
import { HeartHandshake } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import type { DonatePageContent } from "@/lib/content";

// Phase 98 — the interactive half of the new /donate page (see
// components/donate/DonatePage.tsx for the static sections around it).
// There's no payment processor connected to this project (Stripe, PayPal,
// etc. — see EXECUTION_PLAN.md Phase 98), so "Make my gift" can't actually
// charge a card yet. Per Roy's explicit choice, it instead captures the
// gift *intent* — amount, frequency, and contact details — into a real
// `donations` table (same insert-then-thank-you pattern as
// VolunteerApplicationModal.tsx and `therapist_applications`), visible at
// /admin/donations, so nothing here is a dead button: selecting an amount,
// toggling frequency, and submitting all do something real, they just don't
// move money yet.
type Frequency = "once" | "monthly";

export default function DonateForm({ content }: { content: DonatePageContent }) {
  // content.amount1/2/3 are stored as strings (see the DonatePageContent
  // comment in lib/content.ts) since they round-trip through the generic
  // FlatFieldsEditor's plain-text inputs — parsed to real numbers here so
  // the rest of this component can do real math with them.
  const amountOptions = [Number(content.amount1), Number(content.amount2), Number(content.amount3)].filter(
    (n) => Number.isFinite(n) && n > 0
  );

  const [frequency, setFrequency] = useState<Frequency>("once");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(amountOptions[0] ?? null);
  const [customAmount, setCustomAmount] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const [contactOpen, setContactOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function pickPreset(amount: number) {
    setSelectedAmount(amount);
    setShowCustom(false);
    setCustomAmount("");
  }

  function pickCustom() {
    setShowCustom(true);
    setSelectedAmount(null);
  }

  const resolvedAmount = showCustom ? Number(customAmount) : selectedAmount;
  const canOpenContact = !!resolvedAmount && resolvedAmount > 0;

  function openContact(e: React.FormEvent) {
    e.preventDefault();
    if (!canOpenContact) {
      setError("Please choose or enter a gift amount.");
      return;
    }
    setError(null);
    setContactOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resolvedAmount || resolvedAmount <= 0) {
      setError("Please choose or enter a gift amount.");
      return;
    }
    setPending(true);
    setError(null);

    const amountChoice = showCustom ? "custom" : String(selectedAmount);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("donations").insert({
      full_name: fullName,
      email,
      phone: phone || null,
      frequency,
      amount: resolvedAmount,
      amount_choice: amountChoice,
      message: message || null,
    });

    setPending(false);
    if (insertError) {
      setError("Something went wrong saving your gift. Please try again.");
      return;
    }
    setSubmitted(true);
    // Best-effort — the pledge is already saved even if either email fails.
    fetch("/api/email/donation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        phone: phone || null,
        frequency,
        amount: resolvedAmount,
        amountChoice,
        message: message || null,
      }),
    }).catch(() => {});
  }

  function closeContact() {
    setContactOpen(false);
    setSubmitted(false);
  }

  return (
    <div id="giving-box" className="mx-auto max-w-[560px] rounded-[var(--radius)] border border-border bg-card p-7 shadow-soft sm:p-9">
      <h2 className="text-center text-[22px] font-semibold text-foreground">{content.givingHeading}</h2>

      <form onSubmit={openContact} className="mt-6 flex flex-col items-center gap-5">
        <div className="inline-flex rounded-full border border-border bg-background p-1" role="radiogroup" aria-label="Gift frequency">
          {(["once", "monthly"] as Frequency[]).map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={frequency === f}
              onClick={() => setFrequency(f)}
              className={`rounded-full px-5 py-2 text-[13px] font-semibold uppercase tracking-wide transition-colors ${
                frequency === f ? "bg-primary text-primary-fg" : "text-muted-fg hover:text-primary"
              }`}
            >
              {f === "once" ? content.onceLabel : content.monthlyLabel}
            </button>
          ))}
        </div>

        <div className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-4">
          {amountOptions.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => pickPreset(amount)}
              aria-pressed={!showCustom && selectedAmount === amount}
              className={`rounded-xl border px-3 py-3 text-[15px] font-semibold transition-colors ${
                !showCustom && selectedAmount === amount
                  ? "border-primary bg-primary text-primary-fg"
                  : "border-border text-foreground hover:border-primary-600"
              }`}
            >
              €{amount}
            </button>
          ))}
          <button
            type="button"
            onClick={pickCustom}
            aria-pressed={showCustom}
            className={`rounded-xl border px-3 py-3 text-[13px] font-semibold uppercase tracking-wide transition-colors ${
              showCustom ? "border-primary bg-primary text-primary-fg" : "border-border text-foreground hover:border-primary-600"
            }`}
          >
            {content.customLabel}
          </button>
        </div>

        {showCustom && (
          <div className="w-full max-w-[220px]">
            <label htmlFor="donate-custom-amount" className="sr-only">
              Custom gift amount in euros
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border px-3.5 py-2.5 focus-within:border-primary">
              <span className="text-muted-fg">€</span>
              <input
                id="donate-custom-amount"
                type="number"
                min={1}
                inputMode="decimal"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Amount"
                className="w-full bg-transparent outline-none"
              />
            </div>
          </div>
        )}

        <p className="text-center text-[13px] text-muted-fg">{content.giftNote}</p>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" block>
          {content.giftCtaLabel}
        </Button>
      </form>

      {contactOpen && (
        <Modal open onClose={closeContact}>
          {submitted ? (
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-primary">
                <HeartHandshake size={22} />
              </div>
              <h3 className="mb-1.5 text-xl">Thank you, {fullName || "friend"}</h3>
              <p className="text-muted-fg">
                We&apos;ve received your {frequency === "monthly" ? "monthly" : "one-time"} gift pledge of €
                {resolvedAmount}. Our team will follow up at {email} with next steps.
              </p>
            </div>
          ) : (
            <>
              <h3 className="mb-1 text-xl">Confirm your gift</h3>
              <p className="mb-5 text-[14px] text-muted-fg">
                {frequency === "monthly" ? "Monthly" : "One-time"} gift of <strong>€{resolvedAmount}</strong>. Share
                your details so our team can follow up — GESA has no live payment processor connected yet, so this
                confirms your pledge rather than charging a card.
              </p>
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="donate-full-name" className="mb-1.5 block text-sm font-semibold">
                      Full name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="donate-full-name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="donate-email" className="mb-1.5 block text-sm font-semibold">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="donate-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="donate-phone" className="mb-1.5 block text-sm font-semibold">
                    Phone (optional)
                  </label>
                  <input
                    id="donate-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 123 4567"
                    className="w-full max-w-[260px] rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="donate-message" className="mb-1.5 block text-sm font-semibold">
                    Message (optional)
                  </label>
                  <textarea
                    id="donate-message"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Anything you'd like our team to know."
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" block disabled={pending}>
                  {pending ? "Submitting…" : "Confirm pledge"}
                </Button>
              </form>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
