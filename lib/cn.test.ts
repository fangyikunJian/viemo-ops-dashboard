import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("lets a later utility win over an earlier one in the same group", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("keeps utilities from different groups", () => {
    expect(cn("px-2", "py-4")).toBe("px-2 py-4");
  });

  it("drops falsy values", () => {
    expect(cn("px-2", false, undefined, null, "py-4")).toBe("px-2 py-4");
  });

  describe("the project's custom type scale", () => {
    // Regression test. tailwind-merge treats any unrecognised `text-*` class as
    // a colour, so before the scale was registered `cn("text-figure",
    // "text-critical")` silently dropped the size and the element rendered at
    // whatever it inherited. No error, no warning — the kind of bug you only
    // find by measuring the rendered page.
    it("keeps a custom font size alongside a text colour", () => {
      const result = cn("text-figure", "text-critical");
      expect(result).toContain("text-figure");
      expect(result).toContain("text-critical");
    });

    it("does the same for every step in the scale", () => {
      for (const size of ["display", "figure", "title", "micro"]) {
        const result = cn(`text-${size}`, "text-ink");
        expect(result, `text-${size} was dropped`).toContain(`text-${size}`);
        expect(result).toContain("text-ink");
      }
    });

    it("still resolves two custom sizes against each other", () => {
      expect(cn("text-display", "text-figure")).toBe("text-figure");
    });

    it("still resolves a custom size against a built-in one", () => {
      expect(cn("text-figure", "text-sm")).toBe("text-sm");
      expect(cn("text-sm", "text-figure")).toBe("text-figure");
    });

    it("still resolves two text colours against each other", () => {
      expect(cn("text-ink", "text-critical")).toBe("text-critical");
    });
  });
});
