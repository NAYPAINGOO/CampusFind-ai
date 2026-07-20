import { NextResponse, type NextRequest } from "next/server";
import { claimSchema } from "@/lib/schemas";
import { hashSecret } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

function clientKey(request: NextRequest): string {
  return request.headers.get("x-real-ip")?.trim() || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(`claims:${clientKey(request)}`, 5, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many claim attempts. Try again later." }, { status: 429, headers: { "retry-after": "60" } });

  const json: unknown = await request.json().catch(() => null);
  const parsed = claimSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid claim data.", details: parsed.error.flatten() }, { status: 400 });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ id: crypto.randomUUID(), mode: "demo" }, { status: 201 });
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data, error } = await supabase.from("ownership_claims").insert({
    match_id: parsed.data.matchId,
    claimant_id: authData.user.id,
    ownership_explanation: parsed.data.ownershipExplanation,
    identifying_features: parsed.data.identifyingFeatures,
    evidence_url: parsed.data.evidenceUrl || null,
    verification_answer_hash: hashSecret(parsed.data.verificationAnswer),
    status: "submitted"
  }).select("id").single();

  if (error?.code === "23505") return NextResponse.json({ error: "You have already submitted a claim for this match." }, { status: 409 });
  if (error?.code === "42501") return NextResponse.json({ error: "You are not eligible to claim this match." }, { status: 403 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ claim: data }, { status: 201 });
}
