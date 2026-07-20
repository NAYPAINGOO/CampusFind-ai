import { formatStatus } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const tone = status.includes("returned") || status.includes("approved") || status.includes("confirmed")
    ? "badge-green"
    : status.includes("rejected") || status.includes("fraud")
      ? "badge-red"
      : status.includes("pending") || status.includes("review") || status.includes("claim")
        ? "badge-yellow"
        : status.includes("closed") || status.includes("archived")
          ? "badge-gray"
          : "badge-blue";
  return <span className={`badge ${tone}`}>{formatStatus(status)}</span>;
}
