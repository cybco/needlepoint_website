import { Metadata } from "next";
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";
import ProfileForm from "./profile-form";
import { getUserById } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Customer Profile",
};

const Profile = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const user = await getUserById(session.user.id);

  return (
    <SessionProvider session={session}>
      <div className="max-w-2xl mx-auto space-y-4">
        <h2 className="h2-bold">Profile</h2>
        <ProfileForm
          user={{
            lastName: user.lastName || "",
            phone: user.phone || "",
            streetAddressHouseNumStreet: user.streetAddressHouseNumStreet || "",
            streetAddressLine2: user.streetAddressLine2 || "",
            city: user.city || "",
            State: user.State || "",
            zip: user.zip || "",
          }}
        />
      </div>
    </SessionProvider>
  );
};

export default Profile;
