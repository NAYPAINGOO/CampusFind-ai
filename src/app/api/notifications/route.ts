import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  return { supabase, user: authData.user };
}

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ notifications: [], mode: "demo" });
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data, error } = await supabase
    .from("notifications")
    .select("id,title,message,notification_type,related_entity_id,is_read,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notifications: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ updated: true, mode: "demo" });
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { id?: unknown; all?: unknown };

  let query = supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id);
  if (body.all === true) query = query.eq("is_read", false);
  else if (typeof body.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id)) query = query.eq("id", body.id);
  else return NextResponse.json({ error: "Provide a notification ID or set all to true." }, { status: 400 });

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: true });
}
