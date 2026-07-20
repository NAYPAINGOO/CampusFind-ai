import Link from "next/link";
import { BellRing, Search } from "lucide-react";
import { ItemCard } from "@/components/item-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PageHero } from "@/components/page-hero";
import { categories, locations } from "@/lib/demo-data";
import { listPublicReports } from "@/lib/repository";
import type { ReportType } from "@/types/domain";

function value(params: Record<string, string | string[] | undefined>, key: string): string {
  return typeof params[key] === "string" ? params[key] as string : "";
}

export default async function Reports({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const typeValue = value(params, "type");
  const type: ReportType | "" = typeValue === "lost" || typeValue === "found" ? typeValue : "";
  const filters = {
    q: value(params, "q"),
    type,
    category: value(params, "category"),
    location: value(params, "location"),
    from: value(params, "from"),
    to: value(params, "to")
  };
  const reports = await listPublicReports(filters);
  const alertParams = new URLSearchParams();
  if (filters.q) alertParams.set("keywords", filters.q);
  if (filters.category) alertParams.set("category", filters.category);
  if (filters.location) alertParams.set("location", filters.location);
  if (filters.type) alertParams.set("reportType", filters.type);

  return <>
    <SiteHeader />
    <main id="main-content">
      <PageHero eyebrow="Public summaries" title="Browse lost and found reports" description="Search structured, privacy-safe reports instead of scrolling through old Telegram messages. Exact storage details and ownership evidence remain restricted." />
      <section className="container-shell pb-16">
        <form className="card grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-[2fr_repeat(3,1fr)_auto]">
          <label className="relative md:col-span-2 lg:col-span-1"><span className="sr-only">Keyword</span><Search className="absolute left-3 top-3.5 muted" size={18} /><input className="input pl-10" name="q" defaultValue={filters.q} placeholder="Keyword, colour, brand or location" maxLength={80} /></label>
          <select className="input" name="type" defaultValue={filters.type}><option value="">Lost or found</option><option value="lost">Lost</option><option value="found">Found</option></select>
          <select className="input" name="category" defaultValue={filters.category}><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
          <select className="input" name="location" defaultValue={filters.location}><option value="">All locations</option>{locations.map((item) => <option key={item}>{item}</option>)}</select>
          <button className="btn-primary">Apply filters</button>
          <label><span className="label">From date</span><input className="input" type="date" name="from" defaultValue={filters.from} /></label>
          <label><span className="label">To date</span><input className="input" type="date" name="to" defaultValue={filters.to} /></label>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="font-bold">{reports.length} report(s)</p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/alerts${alertParams.size ? `?${alertParams.toString()}` : ""}`} className="btn-secondary"><BellRing size={17} />Save as alert</Link>
            <Link href="/reports" className="btn-secondary">Clear all filters</Link>
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{reports.map((report) => <ItemCard key={report.id} report={report} />)}</div>
        {reports.length === 0 && <div className="card mt-5 p-10 text-center"><h2 className="text-xl font-black">No matching summaries</h2><p className="mt-2 muted">Try broader filters or save this search as an alert for future reports.</p><Link href={`/alerts${alertParams.size ? `?${alertParams.toString()}` : ""}`} className="btn-primary mt-5"><BellRing size={17} />Notify me when one appears</Link></div>}
      </section>
    </main>
    <SiteFooter />
  </>;
}
