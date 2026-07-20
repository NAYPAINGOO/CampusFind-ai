import Link from "next/link";
import type { MatchCandidate } from "@/types/domain";
import { confidenceLabel } from "@/lib/matching";
import { StatusBadge } from "@/components/status-badge";

export function MatchCard({ match }: { match: MatchCandidate }) {
  return <article className="card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-bold text-blue-600">{confidenceLabel(match.overallScore)} recommendation</p><h2 className="mt-2 text-xl font-black">{match.lostTitle} ↔ {match.foundTitle}</h2></div><div className="grid h-20 w-20 place-items-center rounded-full border-8 border-blue-100 text-xl font-black text-blue-700">{match.overallScore}%</div></div><p className="mt-4 text-sm leading-6 muted">{match.explanation}</p><div className="mt-5 flex items-center justify-between"><StatusBadge status={match.status} /><Link className="btn-primary" href={`/matches/${match.id}`}>Review match</Link></div></article>;
}
