import { Sidebar } from "@/components/shell/sidebar";
import { requireUser } from "@/lib/auth/session";
import { getNavCounts } from "@/lib/dashboard/queries";

/**
 * The dashboard shell. Everything inside this segment is behind authentication:
 * one `requireUser` here covers every page in the group, so no page can forget
 * to check. Permission checks beyond "signed in" happen per page and, for
 * writes, again inside the server action.
 *
 * The navigation carries counts of what needs attention. A number in the rail
 * is the difference between a menu and a thing that tells you where to go —
 * it lets someone on the projects screen see that relationships need them
 * without navigating to find out.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const counts = await getNavCounts();

  return (
    <div className="min-h-screen bg-plane">
      {/* First thing in the tab order, so the navigation rail can be skipped. */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar
        user={{ name: user.name, email: user.email, role: user.role }}
        counts={counts}
      />
      <div className="lg:pl-[15rem]">
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-[76rem] px-5 py-7 sm:px-7 lg:px-9"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
