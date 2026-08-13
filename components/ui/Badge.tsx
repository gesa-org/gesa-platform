import type { ReactNode } from "react";

export default function Badge({
  children,
  tone = "sage",
}: {
  children: ReactNode;
  tone?: "sage" | "clay";
}) {
  const toneClasses =
    tone === "clay"
      ? "bg-clay-soft text-clay"
      : "bg-accent-soft text-primary-600";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide ${toneClasses}`}
    >
      {children}
    </span>
  );
}
