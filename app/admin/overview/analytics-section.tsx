"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Users, Globe, Clock } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import AnalyticsCharts from "./analytics-charts";
import type { AnalyticsSummary } from "@/lib/actions/analytics.actions";

const TIMEFRAME_OPTIONS = [
  { value: "30", label: "Last 30 days" },
  { value: "60", label: "Last 60 days" },
  { value: "90", label: "Last 90 days" },
  { value: "180", label: "Last 6 months" },
  { value: "365", label: "Last year" },
];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function getTimeframeLabel(days: number): string {
  const option = TIMEFRAME_OPTIONS.find((o) => o.value === String(days));
  return option?.label || `Last ${days} days`;
}

interface AnalyticsSectionProps {
  analytics: AnalyticsSummary;
  days: number;
}

export default function AnalyticsSection({ analytics, days }: AnalyticsSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTimeframeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", value);
    router.push(`/admin/overview?${params.toString()}`);
  };

  const timeframeLabel = getTimeframeLabel(days);

  return (
    <>
      {/* Analytics Header with Dropdown */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Analytics</h2>
        <Select value={String(days)} onValueChange={handleTimeframeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            {TIMEFRAME_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Analytics Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalPageViews)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalUniqueVisitors)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions Today</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalSessionsToday)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(analytics.avgSessionDuration)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Overview ({timeframeLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsCharts data={analytics.dailyData} />
        </CardContent>
      </Card>

      {/* Analytics Tables Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.topPages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No data yet
                    </TableCell>
                  </TableRow>
                ) : (
                  analytics.topPages.map((page) => (
                    <TableRow key={page.pathname}>
                      <TableCell className="font-mono text-sm truncate max-w-[200px]">
                        {page.pathname}
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(page.views)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.topReferrers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No data yet
                    </TableCell>
                  </TableRow>
                ) : (
                  analytics.topReferrers.map((ref) => (
                    <TableRow key={ref.referrerDomain}>
                      <TableCell className="truncate max-w-[200px]">
                        {ref.referrerDomain}
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(ref.sessions)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.geoData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No data yet
                    </TableCell>
                  </TableRow>
                ) : (
                  analytics.geoData.map((geo) => (
                    <TableRow key={geo.country}>
                      <TableCell>{geo.country}</TableCell>
                      <TableCell className="text-right">{formatNumber(geo.sessions)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
