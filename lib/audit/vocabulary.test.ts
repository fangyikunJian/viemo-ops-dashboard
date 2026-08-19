import { describe, expect, it } from "vitest";
import {
  diffFields,
  listFields,
  AUDIT_ACTIONS,
  AUDIT_ACTION_LABELS,
  HIGH_IMPACT_ACTIONS,
  type AuditAction,
} from "./vocabulary";

describe("diffFields", () => {
  it("reports only the fields that actually changed", () => {
    const before = { name: "Lumen", status: "ACTIVE", cadenceDays: 30 };
    const after = { name: "Lumen", status: "DORMANT", cadenceDays: 30 };

    const { changed, metadata } = diffFields(before, after, [
      "name",
      "status",
      "cadenceDays",
    ]);

    expect(changed).toEqual(["status"]);
    expect(metadata.status).toEqual({ from: "ACTIVE", to: "DORMANT" });
    expect(metadata.name).toBeUndefined();
  });

  it("records both sides, so the entry can say what it changed from", () => {
    // "status: ACTIVE → DORMANT" is worth reading. "record was edited" is not.
    const { metadata } = diffFields(
      { cadenceDays: 30 },
      { cadenceDays: 90 },
      ["cadenceDays"],
    );

    expect(metadata.cadenceDays).toEqual({ from: "30", to: "90" });
  });

  it("shows an em dash for a value that was or became empty", () => {
    const { changed, metadata } = diffFields(
      { notes: null as string | null },
      { notes: "Prefers a call" as string | null },
      ["notes"],
    );

    expect(changed).toEqual(["notes"]);
    expect(metadata.notes).toEqual({ from: "—", to: "Prefers a call" });
  });

  it("treats null and undefined as the same absence, not as a change", () => {
    const { changed } = diffFields(
      { notes: null as string | null | undefined },
      { notes: undefined as string | null | undefined },
      ["notes"],
    );

    expect(changed).toEqual([]);
  });

  it("compares dates by value rather than by identity", () => {
    // Two Date objects for the same instant are different objects. Comparing
    // them with === would report a change on every single save.
    const same = diffFields(
      { dueDate: new Date("2026-09-01T00:00:00.000Z") },
      { dueDate: new Date("2026-09-01T00:00:00.000Z") },
      ["dueDate"],
    );
    expect(same.changed).toEqual([]);

    const moved = diffFields(
      { dueDate: new Date("2026-09-01T00:00:00.000Z") },
      { dueDate: new Date("2026-09-08T00:00:00.000Z") },
      ["dueDate"],
    );
    expect(moved.changed).toEqual(["dueDate"]);
  });

  it("ignores fields it was not asked about", () => {
    const { changed } = diffFields(
      { name: "Old", updatedAt: new Date("2026-01-01") },
      { name: "New", updatedAt: new Date("2026-02-01") },
      ["name"],
    );

    expect(changed).toEqual(["name"]);
  });

  it("returns nothing when nothing changed", () => {
    const record = { name: "Lumen", status: "ACTIVE" };
    const { changed, metadata } = diffFields(record, { ...record }, [
      "name",
      "status",
    ]);

    expect(changed).toEqual([]);
    expect(metadata).toEqual({});
  });
});

describe("listFields", () => {
  it("reads as a sentence", () => {
    expect(listFields(["status"])).toBe("status");
    expect(listFields(["status", "owner"])).toBe("status and owner");
    expect(listFields(["status", "cadence", "owner"])).toBe(
      "status, cadence and owner",
    );
  });

  it("says nothing rather than producing an empty phrase", () => {
    expect(listFields([])).toBe("nothing");
  });
});

describe("the action vocabulary", () => {
  it("gives every action a human label", () => {
    for (const action of AUDIT_ACTIONS) {
      expect(AUDIT_ACTION_LABELS[action], `${action} has no label`).toBeTruthy();
    }
  });

  it("only marks actions that actually exist as high impact", () => {
    for (const action of HIGH_IMPACT_ACTIONS) {
      expect(AUDIT_ACTIONS).toContain(action);
    }
  });

  it("treats deletion, role changes and failed sign-ins as high impact", () => {
    // The three an administrator would want to spot while scrolling: one
    // destroys data, one grants power, one may be someone guessing a password.
    const high = new Set<AuditAction>(HIGH_IMPACT_ACTIONS);
    expect(high.has("DELETE")).toBe(true);
    expect(high.has("ROLE_CHANGE")).toBe(true);
    expect(high.has("SIGN_IN_FAILED")).toBe(true);
    expect(high.has("CREATE")).toBe(false);
  });
});
