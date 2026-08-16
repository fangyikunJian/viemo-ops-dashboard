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
import { UserRoleBadge } from "@/components/domain/badges";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/relationships", label: "Relationships", icon: Handshake },
  { href: "/projects", label: "Projects", icon: FolderKanban },
];

const ADMIN_NAV: NavItem = {
  href: "/admin",
  label: "Administration",
  icon: ShieldCheck,
};

export function Sidebar({
  user,
}: {
  user: { name: string; email: string; role: string };
}) {
  const pathname = usePathname();
  const items = user.role === "ADMIN" ? [...NAV, ADMIN_NAV] : NAV;

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {/* Wide screens: a fixed rail. */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-hairline bg-surface lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-ink"
            aria-hidden="true"
          >
            V
          </span>
          <span className="text-sm font-semibold text-ink">
            Viemo Studio
            <span className="block text-xs font-normal text-ink-muted">
              Operations
            </span>
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {items.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </nav>

        <div className="border-t border-line px-3 py-3">
          <div className="px-2 py-1.5">
            <p className="truncate text-sm font-medium text-ink">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-ink-muted">
              {user.email}
            </p>
            <div className="mt-2">
              <UserRoleBadge role={user.role} />
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-secondary hover:bg-sunken hover:text-ink"
            >
              <LogOut className="size-4 shrink-0" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Narrow screens: a top bar with the same destinations. */}
      <header className="sticky top-0 z-20 border-b border-hairline bg-surface lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className="grid size-7 place-items-center rounded-lg bg-accent text-xs font-bold text-accent-ink"
              aria-hidden="true"
            >
              V
            </span>
            <span className="text-sm font-semibold text-ink">
              Viemo Studio Operations
            </span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg p-1.5 text-ink-secondary hover:bg-sunken hover:text-ink"
              aria-label="Sign out"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {items.map((item) => (
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
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium whitespace-nowrap",
        active
          ? "bg-accent-soft text-accent"
          : "text-ink-secondary hover:bg-sunken hover:text-ink",
        compact && "px-3 py-1.5 text-xs",
      )}
    >
      <Icon
        className={cn("shrink-0", compact ? "size-3.5" : "size-4")}
        aria-hidden="true"
      />
      {item.label}
    </Link>
  );
}
