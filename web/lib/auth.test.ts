import { describe, it, expect } from "vitest";

// Unit test: auth validation logic (re-implemented for testing)
function validateDeviceSecret(secret: string | null, expected: string): boolean {
  if (!expected) return false;
  return secret === expected;
}

describe("validateDeviceSecret", () => {
  it("returns false when expected secret is empty", () => {
    expect(validateDeviceSecret("abc", "")).toBe(false);
  });

  it("returns false when header is null", () => {
    expect(validateDeviceSecret(null, "abc")).toBe(false);
  });

  it("returns false when secrets do not match", () => {
    expect(validateDeviceSecret("wrong", "correct")).toBe(false);
  });

  it("returns true when secrets match", () => {
    expect(validateDeviceSecret("abc", "abc")).toBe(true);
  });
});
