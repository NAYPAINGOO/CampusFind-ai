export function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="card p-5"><p className="text-sm font-semibold muted">{label}</p><p className="mt-2 text-3xl font-black">{value}</p><p className="mt-2 text-xs muted">{detail}</p></article>;
}
