"use server";

import { prisma } from "@/db/prisma";

export type AnalyticsSummary = {
  totalPageViews: number;
  totalUniqueVisitors: number;
  totalSessionsToday: number;
  avgSessionDuration: number;
  dailyData: { date: string; pageViews: number; uniqueVisitors: number }[];
  topPages: { pathname: string; views: number }[];
  topReferrers: { referrerDomain: string; sessions: number }[];
  geoData: { country: string; sessions: number }[];
};

export async function getAnalyticsSummary(days = 30): Promise<AnalyticsSummary> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Run all queries in parallel for performance
  const [
    totalPageViews,
    uniqueVisitorsResult,
    totalSessionsToday,
    avgDurationResult,
    dailyDataResult,
    topPagesResult,
    topReferrersResult,
    geoDataResult,
  ] = await Promise.all([
    // Total page views in period
    prisma.pageView.count({
      where: {
        timestamp: { gte: startDate },
      },
    }),

    // Unique visitors (by IP hash)
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT "ipHash") as count
      FROM "VisitorSession"
      WHERE "firstSeenAt" >= ${startDate}
    `,

    // Sessions today
    prisma.visitorSession.count({
      where: {
        firstSeenAt: { gte: todayStart },
      },
    }),

    // Average session duration
    prisma.$queryRaw<[{ avg_duration: number | null }]>`
      SELECT AVG(EXTRACT(EPOCH FROM ("lastSeenAt" - "firstSeenAt"))) as avg_duration
      FROM "VisitorSession"
      WHERE "firstSeenAt" >= ${startDate}
        AND "lastSeenAt" > "firstSeenAt"
    `,

    // Daily page views and unique visitors
    prisma.$queryRaw<{ date: Date; page_views: bigint; unique_visitors: bigint }[]>`
      SELECT
        DATE_TRUNC('day', pv."timestamp") as date,
        COUNT(*) as page_views,
        COUNT(DISTINCT vs."ipHash") as unique_visitors
      FROM "PageView" pv
      JOIN "VisitorSession" vs ON pv."visitorSessionId" = vs."id"
      WHERE pv."timestamp" >= ${startDate}
      GROUP BY DATE_TRUNC('day', pv."timestamp")
      ORDER BY date ASC
    `,

    // Top 10 pages
    prisma.$queryRaw<{ pathname: string; views: bigint }[]>`
      SELECT "pathname", COUNT(*) as views
      FROM "PageView"
      WHERE "timestamp" >= ${startDate}
      GROUP BY "pathname"
      ORDER BY views DESC
      LIMIT 10
    `,

    // Top 10 referrer domains
    prisma.$queryRaw<{ referrer_domain: string | null; sessions: bigint }[]>`
      SELECT "referrerDomain" as referrer_domain, COUNT(*) as sessions
      FROM "VisitorSession"
      WHERE "firstSeenAt" >= ${startDate}
        AND "referrerDomain" IS NOT NULL
        AND "referrerDomain" != ''
      GROUP BY "referrerDomain"
      ORDER BY sessions DESC
      LIMIT 10
    `,

    // Top 10 countries
    prisma.$queryRaw<{ country: string | null; sessions: bigint }[]>`
      SELECT "country", COUNT(*) as sessions
      FROM "VisitorSession"
      WHERE "firstSeenAt" >= ${startDate}
        AND "country" IS NOT NULL
      GROUP BY "country"
      ORDER BY sessions DESC
      LIMIT 10
    `,
  ]);

  // Helper to format date as YYYY-MM-DD in local timezone
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Format daily data to fill in missing dates
  const dailyDataMap = new Map<string, { pageViews: number; uniqueVisitors: number }>();
  for (const row of dailyDataResult) {
    // Use local date format for consistency
    const dateStr = formatDateLocal(new Date(row.date));
    dailyDataMap.set(dateStr, {
      pageViews: Number(row.page_views),
      uniqueVisitors: Number(row.unique_visitors),
    });
  }

  // Fill in missing dates with zeros, including today
  const dailyData: { date: string; pageViews: number; uniqueVisitors: number }[] = [];
  const currentDate = new Date(startDate);
  const today = new Date();
  const todayStr = formatDateLocal(today);

  while (formatDateLocal(currentDate) <= todayStr) {
    const dateStr = formatDateLocal(currentDate);
    const data = dailyDataMap.get(dateStr) || { pageViews: 0, uniqueVisitors: 0 };
    dailyData.push({
      date: dateStr,
      ...data,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    totalPageViews,
    totalUniqueVisitors: Number(uniqueVisitorsResult[0]?.count || 0),
    totalSessionsToday,
    avgSessionDuration: Math.round(avgDurationResult[0]?.avg_duration || 0),
    dailyData,
    topPages: topPagesResult.map((row) => ({
      pathname: row.pathname,
      views: Number(row.views),
    })),
    topReferrers: topReferrersResult.map((row) => ({
      referrerDomain: row.referrer_domain || "Direct",
      sessions: Number(row.sessions),
    })),
    geoData: geoDataResult.map((row) => ({
      country: row.country || "Unknown",
      sessions: Number(row.sessions),
    })),
  };
}
