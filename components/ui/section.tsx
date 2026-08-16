import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * A titled group of rows.
 *
 * Deliberately lighter than the bordered card it replaced in most places. A
 * page made of identical rectangles reads as a template; a page made of
 * labelled groups separated by space reads as something someone laid out. The
 * border is kept only where the group holds a list that needs containing.
 */
export function Section({
  title,
  description,
  action,
  children,
  bordered = true,
  className,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
  bordered?: boolean;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <header className="mb-2.5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs text-ink-muted">{description}</p>
          ) : null}
        </div>
        {action ? (
          <Link
            href={action.href}
            className="group flex shrink-0 items-center gap-0.5 text-xs font-medium text-ink-secondary hover:text-accent"
          >
            {action.label}
            <ChevronRight
              className="size-3 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        ) : null}
      </header>

      <div
        className={cn(
          bordered &&
            "overflow-hidden rounded-xl border border-hairline bg-surface",
        )}
      >
        {children}
      </div>
    </section>
  );
}

/** A row inside a Section, with an optional urgency rail down its left edge. */
export function Row({
  href,
  rail,
  children,
  className,
}: {
  href?: string;
  /** CSS colour for the 3px left rail, or undefined for none. */
  rail?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const classes = cn(
    "rail block px-4 py-3 transition-colors",
    href && "hover:bg-sunken/70",
    className,
  );
  const style = rail ? ({ "--rail-colour": rail } as React.CSSProperties) : undefined;

  if (!href) {
    return (
      <div className={classes} style={style}>
        {children}
      </div>
    );
  }

  return (
    <Link href={href} className={classes} style={style}>
      {children}
    </Link>
  );
}

/** Divides rows with hairlines. */
export function Rows({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-line">{children}</div>;
}
