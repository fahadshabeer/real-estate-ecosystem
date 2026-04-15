"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { label: "Monthly Reports", href: "/portal/reports" },
  { label: "Broker Reports", href: "/portal/reports/brokers" },
  { label: "Project Reports", href: "/portal/reports/projects" },
  { label: "Agreement Reports", href: "/portal/reports/agreements" },
  { label: "Inventory Reports", href: "/portal/reports/inventory" },
  { label: "Custom Reports", href: "/portal/reports/custom" },
  { label: "Exports Center", href: "/portal/reports/exports" },
];

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-[#dbe4eb] bg-white p-3">
        <div className="flex flex-wrap gap-2">
          {nav.map((item) => {
            const active =
              (item.href === "/portal/reports" && pathname === "/portal/reports") || pathname === item.href;
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
