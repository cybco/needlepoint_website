"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Search } from "lucide-react";

const AdminSearch = () => {
  const pathname = usePathname();
  const formActionUrl = pathname.includes("/admin/orders")
    ? "/admin/orders"
    : pathname.includes("/admin/users")
      ? "/admin/users"
      : "/admin/products";

  const searchParams = useSearchParams();
  const [queryValue, setQueryValue] = useState(searchParams.get("query") || "");
  useEffect(() => {
    setQueryValue(searchParams.get("query") || "");
  }, [searchParams]);
  return (
    <form action={formActionUrl} method="GET">
      <div className="flex grid-cols-2 gap-2 items-end">
        <div>
          <Input
            type="search"
            placeholder="Search..."
            name="query"
            value={queryValue}
            onChange={(e) => setQueryValue(e.target.value)}
            className="md:w-[100px] lg:w-[300px]"
          />
        </div>

        <div>
          <button type="submit">
            <Search className="mr-5" />
          </button>
        </div>
      </div>
    </form>
  );
};

export default AdminSearch;
