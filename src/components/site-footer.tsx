import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white py-10 dark:border-slate-800 dark:bg-slate-950">
      <div className="container-shell grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div><Logo /><p className="muted mt-4 max-w-md text-sm leading-6">A privacy-conscious university lost-and-found platform that uses transparent AI recommendations and human verification.</p></div>
        <div><h2 className="font-bold">Platform</h2><div className="mt-3 grid gap-2 text-sm muted"><Link href="/how-it-works">How it works</Link><Link href="/reports">Browse reports</Link><Link href="/faq">Frequently asked questions</Link></div></div>
        <div><h2 className="font-bold">Support</h2><div className="mt-3 grid gap-2 text-sm muted"><Link href="/contact">Contact security</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></div>
      </div>
      <div className="container-shell mt-8 border-t border-slate-200 pt-6 text-sm muted dark:border-slate-800">© 2026 CampusFind AI. University demonstration platform.</div>
    </footer>
  );
}
