import { NextResponse } from "next/server";
import { recentReports } from "@/lib/demo-data";
import { getApiActor } from "@/lib/api-auth";

export async function GET() {
  const actor = await getApiActor(["admin"]);
  if (!actor) return NextResponse.json({ error: "Administrator role required." }, { status: 403 });
  const rows = ["id,type,title,category,location,status", ...recentReports.map((r) => [r.id, r.reportType, r.title, r.category, r.location, r.status].map((v) => `"${String(v).replaceAll('"','""')}"`).join(","))];
  return new NextResponse(rows.join("\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=campusfind-reports.csv" } });
}
