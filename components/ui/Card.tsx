import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
}

export default function Card({ children, padded = true, className = "", ...rest }: CardProps) {
  return (
    <div
      className={`bg-card border border-border rounded-[var(--radius)] shadow-soft transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-accent ${
        padded ? "p-7" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
