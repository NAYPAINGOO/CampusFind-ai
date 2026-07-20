import Link from "next/link";
import type { ReactNode } from "react";
import { Bell, BellRing, ChartNoAxesCombined, FileSearch, Gauge, Handshake, Home, LogOut, Settings, ShieldCheck, Users } from "lucide-react";
import { Logo } from "@/components/logo";

const userLinks = [
  ["Dashboard", "/dashboard", Home], ["My reports", "/reports", FileSearch], ["Matches", "/matches", Handshake], ["Claims", "/claims", ShieldCheck], ["Saved alerts", "/alerts", BellRing], ["Notifications", "/notifications", Bell], ["Settings", "/settings", Settings]
] as const;
const adminLinks = [["Admin overview", "/admin", Gauge], ["Users", "/admin/users", Users], ["Reports", "/admin/reports", FileSearch], ["Analytics", "/admin/analytics", ChartNoAxesCombined], ["Settings", "/admin/settings", Settings]] as const;
const securityLinks = [["Security desk", "/security", ShieldCheck], ["Pending claims", "/security/claims", Handshake], ["Stored items", "/security/items", FileSearch], ["Handovers", "/security/handovers", Gauge]] as const;

export function DashboardShell({ children, mode = "user", title }: { children: ReactNode; mode?: "user" | "security" | "admin"; title: string }) {
  const links = mode === "admin" ? adminLinks : mode === "security" ? securityLinks : userLinks;
  return (
    <div className="min-h-screen md:grid md:grid-cols-[250px_1fr]">
      <aside className="border-r border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <Link href="/"><Logo /></Link>
        <nav className="mt-8 grid gap-2" aria-label={`${mode} dashboard`}>
          {links.map(([label, href, Icon]) => <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800"><Icon size={19} />{label}</Link>)}
        </nav>
        <Link href="/" className="mt-8 flex items-center gap-3 rounded-xl px-3 py-3 font-semibold muted"><LogOut size={19} />Exit dashboard</Link>
      </aside>
      <main><div className="border-b border-slate-200 bg-white px-5 py-5 dark:border-slate-800 dark:bg-slate-950"><h1 className="text-2xl font-black">{title}</h1></div><div className="p-5 md:p-8">{children}</div></main>
    </div>
  );
}
