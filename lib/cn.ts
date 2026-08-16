import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge, taught about this project's type scale.
 *
 * Without this, `cn("text-figure", "text-critical")` silently drops the size.
 * tailwind-merge resolves conflicts by class group, and every `text-*` class it
 * does not recognise falls into `text-color` — so a custom font size and a
 * colour look like the same property to it and the last one wins.
 *
 * The failure is quiet: no error, no warning, the element just renders at the
 * inherited size. Registering the custom sizes under `font-size` is what makes
 * the merge treat them as what they are. Add any new `--text-*` token here at
 * the same time you add it to globals.css.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "figure", "title", "micro"] }],
    },
  },
});

/** Join class names, letting later Tailwind utilities win over earlier ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
