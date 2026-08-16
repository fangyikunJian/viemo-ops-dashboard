import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { getSessionUser } from "@/lib/auth/session";
import { USER_ROLE_TERMS } from "@/lib/domain/enums";

export const metadata: Metadata = { title: "Sign in" };

/**
 * The seeded accounts, shown on the sign-in screen.
 *
 * This is a demonstration system running entirely on synthetic data, and the
 * three roles only mean anything if whoever is looking at it can sign in as
 * each of them. It is listed here deliberately, not left in by accident — the
 * README notes it as the first thing to remove if the application is ever
 * pointed at real data.
 */
const DEMO_ACCOUNTS = [
  { role: "ADMIN", email: "admin@viemostudio.example", password: "viemo-admin-2026" },
  { role: "MEMBER", email: "member@viemostudio.example", password: "viemo-member-2026" },
  { role: "VIEWER", email: "viewer@viemostudio.example", password: "viemo-viewer-2026" },
] as const;

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-plane px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2.5">
            <span
              className="grid size-9 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-ink"
              aria-hidden="true"
            >
              V
            </span>
            <span className="text-sm font-semibold text-ink">
              Viemo Studio Operations
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Relationships and project work, in one operational picture.
          </p>
        </div>

        <div className="rounded-xl border border-hairline bg-surface p-6 shadow-[0_1px_2px_rgba(11,11,11,0.04)]">
          <LoginForm />
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-line px-4 py-3">
          <p className="text-xs font-medium text-ink-secondary">
            Demonstration accounts
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            Synthetic data only. Each role sees a different amount of the system.
          </p>
          <ul className="mt-3 space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email} className="text-xs">
                <span className="font-medium text-ink">
                  {USER_ROLE_TERMS[account.role].label}
                </span>
                <span className="text-ink-muted"> — </span>
                <span className="text-ink-secondary">{account.email}</span>
                <span className="text-ink-muted"> / {account.password}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
