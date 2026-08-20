// Kept free of Node imports so client components can show the rules without
// dragging node:crypto into the browser bundle. See password.ts.

export const PASSWORD_MIN_LENGTH = 8;

/** The problem with a password, or null if it is acceptable. */
export function validatePassword(plain: string): string | null {
  if (plain.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  return null;
}
