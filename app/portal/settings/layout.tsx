"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { label: "Company Profile", href: "/portal/settings" },
  { label: "Branding", href: "/portal/settings/branding" },
  { label: "Users & Roles", href: "/portal/settings/users-roles" },
  { label: "Security", href: "/portal/settings/security" },
  { label: "Legal Settings", href: "/portal/settings/legal-settings" },
  { label: "System Preferences", href: "/portal/settings/system-preferences" },
  { label: "Billing (Future)", href: "/portal/settings/billing" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
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

