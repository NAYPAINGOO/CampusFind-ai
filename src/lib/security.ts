import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function normaliseSecret(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function hashSecret(value: string): string {
  const normalised = normaliseSecret(value);
  const key = process.env.VERIFICATION_HASH_SECRET ?? process.env.QR_SIGNING_SECRET;
  if (key && key.length >= 32) return createHmac("sha256", key).update(normalised).digest("hex");
  return createHash("sha256").update(normalised).digest("hex");
}

export function secureToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

export function signToken(value: string): string {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret || secret.length < 32) throw new Error("QR_SIGNING_SECRET must contain at least 32 characters.");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function verifySignedToken(value: string, signature: string): boolean {
  const expected = signToken(value);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
