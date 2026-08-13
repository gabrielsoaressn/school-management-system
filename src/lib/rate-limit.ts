/**
 * Fixed-window rate limiter kept in process memory.
 *
 * Enough to stop a script hammering the public enrollment form from one host.
 * It is per-instance and resets on deploy: if the app is ever scaled to more
 * than one process, move the counters to Redis or to the PSP-grade limiter in
 * front of the app. Documented in docs/OPERATIONS.md.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

/** Drop expired windows so the map cannot grow without bound. */
function prune(now: number) {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) {
      windows.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();

  if (windows.size > 1000) {
    prune(now);
  }

  const current = windows.get(key);

  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  current.count += 1;

  if (current.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining: limit - current.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Best-effort client address. Behind a proxy the first x-forwarded-for entry is
 * the client; the header is spoofable, so this is a throttle, not an identity.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Field name of the honeypot input rendered on public forms. */
export const HONEYPOT_FIELD = "websiteUrl";

/** A real user never fills a field they cannot see. */
export function looksLikeBot(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const value = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  return typeof value === "string" && value.trim().length > 0;
}
