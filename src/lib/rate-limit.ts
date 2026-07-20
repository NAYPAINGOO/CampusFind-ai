type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
let operations = 0;

function removeExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(key: string, limit = 10, windowMs = 60_000): { allowed: boolean; remaining: number; resetAt: number } {
  const safeLimit = Math.max(1, Math.floor(limit));
  const safeWindow = Math.max(1_000, Math.floor(windowMs));
  const now = Date.now();
  operations += 1;
  if (operations % 500 === 0 || buckets.size > 10_000) removeExpiredBuckets(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + safeWindow;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: safeLimit - 1, resetAt };
  }

  if (existing.count >= safeLimit) return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  existing.count += 1;
  return { allowed: true, remaining: safeLimit - existing.count, resetAt: existing.resetAt };
}
