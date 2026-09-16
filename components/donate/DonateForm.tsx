"use client";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { DonatePageContent } from "@/lib/content";
import { useDonationGift } from "@/components/donate/useDonationGift";

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
//
// Phase 233 — Roy asked every donation CTA site-wide (hero, this giving
// section, the final "Make a Donation" band, etc.) to open "the exact same
// donation form modal," reusing state/validation/submission rather than
// duplicating it. Confirmed with Roy first: this giving section keeps its
// current look exactly as-is (amount/frequency picker inline on the page,
// contact-details modal on submit) — only the *other* CTAs change, each
// opening a new self-contained popup (DonateModal.tsx, via
// DonateCtaButton.tsx) built from the same amount-selection/validation/
// submission code. To make that real code reuse rather than two parallel
// copies, this component's state and handlers moved into a shared hook,
// useDonationGift.ts — this file's own rendered markup and behavior are
// unchanged (verified against tests/unit/DonateForm.test.tsx).
export default function DonateForm({ content }: { content: DonatePageContent }) {
  const {
    amountOptions,
    frequency,
    setFrequency,
    selectedAmount,
    customAmount,
    setCustomAmount,
    showCustom,
    pickPreset,
    pickCustom,
    resolvedAmount,
    contactOpen,
    fullName,
    setFullName,
    email,
    setEmail,
    phone,
    setPhone,
    message,
    setMessage,
    pending,
    amountError,
    submitError,
    openContact,
    handleSubmit,
    closeContact,
  } = useDonationGift(content);

  return (
    <div id="giving-box" className="mx-auto max-w-[560px] rounded-[var(--radius)] border border-border bg-card p-7 shadow-soft sm:p-9">
      <h2 className="text-center text-[22px] font-semibold text-foreground">{content.givingHeading}</h2>

      <form onSubmit={openContact} className="mt-6 flex flex-col items-center gap-5">
        <div className="inline-flex rounded-full border border-border bg-background p-1" role="radiogroup" aria-label="Gift frequency">
          {(["once", "monthly"] as const).map((f) => (
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
