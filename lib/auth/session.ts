/**
 * Sessions: who is signed in, and what the rest of the application is allowed
 * to assume about them.
 *
 * Server-side only. Everything that needs the current user goes through
 * `getSessionUser` or `requireUser` so there is exactly one place where a
 * request turns into an identity.
 */

import { randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { addDays } from "date-fns";

import { prisma } from "@/lib/db";
import { verifyPassword } from "./password";
import { checkRateLimit, clearRateLimit, recordFailure } from "./rate-limit";
import {
  can,
  type PermissionAction,
  type PermissionResource,
} from "./permissions";
import type { UserRole } from "@/lib/domain/enums";

const SESSION_COOKIE = "viemo_session";
const SESSION_TTL_DAYS = 7;

/**
 * Whether the session cookie is marked `Secure`.
 *
 * It should be, and in production it is by default. The override exists for one
 * real situation: a demonstration deployment reachable only by IP address.
 * Certificate authorities will not issue for a bare IP, so such a host can only
 * speak HTTP — and a `Secure` cookie is never returned over HTTP, so sign-in
 * appears to succeed and then bounces straight back to the sign-in screen with
 * no error anywhere to explain it.
 *
 * Set COOKIE_SECURE=false only on a host without TLS. Anywhere with a domain
 * and a certificate should leave it alone.
 */
const COOKIE_SECURE =
  process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === "true"
    : process.env.NODE_ENV === "production";

/** The shape the rest of the application sees. Never carries the password hash. */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** The domain person this account acts as, if it has been linked to one. */
  teamMemberId: string | null;
  teamMemberName: string | null;
};

/**
 * Session identifiers are 256 bits of randomness rather than the schema's
 * default cuid. A cuid encodes a timestamp and a counter, which makes it fine
 * as a record identifier and unsuitable as a bearer token.
 */
function newSessionId(): string {
  return randomBytes(32).toString("hex");
}

export type SignInResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string };

/**
 * Verify credentials and start a session.
 *
 * A wrong email and a wrong password return the same message on purpose: a
 * different one for each would let anyone test which addresses have accounts.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<SignInResult> {
  const generalFailure = { ok: false, error: "Email or password is incorrect." } as const;
  const address = email.trim().toLowerCase();

  // Bound the number of guesses before anything expensive happens.
  const limit = checkRateLimit(address);
  if (!limit.allowed) {
    return {
      ok: false,
      error: `Too many sign-in attempts. Try again in ${limit.retryAfterMinutes} minutes.`,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: address },
    include: { teamMember: true },
  });

  if (!user || !user.isActive) {
    recordFailure(address);
    return generalFailure;
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    recordFailure(address);
    return generalFailure;
  }

  clearRateLimit(address);

  const sessionId = newSessionId();
  const expiresAt = addDays(new Date(), SESSION_TTL_DAYS);
  await prisma.session.create({
    data: { id: sessionId, userId: user.id, expiresAt },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: COOKIE_SECURE,
    expires: expiresAt,
    path: "/",
  });

  return {
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      teamMemberId: user.teamMemberId,
      teamMemberName: user.teamMember?.name ?? null,
    },
  };
}

/** End the current session and clear its cookie. */
export async function signOut(): Promise<void> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;

  if (id) {
    await prisma.session.deleteMany({ where: { id } });
  }

  jar.delete(SESSION_COOKIE);
}

/**
 * The signed-in user, or null. Wrapped in React's `cache` so that a page which
 * checks permissions in several components still costs one query per request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;

  const session = await prisma.session.findUnique({
    where: { id },
    include: { user: { include: { teamMember: true } } },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) return null;
  if (!session.user.isActive) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role as UserRole,
    teamMemberId: session.user.teamMemberId,
    teamMemberName: session.user.teamMember?.name ?? null,
  };
});

/** The signed-in user, or a redirect to the login screen. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Guard a page. Redirects an unauthenticated visitor to login, and a signed-in
 * user who lacks the permission to the dashboard, where they can see something
 * useful rather than an error.
 */
export async function requirePermission(
  action: PermissionAction,
  resource: PermissionResource,
): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, action, resource)) redirect("/dashboard");
  return user;
}

/** Remove expired sessions. Called opportunistically on sign-in pages. */
export async function pruneExpiredSessions(): Promise<void> {
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
