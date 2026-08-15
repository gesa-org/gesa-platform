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
    ],
  },
};

export default nextConfig;
