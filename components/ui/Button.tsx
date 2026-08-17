import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost" | "clay";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-fg hover:bg-primary-600 shadow-[0_10px_24px_-14px_rgba(74,64,44,.6)] hover:-translate-y-px",
  outline:
    "bg-white text-primary border border-border hover:border-primary-600 hover:bg-accent-soft hover:-translate-y-px",
  ghost: "bg-secondary text-foreground hover:bg-muted",
  clay: "bg-clay text-white hover:bg-[#a25835] hover:-translate-y-px",
};

const sizes: Record<Size, string> = {
  sm: "text-sm px-4 py-2",
  md: "text-[15px] px-6 py-3.5",
};

interface ButtonProps {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  block?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

export default function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className = "",
  block = false,
  onClick,
  type = "button",
  disabled = false,
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${block ? "w-full" : ""} ${
    disabled ? "opacity-50 pointer-events-none" : ""
  } ${className}`;
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
