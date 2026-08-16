/**
 * Password hashing.
 *
 * Uses scrypt from Node's standard library rather than a dependency: it is a
 * deliberately slow, memory-hard KDF designed for exactly this, it needs no
 * native build step on any of the machines the team develops on, and it means
 * one less package to justify in the architecture document.
 *
 * Stored format is `salt:derivedKey`, both hex. The salt is per-password, so
 * two accounts with the same password produce different hashes.
 */

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derived = await scryptAsync(plain, salt, KEY_LENGTH);
  return `${salt}:${derived.toString("hex")}`;
}

/**
 * Compare a candidate password against a stored hash.
 *
 * The comparison is constant-time: a plain `===` on the hex strings would
 * return faster the earlier it finds a mismatched byte, which leaks how much of
 * a guess was correct.
 */
export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<boolean> {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;

  const expected = Buffer.from(expectedHex, "hex");
  const derived = await scryptAsync(plain, salt, KEY_LENGTH);

  // timingSafeEqual throws on a length mismatch, so check it first.
  if (expected.length !== derived.length) return false;

  return timingSafeEqual(derived, expected);
}

/**
 * The rules live in password-rules.ts, which has no Node dependencies so a
 * client component can import them without pulling `node:crypto` into the
 * browser bundle. Re-exported here so server code has one place to import from.
 */
export { PASSWORD_MIN_LENGTH, validatePassword } from "./password-rules";
