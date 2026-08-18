import Image from "next/image";

// Real GESA "G" mark, supplied by Roy (Phase 11, refreshed Phase 14 with a
// transparent-background PNG version — "GESA LOGO 1.0"). This one has real
// alpha transparency, so it drops cleanly onto any background instead of
// carrying the old ivory backing.
export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <Image
      src="/images/brand/gesa-logo.png"
      alt="GESA"
      width={size}
      height={size}
      className="flex-none object-contain"
      priority
    />
  );
}
