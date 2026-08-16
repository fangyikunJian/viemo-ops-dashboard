import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-ink hover:brightness-110 active:brightness-95 border border-transparent",
  secondary:
    "bg-surface text-ink border border-hairline hover:bg-sunken active:bg-sunken",
  ghost:
    "bg-transparent text-ink-secondary border border-transparent hover:bg-sunken hover:text-ink",
  danger:
    "bg-transparent text-critical border border-critical/30 hover:bg-critical/10",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-2.5 text-xs gap-1.5",
  md: "h-9 px-3.5 text-sm gap-2",
};

const BASE =
  "inline-flex items-center justify-center rounded-lg font-medium transition-[filter,background-color,color] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <button
      {...props}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
    />
  );
}

export function ButtonLink({
  href,
  variant = "secondary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
    >
      {children}
    </Link>
  );
}
