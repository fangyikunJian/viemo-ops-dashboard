import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * A filter as a link, not a control.
 *
 * Filters are in the URL, so a filtered view can be linked to, bookmarked and
 * shared — which is what makes the dashboard's stat tiles able to point at
 * "the six overdue relationships" rather than just showing the number six.
 * Selecting the value already applied clears it, so each chip is a toggle.
 */
export function FilterChip({
  label,
  href,
  active,
  count,
}: {
  label: string;
  href: string;
  active?: boolean;
  count?: number;
}) {
  return (
    <Link
      href={href}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-hairline bg-surface text-ink-secondary hover:bg-sunken hover:text-ink",
      )}
    >
      {label}
      {count !== undefined ? (
        <span
          className={cn(
            "tabular rounded-full px-1.5 text-[10px]",
            active ? "bg-accent/15" : "bg-sunken text-ink-muted",
          )}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}
