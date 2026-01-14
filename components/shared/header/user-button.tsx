import Link from "next/link";
import { auth } from "@/auth";
import { signOutUser } from "@/lib/actions/user.actions";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, ShoppingBag, Settings, LogOut } from "lucide-react";

const UserButton = async () => {
  const session = await auth();
  if (!session?.user) {
    return (
      <div className="flex gap-4 items-center">
        <Link href="/reset-password" className="text-sm hover:underline">
          Forgot Password
        </Link>
        <Link href="/sign-in" className="text-sm font-medium hover:underline">
          LOG IN
        </Link>
      </div>
    );
  }

  const firstInital = session.user?.name?.charAt(0).toUpperCase() ?? "U";

  return (
    <div className="flex gap-2 item-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center">
            <Button variant="ghost" className="relative w-8 h-8 rounded-full ml-2 items-center justify-center bg-gray-200">
              {firstInital}
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col sapce-y-1">
              <div className="text-small font-medium leading-none">{session.user?.name}</div>
            </div>
            <div className="flex flex-col sapce-y-1">
              <div className="text-small text-muted-foreground leading-none">{session.user?.email}</div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuItem>
            <Link href="/user/profile" className="w-full flex items-center gap-2">
              <User className="w-4 h-4" />
              User Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="/user/orders" className="w-full flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Order History
            </Link>
          </DropdownMenuItem>
          {session?.user?.role === "admin" && (
            <DropdownMenuItem>
              <Link href="/admin/overview" className="w-full flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Admin Area
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="p-0 mb-1">
            <form action={signOutUser}>
              <Button className="w-full py-4 px-2 h-4 justify-start" variant="ghost">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserButton;
