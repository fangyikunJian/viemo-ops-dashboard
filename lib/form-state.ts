import type { ZodError } from "zod";

/**
 * What every server action returns to its form.
 *
 * One shape across both modules, so a form component written for a relationship
 * works the same way for a project.
 */
export type ActionState = {
  ok?: boolean;
  /** Something went wrong that is not about one particular field. */
  error?: string | null;
  /** Field name → the first problem found with it. */
  fieldErrors?: Record<string, string>;
};

export const IDLE: ActionState = {};

/** Keep the first message per field; more than one at a time is noise. */
export function fieldErrorsFrom(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!(key in errors)) errors[key] = issue.message;
  }
  return errors;
}

/** Read a text field, treating blank as absent. */
export function optionalText(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

/** Read a required text field. */
export function text(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

/** Read a whole number, treating blank as absent and rubbish as absent. */
export function optionalInteger(
  value: FormDataEntryValue | null,
): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Split a comma-separated tag input into clean, de-duplicated labels. */
export function tagLabels(value: FormDataEntryValue | null): string[] {
  return [
    ...new Set(
      String(value ?? "")
        .split(",")
        .map((label) => label.trim().toLowerCase())
        .filter((label) => label.length > 0 && label.length <= 32),
    ),
  ];
}
