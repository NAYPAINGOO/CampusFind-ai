import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

export type ApiActor = { userId: string; role: UserRole };

export async function getApiActor(allowed: UserRole[]): Promise<ApiActor | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (process.env.ENABLE_DEMO_PRIVILEGED_ROUTES !== "true") return null;
    return { userId: "demo-user", role: allowed[0] ?? "user" };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, account_status")
    .eq("id", authData.user.id)
    .single();

  if (!profile || profile.account_status !== "active") return null;
  const role = profile.role as UserRole;
  return allowed.includes(role) ? { userId: authData.user.id, role } : null;
}
