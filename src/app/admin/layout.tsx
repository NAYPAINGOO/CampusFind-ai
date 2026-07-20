import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) await requireRole(["admin"]);
  return children;
}
