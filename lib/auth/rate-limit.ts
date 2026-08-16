/**
 * Sign-in throttling.
 *
 * Without this, the sign-in form is an unlimited password oracle: nothing stops
 * a script trying a dictionary against a known address as fast as the server
 * will answer. scrypt makes each attempt expensive, which helps, but "expensive
 * per attempt" is not the same as "bounded number of attempts".
 *
 * The counter is in memory, so it is per process. That is honest for a
 * single-instance demonstration and it is the first thing to replace if this
 * ever runs behind more than one server — the interface below is deliberately
 * small so swapping the store for Redis touches only this file.
 *
 * Keyed by email rather than by IP: this is a small internal tool where several
 * people can share an office address, and locking the office out because one
 * person mistyped their password would be worse than the attack.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

type Attempt = { count: number; firstAttemptAt: number };

const attempts = new Map<string, Attempt>();

/** Drop entries whose window has closed, so the map cannot grow unbounded. */
function prune(now: number): void {
  for (const [key, attempt] of attempts) {
    if (now - attempt.firstAttemptAt > WINDOW_MS) attempts.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  /** Attempts left in the current window; zero once locked out. */
  remaining: number;
  /** Whole minutes until the window reopens. */
  retryAfterMinutes: number;
};

export function checkRateLimit(
  key: string,
  now: number = Date.now(),
): RateLimitResult {
  prune(now);

  const attempt = attempts.get(key.toLowerCase());
  if (!attempt) {
    return { allowed: true, remaining: MAX_ATTEMPTS, retryAfterMinutes: 0 };
  }

  const elapsed = now - attempt.firstAttemptAt;
  if (elapsed > WINDOW_MS) {
    attempts.delete(key.toLowerCase());
    return { allowed: true, remaining: MAX_ATTEMPTS, retryAfterMinutes: 0 };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - attempt.count);
  return {
    allowed: remaining > 0,
    remaining,
    retryAfterMinutes: Math.max(1, Math.ceil((WINDOW_MS - elapsed) / 60000)),
  };
}

/** Record a failed attempt. Successful sign-ins call `clearRateLimit` instead. */
export function recordFailure(key: string, now: number = Date.now()): void {
  const id = key.toLowerCase();
  const attempt = attempts.get(id);

  if (!attempt || now - attempt.firstAttemptAt > WINDOW_MS) {
    attempts.set(id, { count: 1, firstAttemptAt: now });
    return;
  }

  attempt.count += 1;
}

export function clearRateLimit(key: string): void {
  attempts.delete(key.toLowerCase());
}

/** Test seam — resets the store between cases. */
export function resetRateLimits(): void {
  attempts.clear();
}

export const RATE_LIMIT_MAX_ATTEMPTS = MAX_ATTEMPTS;
export const RATE_LIMIT_WINDOW_MS = WINDOW_MS;
