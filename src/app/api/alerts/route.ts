import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchAlertSchema } from "@/lib/schemas";

async function authenticatedUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ alerts: [], mode: "demo" });
  const { supabase, user } = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data, error } = await supabase
    .from("search_alerts")
    .select("id,keywords,report_type,email_enabled,is_active,created_at,category:item_categories(name),location:campus_locations(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alerts: data ?? [] });
}

export async function POST(request: NextRequest) {
  const json: unknown = await request.json().catch(() => null);
  const parsed = searchAlertSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid alert settings.", details: parsed.error.flatten() }, { status: 400 });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({
      alert: {
        id: crypto.randomUUID(),
        keywords: parsed.data.keywords || null,
        report_type: parsed.data.reportType || null,
        category: parsed.data.category ? { name: parsed.data.category } : null,
        location: parsed.data.location ? { name: parsed.data.location } : null,
        email_enabled: parsed.data.emailEnabled,
        is_active: true,
        created_at: new Date().toISOString()
      },
      mode: "demo"
    }, { status: 201 });
  }

  const { supabase, user } = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const [{ data: category }, { data: location }] = await Promise.all([
    parsed.data.category
      ? supabase.from("item_categories").select("id").eq("name", parsed.data.category).eq("is_active", true).maybeSingle()
      : Promise.resolve({ data: null }),
    parsed.data.location
      ? supabase.from("campus_locations").select("id").eq("name", parsed.data.location).eq("is_active", true).maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  if (parsed.data.category && !category?.id) return NextResponse.json({ error: "Selected category is unavailable." }, { status: 400 });
  if (parsed.data.location && !location?.id) return NextResponse.json({ error: "Selected location is unavailable." }, { status: 400 });

  const { data, error } = await supabase
    .from("search_alerts")
    .insert({
      user_id: user.id,
      keywords: parsed.data.keywords || null,
      report_type: parsed.data.reportType || null,
      category_id: category?.id ?? null,
      location_id: location?.id ?? null,
      email_enabled: parsed.data.emailEnabled
    })
    .select("id,keywords,report_type,email_enabled,is_active,created_at,category:item_categories(name),location:campus_locations(name)")
    .single();

  if (error?.code === "23505") return NextResponse.json({ error: "An identical active alert already exists." }, { status: 409 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alert: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "A valid alert ID is required." }, { status: 400 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ deleted: true, mode: "demo" });

  const { supabase, user } = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { error } = await supabase.from("search_alerts").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
