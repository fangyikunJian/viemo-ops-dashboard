import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

export type MetricTone = "critical" | "warning" | "good" | "neutral";

const DOT: Record<MetricTone, string> = {
  critical: "bg-critical",
  warning: "bg-warning",
  good: "bg-good",
  neutral: "bg-ink-muted",
};

/**
 * One number in a strip.
 *
 * Replaced four equally sized cards. Four cards of identical weight tell the
 * reader that four things matter equally, which is never true — so the page
 * had no entry point. Here the strip is deliberately quiet: the headline above
 * it carries the answer, and these are the supporting figures.
 */
export function Metric({
  label,
  value,
  tone = "neutral",
  note,
  href,
}: {
  label: string;
  value: number | string;
  tone?: MetricTone;
  note?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="eyebrow flex items-center gap-1.5">
        {tone !== "neutral" ? (
          <span
            className={cn("size-1.5 shrink-0 rounded-full", DOT[tone])}
            aria-hidden="true"
          />
        ) : null}
        {label}
      </p>
      <p
        className={cn(
          "tabular mt-1.5 text-figure",
          tone === "critical" ? "text-critical" : "text-ink",
        )}
      >
        {value}
      </p>
      {note ? (
        <p className="mt-0.5 text-xs text-ink-muted">{note}</p>
      ) : null}
    </>
  );

  if (!href) return <div className="px-5 py-4 first:pl-0">{body}</div>;

  return (
    <Link
      href={href}
      className="group relative px-5 py-4 transition-colors first:pl-0 hover:bg-sunken/60"
    >
      {body}
      <ArrowUpRight
        className="absolute top-4 right-4 size-3.5 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />
    </Link>
  );
}

/** Lays metrics out in a row with hairline dividers between them. */
export function MetricStrip({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-line rounded-xl border border-hairline bg-surface sm:grid-cols-4">
      {children}
    </div>
  );
}
