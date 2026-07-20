import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import { secureToken, signToken, hashSecret } from "@/lib/security";
import { getApiActor } from "@/lib/api-auth";
import { handoverCreateSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  const actor = await getApiActor(["security", "admin"]);
  if (!actor) return NextResponse.json({ error: "Security role required." }, { status: 403 });

  const json: unknown = await request.json().catch(() => null);
  const parsed = handoverCreateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid handover request.", details: parsed.error.flatten() }, { status: 400 });

  const token = secureToken();
  const payload = JSON.stringify({ claimId: parsed.data.claimId, token, expiresAt: parsed.data.expiresAt });
  const signature = signToken(payload);
  const signedValue = Buffer.from(JSON.stringify({ payload, signature })).toString("base64url");
  const qrDataUrl = await QRCode.toDataURL(signedValue, { errorCorrectionLevel: "H", margin: 1, width: 320 });

  return NextResponse.json({
    qrDataUrl,
    tokenHash: hashSecret(token),
    signedValue,
    expiresAt: parsed.data.expiresAt
  });
}
