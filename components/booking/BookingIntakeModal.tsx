"use client";

import { useEffect, useRef } from "react";
import Modal from "@/components/ui/Modal";
import BookingIntakeForm from "@/components/booking/BookingIntakeForm";

// Phase 128 — the required client-intake step between clicking "Choose a
// date and time" and actually reaching a therapist's diary-link scheduler.
// Reuses the site's one shared `Modal` (portal, backdrop-click-to-close,
// Escape-to-close, transition) rather than building a second modal shell,
// and only adds what that shared component doesn't already have: a focus
// trap scoped to this dialog's own content, since Modal itself doesn't trap
// focus for any of its callers today. Doing it here rather than inside the
// shared Modal keeps this change contained to the one flow that asked for
// it, instead of altering focus behavior for every existing modal on the
// site at once.
export default function BookingIntakeModal({
  therapistId,
  therapistName,
  onClose,
  onSuccess,
}: {
  therapistId: string;
  therapistName: string;
  onClose: () => void;
  onSuccess: (intakeId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Focus the first focusable field once the modal has mounted.
    const focusable = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'input, select, textarea, button, a[href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);

    const first = focusable()[0];
    first?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const elements = focusable();
      if (elements.length === 0) return;
      const firstEl = elements[0];
      const lastEl = elements[elements.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }

    container.addEventListener("keydown", onKeyDown);
    return () => container.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Modal open onClose={onClose}>
      <div ref={containerRef} role="dialog" aria-modal="true" aria-labelledby="booking-intake-title">
        <h2 id="booking-intake-title" className="mb-1.5 text-xl">
          Before you book your session
        </h2>
        <p className="mb-5 text-[14px] text-muted-fg">
          Please provide your details before selecting a date and time with this professional.
        </p>
        <BookingIntakeForm
          therapistId={therapistId}
          therapistName={therapistName}
          onCancel={onClose}
          onSuccess={onSuccess}
        />
      </div>
    </Modal>
  );
}
