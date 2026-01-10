import { Metadata } from "next";
import { getAllUsers, deleteUser } from "@/lib/actions/user.actions";
import { requireAdmin } from "@/lib/auth-guard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DeleteDialog from "@/components/shared/delete-dialog";
import Pagination from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { formatId } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import ViewUserDialog from "./view-user-dialog";
import SuspendButton from "./suspend-button";

export const metadata: Metadata = {
  title: "Admin | Users",
};

const AdminUserPage = async (props: {
  searchParams: Promise<{
    page: string;
    query: string;
  }>;
}) => {
  await requireAdmin();
  
  const { page = "1", query: searchText } = await props.searchParams;

  const users = await getAllUsers({ page: Number(page), query: searchText });
  
  // Handle error case
  if (!users.data) {
    return <div>Error loading users</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <h1 className="h2-bold">Users</h1>
        {searchText && (
          <div className="mt-2 ml-2">
            Filtered by <i>&quot;{searchText}&quot;</i>{" "}
            <Link href="/admin/users">
              <Button variant="outline" size="sm" className="ml-2">
                Clear Filter
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>FIRST NAME</TableHead>
              <TableHead>LAST NAME</TableHead>
              <TableHead>EMAIL</TableHead>
              <TableHead>ROLE</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.data.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{formatId(user.id)}</TableCell>
                <TableCell>{user.firstName}</TableCell>
                <TableCell>{user.lastName || '-'}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.role === "user" ? (
                    <Badge variant="secondary">User</Badge>
                  ) : (
                    <Badge variant="default"> Admin </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {user.isActive ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="destructive">Suspended</Badge>
                  )}
                </TableCell>
                <TableCell className="flex gap-2">
                  <ViewUserDialog user={user} />
                  <Button variant="outline" size="sm">
                    <Link href={`/admin/users/${user.id}`}>Edit</Link>
                  </Button>
                  <SuspendButton userId={user.id} isActive={user.isActive} />
                  <DeleteDialog id={user.id} action={deleteUser} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {users.totalPages && users.totalPages > 1 && (
          <Pagination page={Number(page) || 1} totalPages={users.totalPages} />
        )}
      </div>
    </div>
  );
};

export default AdminUserPage;
