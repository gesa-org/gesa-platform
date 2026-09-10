// Phase 177 — the single, public-safe organization contact email, for
// anywhere the *website itself* (not a server-only notification route)
// needs to display or link to a contact address — the Contact page, the
// footer, transactional-email signatures, etc.
//
// Deliberately separate from `lib/email/resend.ts`'s `getContactInbox()`:
// that one is server-only and decides where *admin notifications* land
// (reads `GESA_CONTACT_INBOX`, never sent to the browser); this one is the
// address GESA shows *to visitors*, safe to import from a Client Component
// or render straight into HTML. `NEXT_PUBLIC_GESA_CONTACT_EMAIL` is
// optional — set it only if a different address should ever be shown
// publicly than the one notifications are sent to; both default to the
// same real, monitored inbox otherwise.
export const GESA_PUBLIC_CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_GESA_CONTACT_EMAIL || "gesa.org26@gmail.com";

export const GESA_PUBLIC_CONTACT_MAILTO = `mailto:${GESA_PUBLIC_CONTACT_EMAIL}`;
