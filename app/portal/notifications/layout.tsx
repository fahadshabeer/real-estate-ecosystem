"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { label: "All Notifications", href: "/portal/notifications" },
  { label: "Contract Alerts", href: "/portal/notifications/contracts" },
  { label: "Broker Alerts", href: "/portal/notifications/brokers" },
  { label: "Inventory Alerts", href: "/portal/notifications/inventory" },
  { label: "Sales Alerts", href: "/portal/notifications/sales" },
  { label: "System Alerts", href: "/portal/notifications/system" },
  { label: "All Logs", href: "/portal/notifications/logs" },
  { label: "Agreement Logs", href: "/portal/notifications/logs/agreements" },
  { label: "Broker Logs", href: "/portal/notifications/logs/brokers" },
  { label: "Inventory Logs", href: "/portal/notifications/logs/inventory" },
  { label: "Sales Logs", href: "/portal/notifications/logs/sales" },
  { label: "System Logs", href: "/portal/notifications/logs/system" },
];

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-[#dbe4eb] bg-white p-3">
        <div className="flex flex-wrap gap-2">
          {nav.map((item) => {
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

