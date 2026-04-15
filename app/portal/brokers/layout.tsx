"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const brokerNav = [
  { label: "All Brokers", href: "/portal/brokers" },
  { label: "Invite Broker", href: "/portal/brokers/new" },
  { label: "Broker Requests", href: "/portal/brokers/requests" },
  { label: "Broker Ranking", href: "/portal/brokers/ranking" },
  { label: "Suspended Brokers", href: "/portal/brokers/suspended" },
  { label: "Broker Profiles", href: "/portal/brokers/profiles" },
];

export default function BrokerNetworkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const reservedRoutes = new Set(["new", "requests", "ranking", "suspended", "profiles"]);
  const maybeBrokerSlug = pathname.startsWith("/portal/brokers/")
    ? pathname.replace("/portal/brokers/", "").split("/")[0]
    : "";
  const isBrokerDetail = Boolean(
    maybeBrokerSlug &&
      !reservedRoutes.has(maybeBrokerSlug) &&
      pathname.split("/").filter(Boolean).length === 3,
  );

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-[#dbe4eb] bg-white p-3">
        <div className="flex flex-wrap gap-2">
          {brokerNav.map((item) => {
            const active =
              (item.href === "/portal/brokers" && pathname === "/portal/brokers") ||
              (item.href === "/portal/brokers/new" && pathname === "/portal/brokers/new") ||
              (item.href === "/portal/brokers/requests" && pathname === "/portal/brokers/requests") ||
              (item.href === "/portal/brokers/ranking" && pathname === "/portal/brokers/ranking") ||
              (item.href === "/portal/brokers/suspended" && pathname === "/portal/brokers/suspended") ||
              (item.href === "/portal/brokers/profiles" &&
                (pathname === "/portal/brokers/profiles" || isBrokerDetail));
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
