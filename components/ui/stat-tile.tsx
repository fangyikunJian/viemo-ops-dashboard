import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * A headline number.
 *
 * The dashboard leads with four of these rather than a chart: each is a single
 * current value, and a one-bar bar chart would say the same thing with more ink.
 *
 * `status` draws from the reserved status palette. Two of those colours sit
 * below 3:1 contrast on the light surface, so the tile always renders an icon
 * and a written label alongside the colour — the meaning never rests on hue.
 */
export type StatStatus = "critical" | "warning" | "good" | "neutral";

const STATUS_ICON: Record<StatStatus, LucideIcon | null> = {
  critical: AlertTriangle,
  warning: Clock,
  good: CheckCircle2,
  neutral: null,
};

const STATUS_VALUE_CLASS: Record<StatStatus, string> = {
  critical: "text-critical",
  warning: "text-ink",
  good: "text-ink",
  neutral: "text-ink",
};

const STATUS_CHIP_CLASS: Record<StatStatus, string> = {
  critical: "bg-critical-soft text-critical",
  warning: "bg-warning-soft text-amber-800 dark:text-amber-300",
  good: "bg-good-soft text-good",
  neutral: "bg-sunken text-ink-secondary",
};

/** Short words shown beside the colour so it never carries meaning alone. */
const STATUS_WORD: Record<StatStatus, string> = {
  critical: "Needs attention",
  warning: "Watch",
  good: "Healthy",
  neutral: "",
};

export function StatTile({
  label,
  value,
  status = "neutral",
  hint,
  href,
}: {
  label: string;
  value: number | string;
  status?: StatStatus;
  hint?: string;
  href?: string;
}) {
  const Icon = STATUS_ICON[status];
  const word = STATUS_WORD[status];

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-secondary">{label}</p>
        {status !== "neutral" && Icon ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
              STATUS_CHIP_CLASS[status],
            )}
          >
            <Icon className="size-3" aria-hidden="true" />
            {word}
          </span>
        ) : null}
      </div>

      <p
        className={cn(
          "mt-3 text-5xl leading-none font-semibold",
          STATUS_VALUE_CLASS[status],
        )}
      >
        {value}
      </p>

      {hint ? (
        <p className="mt-2 text-xs text-ink-muted">{hint}</p>
      ) : null}

      {href ? (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent">
          View
          <ArrowRight className="size-3" aria-hidden="true" />
        </span>
      ) : null}
    </>
  );

  const shell =
    "block rounded-xl border border-hairline bg-surface px-5 py-4 shadow-[0_1px_2px_rgba(11,11,11,0.04)]";

  if (href) {
    return (
      <Link href={href} className={cn(shell, "hover:border-accent/40")}>
        {body}
      </Link>
    );
  }

  return <div className={shell}>{body}</div>;
}
