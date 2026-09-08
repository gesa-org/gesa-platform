"use client";

import { useEffect, useState } from "react";
import { LifeBuoy } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { CrisisButtonContent } from "@/lib/content";
import EditableText from "@/components/ui-builder/public/EditableText";
import CountrySelector from "@/components/crisis/CountrySelector";
import CrisisResourceList from "@/components/crisis/CrisisResourceList";

// Phase 169 — session-only persistence for the country the visitor picked
// in this modal, so closing and reopening it (or navigating between pages,
// since this button is rendered globally) doesn't make them re-pick every
// time. Deliberately sessionStorage, not localStorage: this is a small UX
// convenience for one visit, not something that should survive across a
// shared/public computer's next session. Guarded for the SSR render pass
// (sessionStorage doesn't exist server-side) and for the file:// / privacy
// modes where reading storage can throw.
const COUNTRY_STORAGE_KEY = "gesa_crisis_country";

function readStoredCountry(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(COUNTRY_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredCountry(code: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(COUNTRY_STORAGE_KEY, code);
  } catch {
    // Ignore — worst case the visitor re-picks their country next time.
  }
}

// Phase 80 round 2 — this button/modal renders on every single page (wired
// once in app/layout.tsx) but was fully hardcoded. Since it's a Client
// Component (needs useState for the modal's open/closed state) it can't
// call the server-only getPageContent itself — same constraint and same
// fix as Header/Footer: app/layout.tsx (a Server Component) fetches this
// once and passes it down as a prop, defaulting to this fallback so the
// button still works even if that fetch is ever skipped in a test render.
//
// Phase 169 — the four resource1-4 fields below are kept only so existing
// published `component_crisis_button` content rows (and CrisisButtonEditor's
// type) don't break; they are no longer read or rendered anywhere in this
// component. Every visitor used to see the same US-only 988/911/741741
// resources regardless of where they actually were — QA flagged this (see
// EXECUTION_PLAN.md Phase 169). Resources are now looked up per-country from
// lib/crisisResources.ts via the selector below instead.
export const CRISIS_BUTTON_CONTENT_FALLBACK: CrisisButtonContent = {
  published: true,
  triggerLabel: "In crisis? Get help",
  modalHeading: "You are not alone",
  modalSubtitle: "If you are struggling right now, help is available. Reach out to one of these resources.",
  resource1Title: "988 Suicide & Crisis Lifeline",
  resource1Description: "24/7 free & confidential",
  resource1Href: "tel:988",
  resource2Title: "Crisis Text Line",
  resource2Description: "Text HOME to 741741",
  resource2Href: "sms:741741",
  resource3Title: "988 Lifeline Chat",
  resource3Description: "Chat online now",
  resource3Href: "https://988lifeline.org/chat/",
  resource4Title: "Find a helpline worldwide",
  resource4Description: "International directory",
  resource4Href: "https://findahelpline.com/",
  disclaimer: "GESA is not an emergency service. If you are in immediate danger, call your local emergency number.",
};

export default function CrisisButton({ content = CRISIS_BUTTON_CONTENT_FALLBACK }: { content?: CrisisButtonContent }) {
  const [open, setOpen] = useState(false);
  // Starts unset on both server and first client render (readStoredCountry()
  // itself already guards for `window === undefined`, but reading it inside
  // useState's initializer would still make the very first client render
  // disagree with the server's — this component isn't SSRed at all since
  // it's rendered inside a Client Component tree, but doing the read in an
  // effect instead is the same safe pattern Modal.tsx above already uses
  // for its own `mounted` flag). No geolocation call anywhere here — a
  // returning visitor's country reappears only because they picked it
  // earlier this session, never because we looked up their location.
  const [countryCode, setCountryCode] = useState<string | null>(null);

  useEffect(() => {
    setCountryCode(readStoredCountry());
  }, []);

  function handleCountryChange(code: string) {
    setCountryCode(code);
    writeStoredCountry(code);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-full border border-border bg-card px-[17px] py-3 font-semibold text-primary shadow-lg transition-colors hover:bg-secondary"
      >
        <LifeBuoy size={18} className="text-clay" />
        <EditableText contentId="global.crisisButton.triggerLabel" label="Launcher button label" value={content.triggerLabel} as="span" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <h3 className="text-lg font-semibold m-0">
          <EditableText contentId="global.crisisButton.modalHeading" label="Modal heading" value={content.modalHeading} as="span" />
        </h3>
        <p className="text-muted-fg mt-1.5 mb-3">
          <EditableText contentId="global.crisisButton.modalSubtitle" label="Modal subtitle" value={content.modalSubtitle} as="span" />
        </p>

        {/* Fixed, non-editable safety copy — always visible regardless of
            which country (if any) is selected below, per the requirement
            that a universal emergency notice never depends on a dropdown
            selection having been made. The CMS-editable `disclaimer` field
            further down is GESA's own "we are not an emergency service"
            framing and stays separate from this. */}
        <p className="mb-4 rounded-xl bg-secondary/50 px-3.5 py-3 text-[13.5px] font-medium text-foreground">
          If you are in immediate danger or may act on thoughts of harming yourself or someone else, contact local
          emergency services now.
        </p>

        <div className="mb-4">
          <CountrySelector value={countryCode} onChange={handleCountryChange} />
        </div>

        <CrisisResourceList countryCode={countryCode} />

        <div className="mt-3 rounded-xl bg-accent-soft px-3.5 py-3 text-sm text-primary-600">
          <EditableText contentId="global.crisisButton.disclaimer" label="Disclaimer" value={content.disclaimer} as="span" />
        </div>
      </Modal>
    </>
  );
}
