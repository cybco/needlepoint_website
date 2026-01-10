import { APP_NAME } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import Menu from "@/components/shared/header/menu";
import MainNav from "./main-nav";
import AdminSearch from "@/components/admin/admin-search";
import { Suspense } from "react";

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="flex flex-col">
        <div className="border-b container mx-auto">
          <div className="flex items-center h-16 px-4">
            <Link href="/">
              <Image src="/images/logo.svg" height={48} width={48} alt={APP_NAME}></Image>
            </Link>

            <MainNav className="mx-6 pl-20"></MainNav>

            <div className="ml-auto items-center flex space-x-4">
              <div>
                <Suspense fallback={<div>Loading...</div>}>
                  <AdminSearch />
                </Suspense>
              </div>
              <Menu />
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-4 p-8 pt-6 container mx-auto">{children}</div>
      </div>
    </>
  );
}
