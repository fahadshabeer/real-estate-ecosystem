"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const inventoryNav = [
  { label: "All Properties", href: "/portal/properties" },
  { label: "Add Property", href: "/portal/properties/new" },
  { label: "Bulk Upload", href: "/portal/properties/bulk-upload" },
  { label: "Shared Inventory", href: "/portal/properties/shared" },
  { label: "Reserved / Sold Units", href: "/portal/properties/reserved-sold" },
  { label: "Archived Units", href: "/portal/properties/archived" },
];

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-[#dbe4eb] bg-white p-3">
        <div className="flex flex-wrap gap-2">
          {inventoryNav.map((item) => {
            const active = pathname === item.href;
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
