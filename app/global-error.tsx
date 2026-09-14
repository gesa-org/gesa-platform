"use client";

import { useEffect } from "react";

// Phase 204 — Next.js's root-layout-level error boundary: this only
// renders if app/layout.tsx itself throws (e.g. one of its Promise.all
// data fetches rejects) — a case app/error.tsx *cannot* catch, since that
// file renders *inside* the layout that just failed. Because this replaces
// the entire document, Next's own docs require it to render its own
// <html>/<body> — there is no guarantee the root layout's own providers,
// design tokens, or even globals.css loaded successfully, so this
// deliberately does not import PageHero, Button, Tailwind classes, or
// anything else from the app's normal component tree. Plain inline styles
// only, so this page has the best chance of still rendering correctly in
// exactly the scenario where everything else already didn't.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled error in the root layout:", error.message, error.stack, error.digest);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", background: "#faf8f4", color: "#2c2620" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "24px",
          }}
        >
          <h1 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "10px" }}>Something went wrong.</h1>
          <p style={{ fontSize: "14.5px", color: "#5c5346", maxWidth: "420px", marginBottom: "22px" }}>
            The page couldn&apos;t load. Please try again, or head back to the homepage — if it keeps happening, let
            us know.
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={reset}
              style={{
                borderRadius: "999px",
                padding: "10px 22px",
                fontSize: "14px",
                fontWeight: 600,
                border: "none",
                background: "#8a6f3f",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                borderRadius: "999px",
                padding: "10px 22px",
                fontSize: "14px",
                fontWeight: 600,
                border: "1px solid #d8cfbf",
                color: "#2c2620",
                textDecoration: "none",
              }}
            >
              Back to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
