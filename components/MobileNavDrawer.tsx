"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X, Heart } from "lucide-react";
import VolunteerPrimaryCta from "@/components/volunteer/VolunteerPrimaryCta";
import EditableText from "@/components/ui-builder/public/EditableText";
import type { HeaderContent } from "@/lib/content";
import { PRIMARY_NAVIGATION, resolveNavHref } from "@/lib/navigation";

// Phase 199 (mobile responsiveness pass) — Header.tsx's <nav> has always
// been `hidden md:flex`, with zero mobile fallback: below `md`, a phone
// visitor got the logo, bell, language selector, and account button, but no
// way to reach About/Find Support/Our Professionals/Community, and no
// Donate CTA either (`hidden sm:inline-flex`). lib/navigation.ts's
// `showOnMobile` flag was already wired for exactly this component, just
// never built. This is that component: a right-side off-canvas drawer,
// opened from a hamburger button rendered only below `md` (Header.tsx's own
// `<nav>`/Donate CTA stay exactly as they were for `md`+ widths — this is
// additive, not a replacement of the desktop nav).
//
// Accessibility: traps Tab focus inside the panel while open, closes on
// Escape, restores focus to the trigger button on close, moves focus into
// the panel on open, locks body scroll so the page behind can't be
// scrolled by touch while the overlay is up, and exposes `role="dialog"`
// + `aria-modal` + `aria-label` for screen readers.
export default function MobileNavDrawer({ content }: { content: HeaderContent }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function focusableEls() {
      return panelRef.current
        ? Array.from(
            panelRef.current.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          )
        : [];
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = focusableEls();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    focusableEls()[0]?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open]);

  const navItems = PRIMARY_NAVIGATION.filter((item) => item.showOnMobile && item.key !== "donate");

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Open menu"
        className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[110]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            id={menuId}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="absolute inset-y-0 right-0 flex w-[86vw] max-w-[360px] flex-col overflow-y-auto bg-[#eef1f6] shadow-2xl focus:outline-none"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="text-[15px] font-semibold tracking-[0.2em] text-[#5c6470]">MENU</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
              >
                <X size={20} />
              </button>
            </div>

            <nav aria-label="Primary" className="flex flex-col gap-1 px-3 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={resolveNavHref(item, content)}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-[17px] font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  <EditableText
                    contentId={`global.header.${item.contentField}`}
                    label={`Nav: "${content[item.contentField]}"`}
                    value={content[item.contentField] as string}
                    as="span"
                  />
                </Link>
              ))}
            </nav>

            <div className="mt-auto border-t border-border px-5 py-5">
              <VolunteerPrimaryCta
                href={content.donateHref}
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-[16px] font-semibold text-primary-fg shadow-soft transition-all hover:bg-primary-600"
              >
                <Heart size={17} />
                <EditableText
                  contentId="global.header.donateLabel"
                  label="Donate button label"
                  value={content.donateLabel}
                  as="span"
                />
              </VolunteerPrimaryCta>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
