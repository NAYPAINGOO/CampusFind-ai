import { NextResponse, type NextRequest } from "next/server";
import { reportSchema } from "@/lib/schemas";
import { rateLimit } from "@/lib/rate-limit";
import { createReport, DuplicateReportError } from "@/lib/repository";
import { createClient } from "@/lib/supabase/server";

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return request.headers.get("x-real-ip")?.trim() || forwarded || "local";
}

function cleanSearch(value: string): string {
  return value.replace(/[,%()]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

function validDate(value: string | null): value is string {
  return Boolean(value && /^20\d{2}-\d{2}-\d{2}$/.test(value));
}

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return NextResponse.json({ reports: [], mode: "demo" });

  const supabase = await createClient();
  const params = request.nextUrl.searchParams;
  const search = cleanSearch(params.get("q") ?? "");
  const type = params.get("type");
  const category = (params.get("category") ?? "").trim().slice(0, 120);
  const location = (params.get("location") ?? "").trim().slice(0, 150);
  const from = params.get("from");
  const to = params.get("to");

  let query = supabase.from("public_item_reports").select("*").order("created_at", { ascending: false }).limit(100);
  if (search) query = query.or(`title.ilike.%${search}%,category_name.ilike.%${search}%,brand.ilike.%${search}%,primary_colour.ilike.%${search}%,location_name.ilike.%${search}%`);
  if (type === "lost" || type === "found") query = query.eq("report_type", type);
  if (category) query = query.eq("category_name", category);
  if (location) query = query.eq("location_name", location);
  if (validDate(from)) query = query.gte("incident_date", from);
  if (validDate(to)) query = query.lte("incident_date", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reports: data ?? [] });
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(`reports:${clientKey(request)}`, 8, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many report submissions. Try again shortly." }, { status: 429, headers: { "retry-after": "60" } });

  const json: unknown = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid report data.", details: parsed.error.flatten() }, { status: 400 });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ id: crypto.randomUUID(), mode: "demo", message: "Validated demo report." }, { status: 201 });
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const report = await createReport(authData.user.id, parsed.data);
    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateReportError) {
      return NextResponse.json({ error: error.message, existingReportId: error.reportId }, { status: 409 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create report." }, { status: 500 });
  }
}
