"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { label: "All Notifications", href: "/broker/notifications" },
  { label: "Developer Alerts", href: "/broker/notifications/developers" },
  { label: "Agreement Alerts", href: "/broker/notifications/agreements" },
  { label: "Inventory Alerts", href: "/broker/notifications/inventory" },
  { label: "Sales Alerts", href: "/broker/notifications/sales" },
  { label: "Agent Alerts", href: "/broker/notifications/agents" },
  { label: "System Alerts", href: "/broker/notifications/system" },
  { label: "All Logs", href: "/broker/notifications/logs" },
  { label: "Developer Logs", href: "/broker/notifications/logs/developers" },
  { label: "Agreement Logs", href: "/broker/notifications/logs/agreements" },
  { label: "Inventory Logs", href: "/broker/notifications/logs/inventory" },
  { label: "Sales Logs", href: "/broker/notifications/logs/sales" },
  { label: "Agent Logs", href: "/broker/notifications/logs/agents" },
  { label: "System Logs", href: "/broker/notifications/logs/system" },
];

export default function BrokerNotificationsLayout({ children }: { children: React.ReactNode }) {
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
