"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const projectNav = [
  { label: "All Projects", href: "/portal/projects" },
  { label: "Add New Project", href: "/portal/projects/new" },
  { label: "Project Phases", href: "/portal/projects/phases" },
  { label: "Project Documents", href: "/portal/projects/documents" },
  { label: "Archived Projects", href: "/portal/projects/archived" },
];

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-[#dbe4eb] bg-white p-3">
        <div className="flex flex-wrap gap-2">
          {projectNav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href === "/portal/projects" &&
                (pathname.startsWith("/portal/projects/") || pathname === "/portal/projects"));
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
