import { beforeEach, describe, expect, it } from "vitest";
import {
  checkRateLimit,
  clearRateLimit,
  recordFailure,
  resetRateLimits,
  RATE_LIMIT_MAX_ATTEMPTS,
  RATE_LIMIT_WINDOW_MS,
} from "./rate-limit";

const NOW = 1_760_000_000_000;

beforeEach(() => {
  resetRateLimits();
});

describe("checkRateLimit", () => {
  it("allows an address that has never failed", () => {
    const result = checkRateLimit("someone@example.org", NOW);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(RATE_LIMIT_MAX_ATTEMPTS);
  });

  it("counts failures down toward the limit", () => {
    recordFailure("someone@example.org", NOW);
    recordFailure("someone@example.org", NOW);
    expect(checkRateLimit("someone@example.org", NOW).remaining).toBe(
      RATE_LIMIT_MAX_ATTEMPTS - 2,
    );
  });

  it("blocks once the limit is reached", () => {
    for (let i = 0; i < RATE_LIMIT_MAX_ATTEMPTS; i++) {
      recordFailure("someone@example.org", NOW);
    }
    const result = checkRateLimit("someone@example.org", NOW);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMinutes).toBeGreaterThan(0);
  });

  it("reopens once the window has passed", () => {
    for (let i = 0; i < RATE_LIMIT_MAX_ATTEMPTS; i++) {
      recordFailure("someone@example.org", NOW);
    }
    expect(checkRateLimit("someone@example.org", NOW).allowed).toBe(false);

    const later = NOW + RATE_LIMIT_WINDOW_MS + 1000;
    expect(checkRateLimit("someone@example.org", later).allowed).toBe(true);
  });

  it("treats addresses independently, so one person cannot lock out another", () => {
    for (let i = 0; i < RATE_LIMIT_MAX_ATTEMPTS; i++) {
      recordFailure("victim@example.org", NOW);
    }
    expect(checkRateLimit("victim@example.org", NOW).allowed).toBe(false);
    expect(checkRateLimit("bystander@example.org", NOW).allowed).toBe(true);
  });

  it("is case-insensitive, so changing capitals does not reset the count", () => {
    for (let i = 0; i < RATE_LIMIT_MAX_ATTEMPTS; i++) {
      recordFailure("Someone@Example.org", NOW);
    }
    expect(checkRateLimit("someone@example.org", NOW).allowed).toBe(false);
    expect(checkRateLimit("SOMEONE@EXAMPLE.ORG", NOW).allowed).toBe(false);
  });
});

describe("clearRateLimit", () => {
  it("resets the count after a successful sign-in", () => {
    for (let i = 0; i < RATE_LIMIT_MAX_ATTEMPTS - 1; i++) {
      recordFailure("someone@example.org", NOW);
    }
    clearRateLimit("someone@example.org");
    expect(checkRateLimit("someone@example.org", NOW).remaining).toBe(
      RATE_LIMIT_MAX_ATTEMPTS,
    );
  });
});

describe("the window", () => {
  it("starts from the first failure, not the most recent", () => {
    // Otherwise a steady trickle of attempts would keep pushing the window
    // forward and the limit would never be reached.
    recordFailure("someone@example.org", NOW);
    recordFailure("someone@example.org", NOW + RATE_LIMIT_WINDOW_MS - 1000);

    const justPastWindow = NOW + RATE_LIMIT_WINDOW_MS + 1;
    expect(checkRateLimit("someone@example.org", justPastWindow).remaining).toBe(
      RATE_LIMIT_MAX_ATTEMPTS,
    );
  });
});
