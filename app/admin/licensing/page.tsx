import { Metadata } from "next";
import { getLicensesGroupedByEmail, getLicenseStats } from "@/lib/actions/licensing.actions";
import { requireAdmin } from "@/lib/auth-guard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Admin | Licensing",
};

function maskLicenseKey(key: string): string {
  const parts = key.split('-');
  if (parts.length !== 5) return key;
  return `${parts[0]}-****-****-****-${parts[4]}`;
}

const AdminLicensingPage = async (props: {
  searchParams: Promise<{
    page: string;
    query: string;
  }>;
}) => {
  await requireAdmin();

  const { page = "1", query: searchText } = await props.searchParams;

  const [licensesResult, statsResult] = await Promise.all([
    getLicensesGroupedByEmail({ page: Number(page), query: searchText }),
    getLicenseStats(),
  ]);

  if (!licensesResult.data) {
    return <div>Error loading licenses</div>;
  }

  const stats = statsResult.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="h2-bold">Licensing</h1>
        {searchText && (
          <div className="mt-2 ml-2">
            Filtered by <i>&quot;{searchText}&quot;</i>{" "}
            <Link href="/admin/licensing">
              <Button variant="outline" size="sm" className="ml-2">
                Clear Filter
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Licenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLicenses}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeLicenses} active, {stats.revokedLicenses} revoked
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDevices}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recentActivations} in last 30 days
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">By Platform</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Windows</span>
                  <span className="font-medium">{stats.windows}</span>
                </div>
                <div className="flex justify-between">
                  <span>macOS</span>
                  <span className="font-medium">{stats.macos}</span>
                </div>
                <div className="flex justify-between">
                  <span>iPad</span>
                  <span className="font-medium">{stats.ios}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Licenses Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>EMAIL</TableHead>
              <TableHead className="text-center">LICENSES</TableHead>
              <TableHead>SOURCE</TableHead>
              <TableHead className="text-center">AVAILABLE</TableHead>
              <TableHead className="text-center">WIN</TableHead>
              <TableHead className="text-center">MAC</TableHead>
              <TableHead className="text-center">IPAD</TableHead>
              <TableHead>LAST ACTIVE</TableHead>
              <TableHead>STATUS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {licensesResult.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No licenses found
                </TableCell>
              </TableRow>
            ) : (
              licensesResult.data.map((license) => (
                <TableRow key={license.email}>
                  <TableCell className="font-medium">{license.email}</TableCell>
                  <TableCell className="text-center">{license.licenseCount}</TableCell>
                  <TableCell>
                    {license.sources.map((source) => (
                      <Badge key={source} variant="outline" className="mr-1">
                        {source}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell className="text-center">
                    {license.totalInstalls} / {license.maxDevices}
                  </TableCell>
                  <TableCell className="text-center">{license.windowsInstalls}</TableCell>
                  <TableCell className="text-center">{license.macosInstalls}</TableCell>
                  <TableCell className="text-center">{license.iosInstalls}</TableCell>
                  <TableCell>
                    {license.lastInstalled
                      ? formatDateTime(license.lastInstalled).dateTime
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {license.someRevoked && !license.allActive ? (
                      <Badge variant="secondary">Partial</Badge>
                    ) : license.allActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Revoked</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {licensesResult.totalPages && licensesResult.totalPages > 1 && (
          <Pagination page={Number(page) || 1} totalPages={licensesResult.totalPages} />
        )}
      </div>
    </div>
  );
};

export default AdminLicensingPage;
