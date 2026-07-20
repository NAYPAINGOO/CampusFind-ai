import { NextResponse, type NextRequest } from "next/server";
import { calculateMatchScore, explainMatch } from "@/lib/matching";
import { matchInputSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  const json: unknown = await request.json().catch(() => null);
  const parsed = matchInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid matching input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const score = calculateMatchScore(parsed.data);
  return NextResponse.json({
    score,
    explanation: explainMatch(parsed.data, score),
    notificationEligible: score >= 70
  });
}
