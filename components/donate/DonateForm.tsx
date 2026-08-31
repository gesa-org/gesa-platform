"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { DonatePageContent } from "@/lib/content";

// Phase 98 — the interactive half of the new /donate page (see
// components/donate/DonatePage.tsx for the static sections around it).
//
// Phase 99 — Roy connected Mollie as a real payment processor. Confirming
// the gift details now posts to /api/donations/create-payment, which saves
// the `donations` row (status "open") and asks Mollie for a real checkout
// session, then this redirects the browser to Mollie's own hosted payment
// page — cards, iDEAL, PayPal, etc. depending on what's enabled in the
// Mollie dashboard. The donor pays on Mollie's site, not this one; GESA
// never sees card details. What actually happened to the payment (paid,
// failed, expired) is only known once Mollie's webhook reports back (see
// app/api/webhooks/mollie/route.ts) — so there's no "submitted" state here
// the way there was pre-Mollie; this component's job ends at the redirect.
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
  // Two separate error states, not one shared string — the amount-selection
  // form and the contact/payment modal form each render their own error
  // paragraph, and a single shared string would render in both places at
  // once whenever either step failed (caught by a test: "Found multiple
  // elements with the text...").
  const [amountError, setAmountError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
      setAmountError("Please choose or enter a gift amount.");
      return;
    }
    setAmountError(null);
    setSubmitError(null);
    setContactOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resolvedAmount || resolvedAmount <= 0) {
      setSubmitError("Please choose or enter a gift amount.");
      return;
    }
    setPending(true);
    setSubmitError(null);

    const amountChoice = showCustom ? "custom" : String(selectedAmount);

    try {
      const res = await fetch("/api/donations/create-payment", {
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
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.checkoutUrl) {
        setPending(false);
        setSubmitError(data?.error || "Something went wrong starting your donation. Please try again.");
        return;
      }
      // Full-page redirect to Mollie's hosted checkout — not a client-side
      // route change, so `pending` deliberately stays true (no reset) while
      // the browser navigates away.
      window.location.href = data.checkoutUrl;
    } catch {
      setPending(false);
      setSubmitError("Something went wrong starting your donation. Please try again.");
    }
  }

  function closeContact() {
    if (pending) return;
    setContactOpen(false);
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

        {amountError && <p className="text-sm text-destructive">{amountError}</p>}

        <Button type="submit" block>
          {content.giftCtaLabel}
        </Button>
      </form>

      {contactOpen && (
        <Modal open onClose={closeContact}>
          <h3 className="mb-1 text-xl">Confirm your gift</h3>
          <p className="mb-5 text-[14px] text-muted-fg">
            {frequency === "monthly" ? "Monthly" : "One-time"} gift of <strong>€{resolvedAmount}</strong>. Share your
            details, then you&apos;ll be sent to Mollie&apos;s secure checkout to complete payment — GESA never sees
            your card details.
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

            {submitError && <p className="text-sm text-destructive">{submitError}</p>}

            <Button type="submit" block disabled={pending}>
              {pending ? "Redirecting to checkout…" : "Continue to payment"}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
