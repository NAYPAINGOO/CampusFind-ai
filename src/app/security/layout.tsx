import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";

export default async function SecurityLayout({ children }: { children: ReactNode }) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) await requireRole(["security", "admin"]);
  return children;
}
