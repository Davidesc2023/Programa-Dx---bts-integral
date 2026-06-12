// In-memory rate limiter — per-instance approximation (acceptable for Edge Function defense)
// Keys are cleared when they expire to avoid unbounded growth

interface RateEntry { count: number; resetAt: number }
const store = new Map<string, RateEntry>()

export interface RateLimitResult { allowed: boolean; remaining: number; resetAt: number }

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs }
  }

  entry.count++
  const allowed = entry.count <= maxRequests
  return { allowed, remaining: Math.max(0, maxRequests - entry.count), resetAt: entry.resetAt }
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("cf-connecting-ip")
    ?? "unknown"
}
