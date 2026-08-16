"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * The last line of defence for an unhandled server or render error.
 *
 * It shows the reader something they can act on and says nothing about what
 * went wrong internally — a stack trace or a database message on this screen
 * would be an information disclosure. The digest is a Next.js identifier that
 * correlates with the server log, which is what a developer actually needs.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Replace with the team's error reporting service when there is one.
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-plane px-4">
      <div className="w-full max-w-md rounded-xl border border-hairline bg-surface p-6 text-center">
        <AlertTriangle
          className="mx-auto mb-3 size-6 text-critical"
          aria-hidden="true"
        />
        <h1 className="text-lg font-semibold text-ink">Something went wrong</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          The page could not be loaded. Trying again often works; if it does
          not, the error reference below will help whoever looks into it.
        </p>

        {error.digest ? (
          <p className="tabular mt-3 rounded-lg bg-sunken px-3 py-2 text-xs text-ink-muted">
            Reference: {error.digest}
          </p>
        ) : null}

        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-medium text-accent-ink hover:brightness-110"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    </main>
  );
}
