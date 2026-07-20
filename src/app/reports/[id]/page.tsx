import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StatusBadge } from "@/components/status-badge";
import { getPublicReport } from "@/lib/repository";
import { formatDate } from "@/lib/utils";

function itemIcon(category: string): string {
  if (category.includes("Backpack")) return "🎒";
  if (category.includes("Ear")) return "🎧";
  if (category.includes("Wallet")) return "👛";
  if (category.toLowerCase().includes("phone")) return "📱";
  if (category.includes("Keys")) return "🔑";
  return "🪪";
}

export default async function ReportDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getPublicReport(id);
  if (!report) notFound();

  return <>
    <SiteHeader />
    <main id="main-content" className="container-shell py-12">
      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <div className="card relative min-h-80 overflow-hidden bg-gradient-to-br from-blue-100 to-slate-100 dark:from-blue-950 dark:to-slate-900">
          {report.imageUrl ? (
            <Image
              src={report.imageUrl}
              alt={`User-uploaded image of ${report.title}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-contain"
            />
          ) : (
            <span className="grid min-h-80 place-items-center text-8xl" role="img" aria-label={`No public image available for ${report.title}`}>{itemIcon(report.category)}</span>
          )}
        </div>
        <article className="card p-7">
          <div className="flex flex-wrap items-center gap-3"><span className={`badge ${report.reportType === "lost" ? "badge-red" : "badge-green"}`}>{report.reportType.toUpperCase()}</span><StatusBadge status={report.status} /></div>
          <h1 className="mt-5 text-4xl font-black">{report.title}</h1>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs font-bold uppercase muted">Category</dt><dd className="mt-1 font-semibold">{report.category}</dd></div>
            <div><dt className="text-xs font-bold uppercase muted">Main colour</dt><dd className="mt-1 font-semibold">{report.primaryColour}</dd></div>
            <div><dt className="text-xs font-bold uppercase muted">Approximate location</dt><dd className="mt-1 font-semibold">{report.location}</dd></div>
            <div><dt className="text-xs font-bold uppercase muted">Incident date</dt><dd className="mt-1 font-semibold">{formatDate(report.incidentDate)}</dd></div>
          </dl>
          <h2 className="mt-7 font-black">Public description</h2><p className="mt-2 leading-7 muted">{report.description}</p>
          <div className="mt-7 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Sensitive ownership clues, exact found-item storage details and personal contact information are hidden. Never send payment or reveal private verification answers to another user.</div>
          <div className="mt-6 flex flex-wrap gap-3"><Link className="btn-primary" href="/matches">View possible matches</Link><Link className="btn-secondary" href="/contact">Report concern</Link></div>
        </article>
      </div>
    </main>
    <SiteFooter />
  </>;
}
