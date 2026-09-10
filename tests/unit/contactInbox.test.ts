import {
  FALLBACK_CONTACT_INBOX,
  getContactInbox,
  getReplyTo,
  isValidEmailFormat,
} from "@/lib/email/resend";

// Phase 177 — regression coverage for the email-delivery-configuration fix:
// GESA_CONTACT_INBOX no longer falls back to the old, unmonitored
// "hello@gesa.org" placeholder, and the fallback/validation logic that
// every notification route now shares (instead of each defining its own
// `process.env.GESA_CONTACT_INBOX || "hello@gesa.org"` constant) lives here.
describe("isValidEmailFormat", () => {
  it("accepts a plain, valid email", () => {
    expect(isValidEmailFormat("gesa.org26@gmail.com")).toBe(true);
  });

  it("rejects missing, empty, or malformed values", () => {
    expect(isValidEmailFormat(undefined)).toBe(false);
    expect(isValidEmailFormat(null)).toBe(false);
    expect(isValidEmailFormat("")).toBe(false);
    expect(isValidEmailFormat("not-an-email")).toBe(false);
    expect(isValidEmailFormat("missing-domain@")).toBe(false);
    expect(isValidEmailFormat("@missing-local.com")).toBe(false);
  });

  it("rejects values containing a newline (header-injection attempt)", () => {
    expect(isValidEmailFormat("attacker@example.com\nBcc: victim@example.com")).toBe(false);
    expect(isValidEmailFormat("attacker@example.com\r\nSubject: hijacked")).toBe(false);
  });
});

describe("getContactInbox", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns the configured inbox when it's a valid email", () => {
    process.env.GESA_CONTACT_INBOX = "gesa.org26@gmail.com";
    expect(getContactInbox()).toBe("gesa.org26@gmail.com");
  });

  it("falls back to the real monitored fallback (never hello@gesa.org) when unset", () => {
    delete process.env.GESA_CONTACT_INBOX;
    expect(getContactInbox()).toBe(FALLBACK_CONTACT_INBOX);
    expect(getContactInbox()).not.toBe("hello@gesa.org");
  });

  it("falls back the same way when the value is set but malformed", () => {
    process.env.GESA_CONTACT_INBOX = "not-an-email";
    expect(getContactInbox()).toBe(FALLBACK_CONTACT_INBOX);
  });
});

describe("getReplyTo", () => {
  it("uses the visitor's own email when it's valid", () => {
    expect(getReplyTo("visitor@example.com")).toBe("visitor@example.com");
  });

  it("falls back to the contact inbox when the visitor email is missing or invalid", () => {
    expect(getReplyTo(null)).toBe(getContactInbox());
    expect(getReplyTo(undefined)).toBe(getContactInbox());
    expect(getReplyTo("not-an-email")).toBe(getContactInbox());
  });
});
