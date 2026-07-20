import { NextResponse, type NextRequest } from "next/server";
import { hashSecret, verifySignedToken } from "@/lib/security";
import { getApiActor } from "@/lib/api-auth";
import { handoverVerifySchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  const actor = await getApiActor(["security", "admin"]);
  if (!actor) return NextResponse.json({ error: "Security role required." }, { status: 403 });

  const json: unknown = await request.json().catch(() => null);
  const parsed = handoverVerifySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid collection credential." }, { status: 400 });
  const code = parsed.data.code;

  if (/^CF-[A-Z0-9]{6,12}$/.test(code.toUpperCase())) {
    if (process.env.ENABLE_DEMO_PRIVILEGED_ROUTES === "true" && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ message: "Demo code format accepted. No real item may be released in demo mode.", mode: "demo" });
    }
    return NextResponse.json({ error: "Manual codes must be verified against an active handover record." }, { status: 400 });
  }

  try {
    const decoded = JSON.parse(Buffer.from(code, "base64url").toString("utf8")) as { payload?: unknown; signature?: unknown };
    if (typeof decoded.payload !== "string" || typeof decoded.signature !== "string") throw new Error("Malformed credential");
    if (!verifySignedToken(decoded.payload, decoded.signature)) return NextResponse.json({ error: "Invalid QR signature." }, { status: 400 });

    const payload = JSON.parse(decoded.payload) as { expiresAt?: unknown; claimId?: unknown; token?: unknown };
    if (
      typeof payload.expiresAt !== "string"
      || typeof payload.claimId !== "string"
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.claimId)
      || typeof payload.token !== "string"
      || payload.token.length < 20
    ) {
      return NextResponse.json({ error: "Invalid credential payload." }, { status: 400 });
    }
    if (new Date(payload.expiresAt).getTime() <= Date.now()) return NextResponse.json({ error: "This collection credential has expired." }, { status: 410 });

    return NextResponse.json({
      message: "Signature verified. Confirm the claim, token hash, identity, collection deadline and unused status in the database before release.",
      claimId: payload.claimId,
      tokenHash: hashSecret(payload.token)
    });
  } catch {
    return NextResponse.json({ error: "Invalid collection credential." }, { status: 400 });
  }
}
