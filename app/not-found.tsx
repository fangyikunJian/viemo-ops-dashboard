import Link from "next/link";
import { Compass } from "lucide-react";

/**
 * Shown for an unknown URL, and by `notFound()` when a record does not exist.
 *
 * A relationship that has been deleted and a relationship that never existed
 * land here identically, which is deliberate: distinguishing them would tell
 * someone with a guessed identifier that the record is real.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-plane px-4">
      <div className="w-full max-w-md rounded-xl border border-hairline bg-surface p-6 text-center">
        <Compass className="mx-auto mb-3 size-6 text-ink-muted" aria-hidden="true" />
        <h1 className="text-lg font-semibold text-ink">Not found</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          That page does not exist, or the record it pointed at has been
          removed.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex h-9 items-center rounded-lg bg-accent px-3.5 text-sm font-medium text-accent-ink hover:brightness-110"
        >
          Back to the dashboard
        </Link>
      </div>
    </main>
  );
}
