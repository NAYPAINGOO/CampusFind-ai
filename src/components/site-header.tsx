"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/logo";

const links = [
  ["How it works", "/how-it-works"],
  ["Browse items", "/reports"],
  ["About", "/about"],
  ["FAQ", "/faq"],
  ["Support", "/contact"]
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-950/90">
      <div className="container-shell flex min-h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="CampusFind AI home"><Logo /></Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          {links.map(([label, href]) => <Link className="text-sm font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-300" href={href} key={href}>{label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="btn-secondary">Log in</Link>
          <Link href="/report/lost" className="btn-primary">Report item</Link>
        </div>
        <button className="md:hidden" aria-expanded={open} aria-label="Toggle navigation" onClick={() => setOpen((value) => !value)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="container-shell grid gap-2 pb-4 md:hidden" aria-label="Mobile navigation">
          {links.map(([label, href]) => <Link className="rounded-lg px-3 py-2 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800" href={href} key={href} onClick={() => setOpen(false)}>{label}</Link>)}
          <Link href="/login" className="btn-secondary">Log in</Link>
          <Link href="/report/lost" className="btn-primary">Report item</Link>
        </nav>
      )}
    </header>
  );
}
