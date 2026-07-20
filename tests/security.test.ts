import { beforeEach, describe, expect, it } from "vitest";
import { hashSecret, signToken, verifySignedToken } from "@/lib/security";

describe("security helpers", () => {
  beforeEach(() => {
    process.env.QR_SIGNING_SECRET = "this-is-a-test-secret-with-at-least-thirty-two-characters";
  });

  it("normalises verification answers before hashing", () => {
    expect(hashSecret("  Blue Tag ")).toBe(hashSecret("blue tag"));
  });

  it("signs and verifies collection payloads", () => {
    const payload = JSON.stringify({ claimId: "abc", expiresAt: "2030-01-01T00:00:00Z" });
    const signature = signToken(payload);
    expect(verifySignedToken(payload, signature)).toBe(true);
    expect(verifySignedToken(`${payload}x`, signature)).toBe(false);
  });
});
