import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUserById } from "@/lib/actions/user.actions";
import UpdateUserForm from "./update-user-form";
import { requireAdmin } from "@/lib/auth-guard";

export const metadata: Metadata = {
  title: "Update User",
};

const AdminUserUpdate = async (props: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await props.params;
  const user = await getUserById(id);
  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <h1 className="h2-bold">Update User</h1>
      <UpdateUserForm user={{
        id: user.id,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
        lastName: user.lastName ?? undefined,
        phone: user.phone ?? undefined,
        streetAddressHouseNumStreet: user.streetAddressHouseNumStreet ?? undefined,
        streetAddressLine2: user.streetAddressLine2 ?? undefined,
        city: user.city ?? undefined,
        State: user.State ?? undefined,
        zip: user.zip ?? undefined,
      }} />
    </div>
  );
};

export default AdminUserUpdate;
