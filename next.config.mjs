/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Phase 134 — sanitize-html (used server-side by lib/ui-builder/
    // sanitizeRichText.ts, imported from app/page.tsx and the page-content
    // API routes) depends on htmlparser2, which ships as an ESM-only
    // package. Webpack's default handling of that inside Next's server
    // bundle fails with "ESM packages (htmlparser2) need to be imported.
    // Use 'import' to reference the package instead." Marking sanitize-html
    // external here tells Next to leave it out of the webpack bundle and
    // `require()` it natively from node_modules at runtime instead, where
    // Node's own CJS/ESM interop handles it correctly.
    serverComponentsExternalPackages: ["sanitize-html"],
  },
  images: {
    // Real therapist photos are hosted at planetherapyglobal.org (migrated
    // from the org's earlier site) unless copied locally into
    // public/images/therapists/. next/image refuses any external hostname
    // that isn't explicitly allowed here — without this, every photo_url
    // pointing at that domain fails to render at all.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "planetherapyglobal.org",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Phase 10: therapist photo uploads land in Supabase Storage, whose
        // public URLs are hosted at <project-ref>.supabase.co — wildcarded
        // so this covers both the Dev and Production projects.
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  // Phase 145 previously redirected `/about` to `/find-your-therapist`
  // (folding the old About Us page into Find Support). Phase 215 reverses
  // that: `/about` is a real page again — it now renders what used to live
  // at `/find-your-therapist` (see app/about/page.tsx), and
  // `/find-your-therapist` itself is an intentionally empty page instead of
  // a redirect, per Roy's explicit request that the route stay active
  // rather than forwarding anywhere. No redirect is needed for `/about`
  // anymore since it's a real destination again; none is added for
  // `/find-your-therapist` either, since that route staying live (just
  // empty) is the whole point.
};

export default nextConfig;
