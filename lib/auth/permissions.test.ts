import { describe, expect, it } from "vitest";
import {
  can,
  requirePermission,
  PermissionError,
  describePermissions,
} from "./permissions";

describe("can", () => {
  describe("VIEWER", () => {
    it("can read every module", () => {
      expect(can("VIEWER", "view", "relationship")).toBe(true);
      expect(can("VIEWER", "view", "project")).toBe(true);
      expect(can("VIEWER", "view", "task")).toBe(true);
      expect(can("VIEWER", "view", "interaction")).toBe(true);
    });

    it("cannot change anything", () => {
      expect(can("VIEWER", "create", "relationship")).toBe(false);
      expect(can("VIEWER", "edit", "project")).toBe(false);
      expect(can("VIEWER", "archive", "relationship")).toBe(false);
      expect(can("VIEWER", "delete", "task")).toBe(false);
    });

    it("cannot see the user list at all", () => {
      expect(can("VIEWER", "view", "user")).toBe(false);
    });
  });

  describe("MEMBER", () => {
    it("can create and edit records in both modules", () => {
      expect(can("MEMBER", "create", "relationship")).toBe(true);
      expect(can("MEMBER", "edit", "relationship")).toBe(true);
      expect(can("MEMBER", "create", "task")).toBe(true);
      expect(can("MEMBER", "edit", "project")).toBe(true);
      expect(can("MEMBER", "create", "interaction")).toBe(true);
    });

    it("can archive but not delete", () => {
      // Archiving is reversible and preserves history; deletion is neither.
      expect(can("MEMBER", "archive", "relationship")).toBe(true);
      expect(can("MEMBER", "delete", "relationship")).toBe(false);
      expect(can("MEMBER", "delete", "project")).toBe(false);
    });

    it("cannot manage users", () => {
      expect(can("MEMBER", "view", "user")).toBe(false);
      expect(can("MEMBER", "create", "user")).toBe(false);
      expect(can("MEMBER", "manage", "user")).toBe(false);
    });
  });

  describe("ADMIN", () => {
    it("can do everything in both modules", () => {
      expect(can("ADMIN", "delete", "relationship")).toBe(true);
      expect(can("ADMIN", "delete", "project")).toBe(true);
      expect(can("ADMIN", "archive", "relationship")).toBe(true);
    });

    it("can manage users", () => {
      expect(can("ADMIN", "view", "user")).toBe(true);
      expect(can("ADMIN", "create", "user")).toBe(true);
      expect(can("ADMIN", "manage", "user")).toBe(true);
    });
  });

  it("denies an unknown role rather than defaulting open", () => {
    // Defence in depth: a role that somehow reaches this function without
    // matching the vocabulary must fail closed.
    expect(can("SUPERUSER" as never, "view", "relationship")).toBe(false);
  });
});

describe("requirePermission", () => {
  it("returns quietly when the role is allowed", () => {
    expect(() => requirePermission("ADMIN", "delete", "project")).not.toThrow();
  });

  it("throws a PermissionError naming the action when the role is not", () => {
    expect(() => requirePermission("VIEWER", "delete", "project")).toThrow(
      PermissionError,
    );

    try {
      requirePermission("VIEWER", "delete", "project");
    } catch (error) {
      expect((error as PermissionError).message).toContain("delete");
      expect((error as PermissionError).message).toContain("project");
      expect((error as PermissionError).role).toBe("VIEWER");
    }
  });
});

describe("describePermissions", () => {
  it("lists what a role may do, for the admin screen and the user guide", () => {
    const viewer = describePermissions("VIEWER");

    expect(viewer.some((line) => line.toLowerCase().includes("read"))).toBe(
      true,
    );
    expect(describePermissions("ADMIN").length).toBeGreaterThan(viewer.length);
  });
});
