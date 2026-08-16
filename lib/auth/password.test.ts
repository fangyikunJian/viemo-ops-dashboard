import { describe, expect, it } from "vitest";
import { hashPassword, validatePassword, verifyPassword } from "./password";

describe("hashPassword", () => {
  it("never stores the password itself", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toContain("correct horse battery staple");
  });

  it("produces a different hash each time, so equal passwords are not detectable", async () => {
    const a = await hashPassword("same-password");
    const b = await hashPassword("same-password");
    expect(a).not.toBe(b);
  });

  it("stores a salt alongside the derived key", async () => {
    const hash = await hashPassword("whatever");
    const [salt, key] = hash.split(":");
    expect(salt).toMatch(/^[0-9a-f]{32}$/);
    expect(key).toMatch(/^[0-9a-f]{128}$/);
  });
});

describe("verifyPassword", () => {
  it("accepts the correct password", async () => {
    const hash = await hashPassword("s3cret-passphrase");
    expect(await verifyPassword("s3cret-passphrase", hash)).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("s3cret-passphrase");
    expect(await verifyPassword("s3cret-passphras", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
  });

  it("rejects a malformed stored hash instead of throwing", async () => {
    expect(await verifyPassword("anything", "not-a-real-hash")).toBe(false);
    expect(await verifyPassword("anything", "")).toBe(false);
    expect(await verifyPassword("anything", "abc:")).toBe(false);
  });

  it("rejects a stored hash of the wrong length", async () => {
    expect(await verifyPassword("anything", "aabbccdd:0011")).toBe(false);
  });
});

describe("validatePassword", () => {
  it("accepts a password of at least eight characters", () => {
    expect(validatePassword("12345678")).toBeNull();
  });

  it("explains what is wrong with a short one", () => {
    expect(validatePassword("short")).toContain("8 characters");
  });
});
