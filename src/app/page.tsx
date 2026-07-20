import Link from "next/link";
import { ArrowRight, BellRing, CheckCircle2, LockKeyhole, Search, ShieldCheck, Sparkles } from "lucide-react";
import { ItemCard } from "@/components/item-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StatCard } from "@/components/stat-card";
import { dashboardStats } from "@/lib/demo-data";
import { listPublicReports } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const recentReports = (await listPublicReports()).slice(0, 3);

  return <>
    <SiteHeader />
    <main id="main-content">
      <section className="overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20 dark:from-slate-950 dark:via-slate-950 dark:to-blue-950">
        <div className="container-shell grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div><span className="badge badge-blue"><Sparkles size={14} /> Transparent AI matching</span><h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight md:text-6xl">Lost Something? Let AI Help You Find It.</h1><p className="mt-6 max-w-2xl text-lg leading-8 muted">Report a lost or found item, receive explainable match recommendations, prove ownership privately, and complete a secure campus handover.</p><div className="mt-8 flex flex-wrap gap-3"><Link className="btn-primary" href="/report/lost">Report Lost Item <ArrowRight size={18} /></Link><Link className="btn-secondary" href="/report/found">Report Found Item</Link></div>
          <form className="card mt-8 flex max-w-2xl gap-2 p-2" action="/reports"><label className="sr-only" htmlFor="public-search">Search public item summaries</label><Search className="ml-2 self-center muted" /><input id="public-search" name="q" className="min-w-0 flex-1 bg-transparent px-2 outline-none" placeholder="Search category, colour, brand or location" /><button className="btn-primary">Search</button></form></div>
          <div className="card relative p-6"><div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-blue-200/50 blur-2xl" /><div className="relative rounded-2xl bg-slate-950 p-6 text-white"><p className="text-sm font-bold text-blue-300">LIVE MATCH PREVIEW</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="rounded-xl bg-white/10 p-4"><span className="badge badge-red">LOST</span><p className="mt-3 font-black">Black Lenovo backpack</p><p className="mt-2 text-sm text-slate-300">Library · blue zipper tag</p></div><div className="rounded-xl bg-white/10 p-4"><span className="badge badge-green">FOUND</span><p className="mt-3 font-black">Black laptop bag</p><p className="mt-2 text-sm text-slate-300">Study hall · blue keyring</p></div></div><div className="mt-5 rounded-xl bg-blue-600 p-5"><div className="flex items-center justify-between"><span className="font-bold">AI recommendation</span><strong className="text-3xl">88%</strong></div><p className="mt-2 text-sm text-blue-100">Similar images, category, colour, brand and dates. Human verification required.</p></div></div></div>
        </div>
      </section>

      <section className="container-shell -mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{dashboardStats.map((stat) => <StatCard key={stat.label} {...stat} />)}</section>

      <section className="container-shell py-20"><div className="text-center"><p className="font-bold uppercase tracking-widest text-blue-600">Simple recovery flow</p><h2 className="mt-3 text-3xl font-black md:text-4xl">How CampusFind AI works</h2></div><div className="mt-10 grid gap-5 md:grid-cols-3">{[
        ["1", "Report securely", "Add item details, approximate location and images while private ownership clues remain hidden.", Search],
        ["2", "Review AI matches", "The system compares text, images, category, colour, brand, location and date with an explainable score.", Sparkles],
        ["3", "Verify and recover", "Security staff review evidence and complete handover with a one-time QR or verification code.", ShieldCheck]
      ].map(([number, title, text, Icon]) => { const I = Icon as typeof Search; return <article className="card p-6" key={String(number)}><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 font-black text-white">{number as string}</span><I className="text-blue-600" /></div><h3 className="mt-5 text-xl font-black">{title as string}</h3><p className="mt-3 leading-7 muted">{text as string}</p></article>; })}</div></section>

      <section className="bg-white py-20 dark:bg-slate-950"><div className="container-shell"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-bold uppercase tracking-widest text-blue-600">Recent activity</p><h2 className="mt-2 text-3xl font-black">Recently reported items</h2></div><Link className="btn-secondary" href="/reports">Browse all reports</Link></div><div className="mt-8 grid gap-5 md:grid-cols-3">{recentReports.map((report) => <ItemCard report={report} key={report.id} />)}</div></div></section>

      <section className="container-shell py-20"><div className="grid gap-6 lg:grid-cols-2"><article className="card p-8"><LockKeyhole className="text-blue-600" size={34} /><h2 className="mt-4 text-2xl font-black">Privacy by design</h2><p className="mt-3 leading-7 muted">Public listings exclude private contact details, exact found-item storage locations, verification answers, internal staff notes and hidden ownership features.</p><div className="mt-6 grid gap-3 text-sm">{["Private evidence review", "Role-based access", "Hashed verification data", "Auditable staff actions"].map((item) => <p className="flex items-center gap-2" key={item}><CheckCircle2 className="text-green-600" size={18} />{item}</p>)}</div></article><article className="card p-8"><BellRing className="text-blue-600" size={34} /><h2 className="mt-4 text-2xl font-black">Recommendations, not guarantees</h2><p className="mt-3 leading-7 muted">AI narrows the search and explains why reports appear related. Security staff and ownership evidence remain the final decision layer.</p><Link href="/how-it-works" className="btn-primary mt-6">See matching process</Link></article></div></section>
    </main>
    <SiteFooter />
  </>;
}
