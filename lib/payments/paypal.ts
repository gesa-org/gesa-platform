// Phase 196 — server-only PayPal Orders v2 integration for Professional
// Services checkout (Community page). No secret ever reaches the browser:
// this file is imported only by API routes (app/api/payments/paypal/*),
// never by a "use client" component. The browser only ever sees
// NEXT_PUBLIC_PAYPAL_CLIENT_ID (PayPal's own JS SDK script tag needs a
// client id, which is not a secret — same public/private split PayPal's own
// docs describe) to render the Smart Payment Buttons.
//
// Required env vars (see ENV_VARS.md):
//   PAYPAL_CLIENT_ID           — same value as NEXT_PUBLIC_PAYPAL_CLIENT_ID
//   PAYPAL_CLIENT_SECRET       — server-only, never logged or returned to the client
//   PAYPAL_ENV                — "sandbox" (default) or "live"
//   NEXT_PUBLIC_PAYPAL_CLIENT_ID — exposed to the browser for the SDK script

function apiBase(): string {
  return process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

export function isPayPalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PayPal is not configured (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET missing).");
  }
  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("Could not authenticate with PayPal.");
  const data = await res.json();
  return data.access_token as string;
}

export type PayPalOrder = {
  id: string;
  status: string;
  links?: { rel: string; href: string }[];
};

// Creates a PayPal order for one session payment. `referenceId` is our own
// diary_scheduling_events.id, round-tripped as PayPal's `custom_id` so the
// capture step can look up exactly which booking this payment belongs to
// without trusting anything else the client sends.
export async function createPayPalOrder(params: {
  amount: number;
  currency: string;
  referenceId: string;
  description: string;
}): Promise<PayPalOrder> {
  const token = await getAccessToken();
  const res = await fetch(`${apiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: params.referenceId,
          description: params.description,
          amount: {
            currency_code: params.currency,
            value: params.amount.toFixed(2),
          },
        },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Could not create PayPal order.");
  return data as PayPalOrder;
}

export type PayPalCaptureResult = {
  status: string; // "COMPLETED" on success
  captureId: string | null;
  referenceId: string | null;
};

export async function capturePayPalOrder(orderId: string): Promise<PayPalCaptureResult> {
  const token = await getAccessToken();
  const res = await fetch(`${apiBase()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return { status: data?.status || "FAILED", captureId: null, referenceId: null };
  }
  const purchaseUnit = data?.purchase_units?.[0];
  const capture = purchaseUnit?.payments?.captures?.[0];
  return {
    status: data?.status || capture?.status || "UNKNOWN",
    captureId: capture?.id ?? null,
    referenceId: purchaseUnit?.custom_id ?? null,
  };
}
