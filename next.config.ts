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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
