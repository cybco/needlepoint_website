// Upstash rate limiting for license API endpoints
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
// These environment variables should be set in production
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Rate limits by endpoint
export const rateLimits = {
  // Trial init: 5 per hour per IP (prevent abuse)
  trialInit: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    prefix: 'rl:trial',
  }),

  // Activation: 10 per hour per license key
  activate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    prefix: 'rl:activate',
  }),

  // Validation: 60 per hour per device (normal app usage)
  validate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 h'),
    prefix: 'rl:validate',
  }),

  // Recovery: 3 per hour per email (prevent spam)
  recover: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    prefix: 'rl:recover',
  }),

  // IAP verification: 20 per hour per device
  iapVerify: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 h'),
    prefix: 'rl:iap',
  }),
};

export type RateLimitType = keyof typeof rateLimits;

/**
 * Check rate limit for a specific endpoint and identifier.
 * Returns { success: true } if under limit, { success: false, reset } if rate limited.
 */
export async function checkRateLimit(
  type: RateLimitType,
  identifier: string
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const ratelimit = rateLimits[type];
  const result = await ratelimit.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Get the client IP address from request headers.
 * Handles various proxy headers used by Vercel and other providers.
 */
export function getClientIp(headers: Headers): string {
  // Try various headers that might contain the real IP
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Vercel-specific header
  const vercelForwardedFor = headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim();
  }

  // Fallback - this shouldn't happen in production behind a proxy
  return 'unknown';
}
