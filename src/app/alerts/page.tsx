import { DashboardShell } from "@/components/dashboard-shell";
import { SearchAlertsManager } from "@/components/search-alerts-manager";

export default async function AlertsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
  return <DashboardShell title="Saved search alerts"><SearchAlertsManager defaults={{
    keywords: value("keywords"),
    reportType: value("reportType"),
    category: value("category"),
    location: value("location")
  }} /></DashboardShell>;
}
