import Link from "next/link";
import { cn } from "@/lib/cn";

export type BarItem = {
  label: string;
  value: number;
  href?: string;
};

/**
 * A horizontal bar for each category, sharing one scale.
 *
 * One hue, not one colour per bar: the reader's job here is comparing
 * magnitudes, and a categorical palette would imply the categories are the
 * subject and make six counts harder to compare, not easier. Every bar is
 * directly labelled, so no legend is needed and the figures stay readable when
 * a bar is too short to hold a label.
 */
export function BarList({
  items,
  emptyLabel = "Nothing to show yet.",
}: {
  items: readonly BarItem[];
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-muted">{emptyLabel}</p>;
  }

  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <ul className="space-y-2.5">
      {items.map((item) => {
        const width = (item.value / max) * 100;
        const row = (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm text-ink">{item.label}</span>
              <span className="tabular text-sm font-medium text-ink-secondary">
                {item.value}
              </span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-sunken">
              <div
                className="h-2 rounded-full bg-accent"
                style={{ width: `${Math.max(width, item.value > 0 ? 3 : 0)}%` }}
              />
            </div>
          </>
        );

        return (
          <li key={item.label}>
            {item.href ? (
              <Link
                href={item.href}
                className={cn(
                  "block rounded-md px-1 py-0.5 -mx-1 hover:bg-sunken",
                )}
              >
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A single ratio against its total — used for project completion. Same one-hue
 * treatment as the bar list, so a progress bar and a magnitude bar read as the
 * same kind of mark.
 */
export function ProgressBar({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className={cn("h-1.5 w-full rounded-full bg-sunken", className)}>
      <div
        className="h-1.5 rounded-full bg-accent"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
