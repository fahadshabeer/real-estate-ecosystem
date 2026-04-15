"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { label: "All Agents", href: "/broker/agents" },
  { label: "Add Agent", href: "/broker/agents/new" },
  { label: "Assigned Properties", href: "/broker/agents/assigned" },
  { label: "Performance", href: "/broker/agents/performance" },
  { label: "Disabled Agents", href: "/broker/agents/disabled" },
];

function isActive(pathname: string, href: string) {
  if (href === "/broker/agents") return pathname === href;
  return pathname.startsWith(href);
}

export default function BrokerAgentsLayout({ children }: { children: React.ReactNode }) {
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
