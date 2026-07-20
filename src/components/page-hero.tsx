import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: ReactNode }) {
  return <section className="container-shell py-12 md:py-16"><div className="max-w-3xl">{eyebrow && <p className="font-bold uppercase tracking-widest text-blue-600">{eyebrow}</p>}<h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">{title}</h1><p className="mt-5 text-lg leading-8 muted">{description}</p>{actions && <div className="mt-7 flex flex-wrap gap-3">{actions}</div>}</div></section>;
}
