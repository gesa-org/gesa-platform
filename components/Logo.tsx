import Image from "next/image";

// Real GESA "G" mark, supplied by Roy (Phase 11) — replaces the earlier
// two-circle placeholder used since Phase 7. The source file has a solid
// ivory background (not transparent), which blends closely with the site's
// own background tones, so it reads fine as a small inline mark without
// needing background removal.
export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <Image
      src="/images/brand/gesa-logo.jpg"
      alt="GESA"
      width={size}
      height={size}
      className="flex-none rounded-full object-cover"
      priority
    />
  );
}
