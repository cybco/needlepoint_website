import { Metadata } from "next";
import { auth } from "@/auth";
import { getOrderSummary } from "@/lib/actions/order.actions";
import { getAnalyticsSummary } from "@/lib/actions/analytics.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeDollarSign, Barcode, CreditCard, Users } from "lucide-react";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import Charts from "./charts";
import AnalyticsSection from "./analytics-section";
import { requireAdmin } from "@/lib/auth-guard";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

const VALID_DAYS = [30, 60, 90, 180, 365];

interface PageProps {
  searchParams: Promise<{ days?: string }>;
}

const AdminOverviewPage = async ({ searchParams }: PageProps) => {
  await requireAdmin();
  const session = await auth();
  if (session?.user.role !== "admin") {
  }

  const params = await searchParams;
  const requestedDays = parseInt(params.days || "30", 10);
  const days = VALID_DAYS.includes(requestedDays) ? requestedDays : 30;

  const [summary, analytics] = await Promise.all([
    getOrderSummary(),
    getAnalyticsSummary(days),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="h2-bold">Admin Dashboard</h1>

      {/* Sales Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <BadgeDollarSign />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalSales._sum.totalPrice?.toString() || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <CreditCard />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.ordersCount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.usersCount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Barcode />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.ordersCount)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Charts data={{ salesData: summary.salesData }} />
        </CardContent>
      </Card>

      {/* Analytics Section with Dropdown */}
      <AnalyticsSection analytics={analytics} days={days} />

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.latestSales.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order?.User?.firstName ? order.User.firstName : "Deleted User"}</TableCell>
                  <TableCell>{formatDateTime(order.createdAt).dateOnly}</TableCell>
                  <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
                  <TableCell>
                    <Link href={`/order/${order.id}`}>
                      <span className="px-2">Details</span>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverviewPage;
