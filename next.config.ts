import type { NextConfig } from "next";

/**
 * Response headers applied to every route.
 *
 * These are the cheap, high-value browser-side protections. They do not
 * substitute for the server-side authorisation check inside each action, which
 * is the boundary that actually holds — they reduce the damage a
 * cross-site-scripting or clickjacking attempt could do if one ever got in.
 *
 * The Content-Security-Policy is deliberately not set here. Next.js injects
 * inline scripts for hydration, so a useful CSP needs per-request nonces
 * through middleware, and a CSP with 'unsafe-inline' would be decoration
 * rather than protection. Left as a documented gap rather than a false comfort
 * — see docs/compliance-and-standards.md.
 */
const securityHeaders = [
  // Do not let the browser second-guess a declared content type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Refuse to be framed — clickjacking.
  { key: "X-Frame-Options", value: "DENY" },
  // Send the origin, not the full path, to other sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // This application needs none of these.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Isolate the browsing context from cross-origin windows.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  /**
   * Keep the Postgres driver out of the bundler.
   *
   * `pg` opens real sockets and keeps a connection pool. Bundling it gives the
   * dev server more than one copy of the module, so the pool a request reaches
   * is not the pool that owns its connection, and queries fail with
   * `P1017 ConnectionClosed` while the database itself is perfectly healthy —
   * which sends you looking at the database instead of the bundler.
   *
   * Next externalises `@prisma/client` on its own; the driver adapter and `pg`
   * have to be named.
   */
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],

  /**
   * Note on deployment: `output: "standalone"` was tried and reverted.
   *
   * The demonstration host has 1.6 GB of memory, and `next build` there
   * thrashes swap hard enough to starve sshd — the machine stops answering its
   * own SSH banner while the build grinds. So the build happens on a
   * developer's machine and only the output ships.
   *
   * Standalone looked like the right way to do that until the bundle was
   * inspected: it traces and copies the *host's* native modules, so a Windows
   * build ships `better_sqlite3.node` and `sharp-win32-x64` — neither of which
   * a Linux server can load. Shipping the plain `.next` output instead lets
   * the server resolve those from its own `node_modules`, which are correct
   * for its platform. Fewer moving parts, and no binary that only fails at
   * runtime.
   */
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
