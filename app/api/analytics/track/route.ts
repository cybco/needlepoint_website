import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/db/prisma";

const ANALYTICS_SECRET = process.env.ANALYTICS_SECRET;
const IP_HASH_SALT = process.env.IP_HASH_SALT || "default-salt";

interface TrackingPayload {
  sessionCartId: string;
  pathname: string;
  searchParams?: string;
  ip: string;
  userAgent?: string;
  referrer?: string;
  country?: string;
  region?: string;
  city?: string;
}

function extractDomain(referrer: string | undefined): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    return url.hostname;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Validate internal request
    const authHeader = req.headers.get("x-analytics-secret");
    if (!ANALYTICS_SECRET || authHeader !== ANALYTICS_SECRET) {
      return NextResponse.json({ ok: true }); // Silent fail for security
    }

    const body: TrackingPayload = await req.json();
    const {
      sessionCartId,
      pathname,
      searchParams,
      ip,
      userAgent,
      referrer,
      country,
      region,
      city,
    } = body;

    if (!sessionCartId || !pathname) {
      return NextResponse.json({ ok: true }); // Silent fail
    }

    // Hash IP for privacy
    const ipHash = crypto
      .createHash("sha256")
      .update(ip + IP_HASH_SALT)
      .digest("hex");

    const referrerDomain = extractDomain(referrer);

    // Upsert visitor session and create page view in transaction
    await prisma.$transaction(async (tx) => {
      const session = await tx.visitorSession.upsert({
        where: { sessionCartId },
        update: {
          lastSeenAt: new Date(),
          pageViewCount: { increment: 1 },
        },
        create: {
          sessionCartId,
          ipHash,
          userAgent: userAgent?.substring(0, 500), // Limit length
          referrer: referrer?.substring(0, 2000),
          referrerDomain,
          country,
          region,
          city,
          pageViewCount: 1,
        },
      });

      await tx.pageView.create({
        data: {
          visitorSessionId: session.id,
          pathname,
          searchParams: searchParams?.substring(0, 2000),
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Analytics tracking error:", error);
    return NextResponse.json({ ok: true }); // Silent fail
  }
}
