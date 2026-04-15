"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const agreementNav = [
  { label: "All Agreements", href: "/portal/contracts" },
  { label: "Create Agreement", href: "/portal/contracts/new" },
  { label: "Pending Agreements", href: "/portal/contracts/pending" },
  { label: "Expired Agreements", href: "/portal/contracts/expired" },
  { label: "Agreement Templates", href: "/portal/contracts/templates" },
  { label: "Agreement History", href: "/portal/contracts/history" },
];

export default function ContractsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-[#dbe4eb] bg-white p-3">
        <div className="flex flex-wrap gap-2">
          {agreementNav.map((item) => {
            const active =
              (item.href === "/portal/contracts" && pathname === "/portal/contracts") ||
              (item.href === "/portal/contracts/new" && pathname === "/portal/contracts/new") ||
              (item.href === "/portal/contracts/pending" && pathname === "/portal/contracts/pending") ||
              (item.href === "/portal/contracts/expired" && pathname === "/portal/contracts/expired") ||
              (item.href === "/portal/contracts/templates" && pathname === "/portal/contracts/templates") ||
              (item.href === "/portal/contracts/history" && pathname === "/portal/contracts/history");

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
