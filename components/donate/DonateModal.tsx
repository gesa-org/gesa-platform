"use client";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { DonatePageContent } from "@/lib/content";
import { useDonationGift } from "@/components/donate/useDonationGift";

// Phase 233 — the "open from anywhere" donation modal. Every donation CTA
// that isn't the giving section itself (hero "Donate Now", the final "Make
// a Donation" band, and any future donation CTA) opens this instead of
// linking/anchor-scrolling — see DonateCtaButton.tsx, the trigger+modal
// wrapper around this component, same pattern as
// components/volunteer/VolunteerApplyButton.tsx.
//
// Built from the exact same state/validation/submission code as the giving
// section's own inline card (components/donate/DonateForm.tsx) via the
// shared useDonationGift hook — not a duplicate form. The one real
// difference: DonateForm keeps its amount/frequency picker inline on the
// page (Roy's explicit choice, so the giving section's look doesn't
// change), while this component keeps that same picker as "step 1" inside
// the modal itself, since it's opened from a plain button with no picker
// already on the page. Step 2 (name/email/phone/message, then redirect to
// Mollie checkout) is identical in both — same fields, same copy, same
// request.
export default function DonateModal({ content, onClose }: { content: DonatePageContent; onClose: () => void }) {
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

  // Closing the modal at either step hands control back to DonateCtaButton
  // (which unmounts this component) — `closeContact` only resets the
  // internal "which step" state, so route both through the same onClose the
  // trigger gave us, unless a submission is in flight (same guard
  // useDonationGift's own closeContact already applies to the step-2 case).
  function close() {
    if (pending) return;
    onClose();
  }

  return (
    <Modal open onClose={close}>
      {!contactOpen ? (
        <>
          <h3 className="mb-1 text-xl">{content.givingHeading}</h3>
          <form onSubmit={openContact} className="mt-5 flex flex-col items-center gap-5">
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
                <label htmlFor="donate-modal-custom-amount" className="sr-only">
                  Custom gift amount in euros
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-border px-3.5 py-2.5 focus-within:border-primary">
                  <span className="text-muted-fg">€</span>
                  <input
                    id="donate-modal-custom-amount"
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
        </>
      ) : (
        <>
          <h3 className="mb-1 text-xl">Confirm your gift</h3>
          <p className="mb-5 text-[14px] text-muted-fg">
            {frequency === "monthly" ? "Monthly" : "One-time"} gift of <strong>€{resolvedAmount}</strong>. Share your
            details, then you&apos;ll be sent to Mollie&apos;s secure checkout to complete payment — GESA never sees
            your card details.
          </p>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="donate-modal-full-name" className="mb-1.5 block text-sm font-semibold">
                  Full name <span className="text-destructive">*</span>
                </label>
                <input
                  id="donate-modal-full-name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="donate-modal-email" className="mb-1.5 block text-sm font-semibold">
                  Email <span className="text-destructive">*</span>
                </label>
                <input
                  id="donate-modal-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label htmlFor="donate-modal-phone" className="mb-1.5 block text-sm font-semibold">
                Phone (optional)
              </label>
              <input
                id="donate-modal-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
                className="w-full max-w-[260px] rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="donate-modal-message" className="mb-1.5 block text-sm font-semibold">
                Message (optional)
              </label>
              <textarea
                id="donate-modal-message"
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
        </>
      )}
    </Modal>
  );
}
