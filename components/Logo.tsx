// Wordmark mark: two overlapping circles (sage + clay) — two people meeting
// in support. Used alongside the "GESA" serif wordmark in the header/footer.
export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      className="flex-none"
    >
      <circle cx="15" cy="20" r="12" fill="#899a72" opacity="0.8" />
      <circle cx="25" cy="20" r="12" fill="#bd8a67" opacity="0.8" />
    </svg>
  );
}
