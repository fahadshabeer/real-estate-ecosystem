"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const inventoryNav = [
  { label: "All Properties", href: "/broker/properties" },
  { label: "By Developer", href: "/broker/properties/by-developer" },
  { label: "By Project", href: "/broker/properties/by-project" },
  { label: "Available Units", href: "/broker/properties/available" },
  { label: "Reserved / Sold", href: "/broker/properties/reserved-sold" },
  { label: "Assigned to Agents", href: "/broker/properties/assigned" },
];

export default function BrokerInventoryLayout({ children }: { children: React.ReactNode }) {
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
