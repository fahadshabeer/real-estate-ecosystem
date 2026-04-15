"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { label: "All Developers", href: "/broker/developers" },
  { label: "Developer Search", href: "/broker/developers/search" },
  { label: "Requests Sent", href: "/broker/developers/requests" },
  { label: "Connected Developers", href: "/broker/developers/connected" },
  { label: "Suspended Connections", href: "/broker/developers/suspended" },
  { label: "Developer Profiles", href: "/broker/developers/profiles" },
];

export default function BrokerDevelopersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-[#dbe4eb] bg-white p-3">
        <div className="flex flex-wrap gap-2">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href === "/broker/developers" && pathname === "/broker/developers/");
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

