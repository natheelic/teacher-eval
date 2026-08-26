/**
 * In-memory, per-process rate limiting for auth chokepoints (password
 * sign-in, TOTP code verification).
 *
 * Deliberately not backed by Redis or any external store: this app runs as a
 * single long-lived Node server (see CLAUDE.md), not a fleet of serverless
 * instances that would each keep their own independent counters, so a plain
 * in-memory map already gives every request the same view. Revisit only if
 * the app is ever horizontally scaled behind a load balancer.
 *
 * Cleanup of expired buckets piggybacks on calls to `recordFailure` rather
 * than a background sweep — this app has no scheduled-job infrastructure at
 * all (see docs/ROADMAP.md Phase 4.5's DR-05 for the same reasoning applied
 * to AuditLog retention), and a lazy sweep on the hot path is enough to keep
 * the map from growing unbounded.
 */

type Bucket = { count: number; resetAt: number };

// Next's dev server re-evaluates modules on every HMR pass. Without this
// cache each pass would start a fresh, empty map — same reasoning as
// lib/prisma.ts's connection-pool cache.
const globalForRateLimit = globalThis as unknown as {
  authRateLimitBuckets: Map<string, Bucket> | undefined;
};

const buckets = globalForRateLimit.authRateLimitBuckets ?? new Map<string, Bucket>();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.authRateLimitBuckets = buckets;
}

export type RateLimitStatus = {
  allowed: boolean;
  /** Only meaningful when `allowed` is false. */
  retryAfterMs: number;
};

/** Read-only check: does NOT count as an attempt. Call `recordFailure` separately. */
export function checkRateLimit(key: string, limit: number): RateLimitStatus {
  const bucket = buckets.get(key);
  const now = Date.now();

  if (!bucket || bucket.resetAt <= now) {
    return { allowed: true, retryAfterMs: 0 };
  }
  if (bucket.count < limit) {
    return { allowed: true, retryAfterMs: 0 };
  }
  return { allowed: false, retryAfterMs: bucket.resetAt - now };
}

/** Call only on a genuine failed attempt — a rate limit that also counts successes locks out normal use. */
export function recordFailure(key: string, windowMs: number): void {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    bucket.count += 1;
  }

  sweepExpired(now);
}

/** Call on a successful attempt so a legitimate sign-in isn't penalised by earlier typos. */
export function clearRateLimit(key: string): void {
  buckets.delete(key);
}

let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60_000;

function sweepExpired(now: number): void {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
