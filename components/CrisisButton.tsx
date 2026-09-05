"use client";

import { useState } from "react";
import { LifeBuoy, Phone, MessageCircle, Globe2, ExternalLink } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { CrisisButtonContent } from "@/lib/content";
import EditableText from "@/components/ui-builder/public/EditableText";

// Phase 80 round 2 — this button/modal renders on every single page (wired
// once in app/layout.tsx) but was fully hardcoded. Since it's a Client
// Component (needs useState for the modal's open/closed state) it can't
// call the server-only getPageContent itself — same constraint and same
// fix as Header/Footer: app/layout.tsx (a Server Component) fetches this
// once and passes it down as a prop, defaulting to this fallback so the
// button still works even if that fetch is ever skipped in a test render.
const ICONS = [Phone, MessageCircle, Globe2, ExternalLink];

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

  const resources = [
    {
      icon: ICONS[0],
      titleId: "global.crisisButton.resource1Title",
      title: content.resource1Title,
      descId: "global.crisisButton.resource1Description",
      desc: content.resource1Description,
      href: content.resource1Href,
    },
    {
      icon: ICONS[1],
      titleId: "global.crisisButton.resource2Title",
      title: content.resource2Title,
      descId: "global.crisisButton.resource2Description",
      desc: content.resource2Description,
      href: content.resource2Href,
    },
    {
      icon: ICONS[2],
      titleId: "global.crisisButton.resource3Title",
      title: content.resource3Title,
      descId: "global.crisisButton.resource3Description",
      desc: content.resource3Description,
      href: content.resource3Href,
    },
    {
      icon: ICONS[3],
      titleId: "global.crisisButton.resource4Title",
      title: content.resource4Title,
      descId: "global.crisisButton.resource4Description",
      desc: content.resource4Description,
      href: content.resource4Href,
    },
  ];

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
        <p className="text-muted-fg mt-1.5 mb-4">
          <EditableText contentId="global.crisisButton.modalSubtitle" label="Modal subtitle" value={content.modalSubtitle} as="span" />
        </p>
        <div className="flex flex-col gap-2.5">
          {resources.map((r) => (
            <a
              key={r.titleId}
              href={r.href}
              target={r.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="flex items-center gap-3.5 rounded-2xl border border-border p-3.5 hover:border-primary transition-colors"
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] bg-accent-soft text-primary">
                <r.icon size={18} />
              </span>
              <span>
                <strong className="block">
                  <EditableText contentId={r.titleId} label="Resource title" value={r.title} as="span" />
                </strong>
                <span className="text-sm text-muted-fg">
                  <EditableText contentId={r.descId} label="Resource description" value={r.desc} as="span" />
                </span>
              </span>
            </a>
          ))}
        </div>
        <div className="mt-3 rounded-xl bg-accent-soft px-3.5 py-3 text-sm text-primary-600">
          <EditableText contentId="global.crisisButton.disclaimer" label="Disclaimer" value={content.disclaimer} as="span" />
        </div>
      </Modal>
    </>
  );
}
