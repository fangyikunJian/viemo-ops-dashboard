"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  Handshake,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { logoutAction } from "@/lib/auth/actions";

export type NavCounts = {
  /** Relationships past their agreed cadence. */
  overdue: number;
  /** Projects overdue or blocked. */
  atRisk: number;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Count shown on the right, and whether it is a problem or just a total. */
  badge?: { value: number; urgent?: boolean };
};

export function Sidebar({
  user,
  counts,
}: {
  user: { name: string; email: string; role: string };
  counts: NavCounts;
}) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/relationships",
      label: "Relationships",
      icon: Handshake,
      badge: counts.overdue > 0 ? { value: counts.overdue, urgent: true } : undefined,
    },
    {
      href: "/projects",
      label: "Projects",
      icon: FolderKanban,
      badge: counts.atRisk > 0 ? { value: counts.atRisk, urgent: true } : undefined,
    },
  ];

  const adminItems: NavItem[] =
    user.role === "ADMIN"
      ? [{ href: "/admin", label: "Administration", icon: ShieldCheck }]
      : [];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <>
      {/* Wide screens: a fixed rail on its own surface. */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[15rem] flex-col border-r border-hairline bg-sunken lg:flex">
        <div className="flex items-center gap-2.5 px-4 pt-5 pb-6">
          <Mark />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[0.8125rem] font-semibold text-ink">
              Viemo Studio
            </p>
            <p className="truncate text-[0.6875rem] text-ink-muted">
              Operations
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-6 px-3">
          <Group label="Workspace">
            {items.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </Group>

          {adminItems.length > 0 ? (
            <Group label="Manage">
              {adminItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                />
              ))}
            </Group>
          ) : null}
        </nav>

        <div className="border-t border-hairline p-3">
          <div className="flex items-center gap-2.5 px-1 py-1.5">
            <span
              className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-[0.6875rem] font-semibold text-accent"
              aria-hidden="true"
            >
              {initials}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[0.8125rem] font-medium text-ink">
                {user.name}
              </p>
              <p className="truncate text-[0.6875rem] text-ink-muted">
                {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
              </p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="mt-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[0.8125rem] text-ink-secondary transition-colors hover:bg-surface hover:text-ink"
            >
              <LogOut className="size-3.5 shrink-0" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Narrow screens: the same destinations as a top bar. */}
      <header className="sticky top-0 z-20 border-b border-hairline bg-sunken lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Mark small />
            <span className="text-[0.8125rem] font-semibold text-ink">
              Viemo Studio Operations
            </span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md p-1.5 text-ink-secondary hover:bg-surface hover:text-ink"
              aria-label="Sign out"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {[...items, ...adminItems].map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              compact
            />
          ))}
        </nav>
      </header>
    </>
  );
}

/**
 * The mark. A plain square with a letter in it reads as a placeholder, so this
 * is a rounded square with a diagonal split — enough to look chosen rather
 * than defaulted, and it survives being 20 pixels wide.
 */
function Mark({ small }: { small?: boolean }) {
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-[0.4rem] bg-accent",
        small ? "size-6" : "size-7",
      )}
      aria-hidden="true"
    >
      <span className="absolute inset-0 bg-ink/15 [clip-path:polygon(0_100%,100%_0,100%_100%)]" />
      <span
        className={cn(
          "relative font-bold text-accent-ink",
          small ? "text-[0.625rem]" : "text-[0.6875rem]",
        )}
      >
        V
      </span>
    </span>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="eyebrow px-2.5 pb-1.5">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavLink({
  item,
  active,
  compact,
}: {
  item: NavItem;
  active: boolean;
  compact?: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-2.5 rounded-md text-[0.8125rem] font-medium whitespace-nowrap transition-colors",
        compact ? "px-2.5 py-1.5 text-xs" : "px-2.5 py-[0.4375rem]",
        active
          ? "bg-surface text-ink shadow-[0_1px_2px_rgba(11,11,11,0.05)]"
          : "text-ink-secondary hover:bg-surface/60 hover:text-ink",
      )}
    >
      <Icon
        className={cn(
          "shrink-0 transition-colors",
          compact ? "size-3.5" : "size-4",
          active ? "text-accent" : "text-ink-muted group-hover:text-ink-secondary",
        )}
        aria-hidden="true"
      />
      <span className="flex-1">{item.label}</span>
      {item.badge ? (
        <span
          className={cn(
            "tabular rounded px-1.5 py-px text-[0.625rem] font-semibold",
            item.badge.urgent
              ? "bg-critical-soft text-critical"
              : "bg-surface text-ink-muted",
          )}
        >
          {item.badge.value}
        </span>
      ) : null}
    </Link>
  );
}
