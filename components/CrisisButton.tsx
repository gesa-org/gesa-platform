"use client";

import { useState } from "react";
import { LifeBuoy, Phone, MessageCircle, Globe2, ExternalLink } from "lucide-react";
import Modal from "@/components/ui/Modal";

const RESOURCES = [
  {
    icon: Phone,
    title: "988 Suicide & Crisis Lifeline",
    desc: "24/7 free & confidential",
    href: "tel:988",
  },
  {
    icon: MessageCircle,
    title: "Crisis Text Line",
    desc: "Text HOME to 741741",
    href: "sms:741741",
  },
  {
    icon: Globe2,
    title: "988 Lifeline Chat",
    desc: "Chat online now",
    href: "https://988lifeline.org/chat/",
  },
  {
    icon: ExternalLink,
    title: "Find a helpline worldwide",
    desc: "International directory",
    href: "https://findahelpline.com/",
  },
];

export default function CrisisButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-full border border-border bg-card px-[17px] py-3 font-semibold text-primary shadow-lg transition-colors hover:bg-secondary"
      >
        <LifeBuoy size={18} className="text-clay" />
        In crisis? Get help
      </button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <h3 className="text-lg font-semibold m-0">You are not alone</h3>
        <p className="text-muted-fg mt-1.5 mb-4">
          If you are struggling right now, help is available. Reach out to one of these resources.
        </p>
        <div className="flex flex-col gap-2.5">
          {RESOURCES.map((r) => (
            <a
              key={r.title}
              href={r.href}
              target={r.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="flex items-center gap-3.5 rounded-2xl border border-border p-3.5 hover:border-primary transition-colors"
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] bg-accent-soft text-primary">
                <r.icon size={18} />
              </span>
              <span>
                <strong className="block">{r.title}</strong>
                <span className="text-sm text-muted-fg">{r.desc}</span>
              </span>
            </a>
          ))}
        </div>
        <div className="mt-3 rounded-xl bg-accent-soft px-3.5 py-3 text-sm text-primary-600">
          GESA is not an emergency service. If you are in immediate danger, call your local emergency number.
        </div>
      </Modal>
    </>
  );
}
