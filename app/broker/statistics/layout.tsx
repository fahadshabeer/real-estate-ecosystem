"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { label: "Sales Performance", href: "/broker/statistics" },
  { label: "Developer Contribution", href: "/broker/statistics/developer-contribution" },
  { label: "Agent Performance", href: "/broker/statistics/agent-performance" },
  { label: "Conversion Metrics", href: "/broker/statistics/conversion-metrics" },
  { label: "Project Analytics", href: "/broker/statistics/projects" },
  { label: "Executive Insights", href: "/broker/statistics/executive-insights" },
];

function isActive(pathname: string, href: string) {
  if (href === "/broker/statistics") return pathname === href;
  return pathname.startsWith(href);
}

export default function BrokerStatisticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="space-y-4">
      <section className="rounded-md border border-[#dbe4eb] bg-white p-3">
        <div className="flex flex-wrap gap-2">
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
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
