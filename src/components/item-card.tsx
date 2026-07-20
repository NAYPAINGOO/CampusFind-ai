import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import type { ItemReport } from "@/types/domain";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

function itemIcon(category: string): string {
  if (category.includes("Backpack")) return "🎒";
  if (category.includes("Ear")) return "🎧";
  if (category.includes("Wallet")) return "👛";
  if (category.toLowerCase().includes("phone")) return "📱";
  if (category.includes("Keys")) return "🔑";
  return "🪪";
}

export function ItemCard({ report }: { report: ItemReport }) {
  return (
    <article className="card overflow-hidden">
      <Link href={`/reports/${report.id}`} className="relative block h-48 overflow-hidden bg-gradient-to-br from-blue-100 to-slate-100 dark:from-blue-950 dark:to-slate-900">
        {report.imageUrl ? (
          <Image
            src={report.imageUrl}
            alt={`User-uploaded image of ${report.title}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-300 hover:scale-105"
          />
        ) : (
          <span className="grid h-full place-items-center text-5xl" aria-label={`No public image available for ${report.title}`} role="img">
            {itemIcon(report.category)}
          </span>
        )}
      </Link>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className={`badge ${report.reportType === "lost" ? "badge-red" : "badge-green"}`}>{report.reportType.toUpperCase()}</span>
          <StatusBadge status={report.status} />
        </div>
        <h3 className="mt-4 text-lg font-black"><Link href={`/reports/${report.id}`}>{report.title}</Link></h3>
        <p className="mt-2 line-clamp-2 text-sm muted">{report.description}</p>
        <div className="mt-4 grid gap-2 text-sm muted">
          <span className="flex items-center gap-2"><MapPin size={16} />{report.location}</span>
          <span className="flex items-center gap-2"><CalendarDays size={16} />{formatDate(report.incidentDate)}</span>
        </div>
      </div>
    </article>
  );
}
