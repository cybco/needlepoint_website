// PostgreSQL-based rate limiting for license API endpoints
import { prisma } from '@/db/prisma';

// Rate limit configurations
const rateLimitConfigs = {
  // Trial init: 5 per hour per IP (prevent abuse)
  trialInit: { limit: 5, windowMs: 60 * 60 * 1000 }, // 1 hour

  // Activation: 10 per hour per license key
  activate: { limit: 10, windowMs: 60 * 60 * 1000 }, // 1 hour

  // Validation: 60 per hour per device (normal app usage)
  validate: { limit: 60, windowMs: 60 * 60 * 1000 }, // 1 hour

  // Recovery: 3 per hour per email (prevent spam)
  recover: { limit: 3, windowMs: 60 * 60 * 1000 }, // 1 hour

  // IAP verification: 20 per hour per device
  iapVerify: { limit: 20, windowMs: 60 * 60 * 1000 }, // 1 hour
} as const;

export type RateLimitType = keyof typeof rateLimitConfigs;

/**
 * Check rate limit for a specific endpoint and identifier using PostgreSQL.
 * Uses a sliding window approach.
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
  const config = rateLimitConfigs[type];
  const key = `${type}:${identifier}`;
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  // Count requests in the current window
  const count = await prisma.rateLimitEntry.count({
    where: {
      key,
      timestamp: { gte: windowStart },
    },
  });

  const remaining = Math.max(0, config.limit - count);
  const success = count < config.limit;

  // If under limit, record this request
  if (success) {
    await prisma.rateLimitEntry.create({
      data: { key, timestamp: now },
    });
  }

  // Calculate reset time (end of current window)
  const reset = Math.ceil((windowStart.getTime() + config.windowMs) / 1000);

  return {
    success,
    limit: config.limit,
    remaining: success ? remaining - 1 : 0,
    reset,
  };
}

/**
 * Clean up expired rate limit entries.
 * Call this periodically (e.g., via cron job or after each request with low probability).
 */
export async function cleanupExpiredEntries(): Promise<number> {
  // Delete entries older than the longest window (1 hour)
  const cutoff = new Date(Date.now() - 60 * 60 * 1000);

  const result = await prisma.rateLimitEntry.deleteMany({
    where: {
      timestamp: { lt: cutoff },
    },
  });

  return result.count;
}

/**
 * Probabilistic cleanup - runs cleanup with 1% chance on each call.
 * This keeps the table small without needing a separate cron job.
 */
export async function maybeCleanup(): Promise<void> {
  if (Math.random() < 0.01) {
    // 1% chance
    await cleanupExpiredEntries().catch((err) => {
      console.error('Rate limit cleanup error:', err);
    });
  }
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
