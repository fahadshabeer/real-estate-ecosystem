"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { label: "Pending Approvals", href: "/portal/sales-control" },
  { label: "Approved Sales", href: "/portal/sales-control/approved" },
  { label: "Rejected Sales", href: "/portal/sales-control/rejected" },
  { label: "Sales Timeline", href: "/portal/sales-control/timeline" },
  { label: "Disputes", href: "/portal/sales-control/disputes" },
  { label: "Sales Attribution", href: "/portal/sales-control/attribution" },
];

export default function SalesControlLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-[#dbe4eb] bg-white p-3">
        <div className="flex flex-wrap gap-2">
          {nav.map((item) => {
            const active =
              (item.href === "/portal/sales-control" && pathname === "/portal/sales-control") ||
              pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm ${
                  active
                    ? "bg-[#3aa4a8] font-semibold text-white"
                    : "border border-[#dbe4eb] bg-white text-[#607187] hover:bg-[#f5f9fb]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </section>
      {children}
    </div>
  );
}
