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
};

export default nextConfig;
