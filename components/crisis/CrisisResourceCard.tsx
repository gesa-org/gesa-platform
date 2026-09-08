import { Phone, MessageCircle, Globe2, ExternalLink, Siren, HeartHandshake } from "lucide-react";
import type { CrisisResource } from "@/lib/crisisResources";
import { toTelHref, toSmsHref } from "@/lib/crisisResources";

// Phase 169 — same card shell the original hardcoded CrisisButton resources
// used (rounded-2xl border, accent-soft icon tile, title + short
// instruction) so a country-specific card looks and feels identical to the
// four static ones it replaces. Each card resolves to exactly one primary
// action: tel: for a phone-first resource, sms: for a text line, or the
// official URL (opened in a new tab) for a chat/info service — never more
// than one link per card, so it stays a single tappable target like before.
const TYPE_ICON: Record<CrisisResource["serviceType"], typeof Phone> = {
  emergency: Siren,
  suicide_crisis: Phone,
  mental_health_helpline: Phone,
  text_line: MessageCircle,
  chat: Globe2,
  youth_support: HeartHandshake,
};

function primaryAction(r: CrisisResource): { href: string; instruction: string; external: boolean } {
  // Phone takes priority when both a phone and an SMS number exist on the
  // same record (matches how these services are actually promoted — e.g.
  // "call 988" is the headline action, even though 988 also accepts texts).
  if (r.phone) {
    return { href: toTelHref(r.phone), instruction: `Call ${r.phone}`, external: false };
  }
  if (r.smsNumber) {
    const instruction = r.smsKeyword ? `Text ${r.smsKeyword} to ${r.smsNumber}` : `Text ${r.smsNumber}`;
    return { href: toSmsHref(r.smsNumber, r.smsKeyword), instruction, external: false };
  }
  if (r.url) {
    return { href: r.url, instruction: "Chat online", external: true };
  }
  // Shouldn't happen for data in CRISIS_RESOURCES (every record has at least
  // one of phone/smsNumber/url) — a safe no-op link rather than a crash if
  // it ever does.
  return { href: "#", instruction: "See details", external: false };
}

export default function CrisisResourceCard({ resource }: { resource: CrisisResource }) {
  const Icon = TYPE_ICON[resource.serviceType];
  const { href, instruction, external } = primaryAction(resource);

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="flex items-start gap-3.5 rounded-2xl border border-border p-3.5 hover:border-primary transition-colors"
    >
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] bg-accent-soft text-primary">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="flex items-center gap-1.5">
          {resource.serviceName}
          {external && <ExternalLink size={13} className="flex-none text-muted-fg" aria-hidden="true" />}
        </strong>
        <span className="block text-sm text-muted-fg">{instruction}</span>
        <span className="mt-0.5 block text-[12px] text-muted-fg">{resource.availability}</span>
        {resource.note && <span className="mt-0.5 block text-[12px] italic text-muted-fg">{resource.note}</span>}
      </span>
    </a>
  );
}
