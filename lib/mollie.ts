import createMollieClient from "@mollie/api-client";

// Phase 99 — server-only Mollie client, used by app/api/donations/
// create-payment/route.ts and app/api/webhooks/mollie/route.ts. NEVER import
// this from a Client Component — the API key must stay on the server (the
// @mollie/api-client package itself throws if it detects a browser-like
// environment, as defense in depth against exactly that mistake).
//
// MOLLIE_API_KEY isn't set in every environment yet (Roy needs to sign up at
// mollie.com and add the key to Vercel's env vars — see EXECUTION_PLAN.md
// Phase 99). Callers should check `mollieConfigured` first and return a
// clear error rather than letting `createMollieClient` throw on an
// undefined key, so the donate page fails with a real, explainable message
// instead of a raw 500 until the key is configured.
export const mollieConfigured = !!process.env.MOLLIE_API_KEY;

export function getMollieClient() {
  if (!process.env.MOLLIE_API_KEY) {
    throw new Error("MOLLIE_API_KEY is not set — add it in Vercel's environment variables.");
  }
  return createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });
}
