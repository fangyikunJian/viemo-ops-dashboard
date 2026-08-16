import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Handshake, FolderKanban, Gauge } from "lucide-react";
import { LoginForm } from "./login-form";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

/**
 * The seeded accounts, shown on the sign-in screen.
 *
 * This is a demonstration system on synthetic data, and the three roles only
 * mean anything if whoever is looking at it can sign in as each of them. It is
 * listed here deliberately, not left in by accident — the README names it as
 * the first thing to remove if the application is ever pointed at real data.
 */
const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin", password: "admin", hint: "Full access" },
  {
    role: "Member",
    email: "member@viemostudio.example",
    password: "viemo-member-2026",
    hint: "Create and edit, no deletion",
  },
  {
    role: "Viewer",
    email: "viewer@viemostudio.example",
    password: "viemo-viewer-2026",
    hint: "Read only",
  },
] as const;

const PITCH = [
  {
    icon: Handshake,
    title: "Business relationships",
    body: "Advisors, investors, partners, institutions, suppliers and customers — each maintained to its own agreed rhythm.",
  },
  {
    icon: FolderKanban,
    title: "Project work",
    body: "Projects, tasks, owners and deadlines, with progress and risk derived from the work rather than typed in.",
  },
  {
    icon: Gauge,
    title: "One operational picture",
    body: "Relationship health beside project status, so the question “what needs us today?” has one answer.",
  },
] as const;

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/dashboard");

  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_minmax(26rem,32rem)]">
      {/* ── Left: what this is. Hidden on small screens. ───────── */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-sunken px-12 py-14 lg:flex">
        {/* A soft accent wash, so the panel is not a flat grey rectangle. */}
        <div
          className="pointer-events-none absolute -top-32 -left-24 size-[34rem] rounded-full opacity-[0.07] blur-3xl"
          style={{ background: "var(--accent)" }}
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-2.5">
          <span
            className="relative grid size-8 place-items-center overflow-hidden rounded-lg bg-accent"
            aria-hidden="true"
          >
            <span className="absolute inset-0 bg-ink/15 [clip-path:polygon(0_100%,100%_0,100%_100%)]" />
            <span className="relative text-xs font-bold text-accent-ink">V</span>
          </span>
          <span className="text-sm font-semibold text-ink">
            Viemo Studio Operations
          </span>
        </div>

        <div className="relative max-w-lg">
          <p className="eyebrow">Business Relationship &amp; Project Management</p>
          <h1 className="mt-3 text-[2.125rem] leading-[1.15] font-semibold tracking-[-0.03em] text-ink">
            A venture studio runs on its relationships as much as its work.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-secondary">
            A CRM organises around a deal moving toward a close. Half the
            relationships that decide whether a studio succeeds are never going
            to buy anything — and a CRM has nowhere to put them.
          </p>

          <ul className="mt-9 space-y-5">
            {PITCH.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3.5">
                <span
                  className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-hairline bg-surface"
                  aria-hidden="true"
                >
                  <Icon className="size-3.5 text-accent" />
                </span>
                <div>
                  <p className="text-[0.8125rem] font-medium text-ink">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-secondary">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-ink-muted">
          University of Adelaide ICT Capstone · Project UG-S2-28 · Synthetic data
          only
        </p>
      </section>

      {/* ── Right: the form. ───────────────────────────────────── */}
      <section className="flex items-center justify-center bg-plane px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-7 flex items-center gap-2.5 lg:hidden">
            <span
              className="relative grid size-8 place-items-center overflow-hidden rounded-lg bg-accent"
              aria-hidden="true"
            >
              <span className="absolute inset-0 bg-ink/15 [clip-path:polygon(0_100%,100%_0,100%_100%)]" />
              <span className="relative text-xs font-bold text-accent-ink">V</span>
            </span>
            <span className="text-sm font-semibold text-ink">
              Viemo Studio Operations
            </span>
          </div>

          <h2 className="text-title font-semibold text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Use <code className="rounded bg-sunken px-1.5 py-0.5 text-xs font-medium text-ink">admin</code>
            {" / "}
            <code className="rounded bg-sunken px-1.5 py-0.5 text-xs font-medium text-ink">admin</code>
            {" "}to look around.
          </p>

          <div className="mt-6">
            <LoginForm />
          </div>

          <div className="mt-8 border-t border-line pt-5">
            <p className="eyebrow">Demonstration accounts</p>
            <ul className="mt-3 space-y-2.5">
              {DEMO_ACCOUNTS.map((account) => (
                <li
                  key={account.email}
                  className="flex items-baseline justify-between gap-3 text-xs"
                >
                  <span className="min-w-0">
                    <span className="font-medium text-ink">{account.role}</span>
                    <span className="text-ink-muted"> · {account.hint}</span>
                  </span>
                  <code className="shrink-0 truncate text-[0.6875rem] text-ink-secondary">
                    {account.email} / {account.password}
                  </code>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[0.6875rem] leading-relaxed text-ink-muted">
              Every record in this system is invented. It holds no real
              relationship, contact or project data and connects to no live
              system.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
