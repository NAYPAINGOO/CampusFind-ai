import { redirect } from "next/navigation";
import type { UserRole } from "@/types/domain";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) redirect("/login");
  return data.user;
}

export async function requireRole(allowed: UserRole[]) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, account_status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.account_status !== "active" || !allowed.includes(profile.role as UserRole)) {
    redirect("/unauthorized");
  }

  return { user, role: profile.role as UserRole };
}
