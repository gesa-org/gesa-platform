/** @type {import('next').NextConfig} */
const nextConfig = {
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
