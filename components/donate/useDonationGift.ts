"use client";

import { useState } from "react";
import type { DonatePageContent } from "@/lib/content";

// Phase 233 — extracted from DonateForm.tsx's own local state/handlers so
// the exact same amount-selection, validation, and Mollie-submission logic
// can power two different surfaces: the giving section's existing inline
// card (DonateForm.tsx, unchanged in appearance/behavior) and the new
// DonateModal.tsx (opened from the hero, final CTA, and any other donation
// CTA — see DonateCtaButton.tsx). One shared hook, not two copies that can
// drift apart — exactly Roy's "do not create a duplicate modal or a
// separate donation form" requirement.
export type Frequency = "once" | "monthly";

export function useDonationGift(content: DonatePageContent) {
  // content.amount1/2/3 are stored as strings (see the DonatePageContent
  // comment in lib/content.ts) since they round-trip through the generic
  // FlatFieldsEditor's plain-text inputs — parsed to real numbers here so
  // the rest of this hook can do real math with them.
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
  // step and the contact/payment step each render their own error
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

  return {
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
    setContactOpen,
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
  };
}
