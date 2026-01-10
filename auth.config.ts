/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

// Paths to exclude from analytics tracking
const EXCLUDED_TRACKING_PATHS = [
  /^\/_next/,
  /^\/api/,
  /^\/admin/,
  /^\/favicon\.ico$/,
  /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$/i,
];

function shouldTrack(pathname: string): boolean {
  return !EXCLUDED_TRACKING_PATHS.some((pattern) => pattern.test(pathname));
}

async function trackPageView(
  request: any,
  sessionCartId: string
): Promise<void> {
  const analyticsSecret = process.env.ANALYTICS_SECRET;
  if (!analyticsSecret) return;

  const { pathname, search } = request.nextUrl;

  // Get IP from various headers (Vercel, Cloudflare, standard)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown";

  const userAgent = request.headers.get("user-agent") || undefined;
  const referrer = request.headers.get("referer") || undefined;

  // Vercel geo headers
  const country = request.headers.get("x-vercel-ip-country") || undefined;
  const region = request.headers.get("x-vercel-ip-country-region") || undefined;
  const city = request.headers.get("x-vercel-ip-city") || undefined;

  // Get base URL for internal API call
  const baseUrl = request.nextUrl.origin;

  // Fire non-blocking request to tracking endpoint
  fetch(`${baseUrl}/api/analytics/track`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-analytics-secret": analyticsSecret,
    },
    body: JSON.stringify({
      sessionCartId,
      pathname,
      searchParams: search || undefined,
      ip,
      userAgent,
      referrer,
      country,
      region,
      city,
    }),
  }).catch(() => {
    // Silent fail - analytics should never break the site
  });
}

export const authConfig = {
  providers: [], // Required by NextAuthConfig type
  callbacks: {
    authorized({ request, auth }: any) {
      // Array of regex patterns of paths we want to protect
      const protectedPaths = [
        /\/shipping-address/,
        /\/payment-method/,
        /\/place-order/,
        /\/profile/,
        /\/user\/(.*)/,
        /\/order\/(.*)/,
        /\/admin/,
      ];

      // Get pathname from the req URL object
      const { pathname } = request.nextUrl;
      // Check if user is not authenticated and accessing a protected path
      if (!auth && protectedPaths.some((p) => p.test(pathname))) return false;

      // Get or create session cart ID
      let sessionCartId = request.cookies.get("sessionCartId")?.value;
      let needsNewCookie = false;

      if (!sessionCartId) {
        sessionCartId = crypto.randomUUID();
        needsNewCookie = true;
      }

      // Track page view (non-blocking)
      if (shouldTrack(pathname)) {
        trackPageView(request, sessionCartId);
      }

      // If we need to set the cookie, create a response
      if (needsNewCookie) {
        const response = NextResponse.next({
          request: {
            headers: new Headers(request.headers),
          },
        });
        response.cookies.set("sessionCartId", sessionCartId);
        return response;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
