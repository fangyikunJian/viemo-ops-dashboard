import { Sidebar } from "@/components/shell/sidebar";
import { requireUser } from "@/lib/auth/session";

/**
 * The dashboard shell. Everything inside this segment is behind authentication:
 * one `requireUser` here covers every page in the group, so no page can forget
 * to check. Permission checks beyond "signed in" happen per page and, for
 * writes, again inside the server action.
 */
export default async function AppLayout({
  children,
}: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-plane">
      {/* First thing in the tab order, so the navigation rail can be skipped. */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar user={{ name: user.name, email: user.email, role: user.role }} />
      <div className="lg:pl-60">
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
