/**
 * Password rules, with no Node dependencies.
 *
 * Split out from password.ts on purpose. Hashing needs `node:crypto`, which
 * cannot be bundled for the browser — importing it from a client component
 * fails at runtime rather than at build time, with an error that points at
 * `util.promisify` and not at the real cause. The rules, though, are wanted in
 * both places: the form shows them, the server enforces them. Keeping them in a
 * module with no imports means both sides can use the same numbers without
 * either dragging the other's dependencies along.
 */

export const PASSWORD_MIN_LENGTH = 8;

/** Returns the problem with a password, or null if it is acceptable. */
export function validatePassword(plain: string): string | null {
  if (plain.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  return null;
}
