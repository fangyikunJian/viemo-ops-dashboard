import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Custom font sizes must be registered here as well as in globals.css.
// tailwind-merge files any `text-*` class it doesn't recognise under
// `text-color`, so cn("text-figure", "text-critical") silently drops the size —
// no error, the element just renders at whatever it inherited.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "figure", "title", "micro"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
