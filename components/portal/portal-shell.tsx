"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  FileText,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Search,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
  { label: "Broker Companies", href: "/portal/brokers", icon: Building2 },
  { label: "Contracts", href: "/portal/contracts", icon: FileText },
  { label: "Properties", href: "/portal/properties", icon: Building2 },
  { label: "Statistics", href: "/portal/statistics", icon: LineChart },
  { label: "Settings", href: "/portal/settings", icon: Settings },
];

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_5%_0%,rgba(30,64,175,0.35),transparent_35%),radial-gradient(circle_at_100%_100%,rgba(5,150,105,0.22),transparent_40%)]">
      <div className="mx-auto flex max-w-[1600px] gap-5 p-4 md:p-6">
        <aside className="hidden w-72 shrink-0 rounded-3xl surface-glass p-5 lg:block">
          <Link href="/" className="mb-8 flex items-center gap-2">
            <span className="rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 p-2 text-white">
              <LayoutDashboard className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-semibold">EstateFlow</span>
          </Link>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                    active
                      ? "bg-gradient-to-r from-blue-600/40 to-emerald-500/30 text-white"
                      : "text-slate-300 hover:bg-slate-500/20"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 border-t border-slate-500/25 pt-4">
            <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-500/20">
              <LogOut className="h-4 w-4" />
              Logout
            </Link>
          </div>
        </aside>

        <div className="flex-1">
          <header className="mb-5 rounded-2xl surface-glass p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-3 md:justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="rounded-lg border border-slate-500/30 p-2 lg:hidden"
                  aria-label="Toggle menu"
                >
                  {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </button>
                <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-500/30 bg-slate-900/60 px-3 py-2">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                    placeholder="Search properties, brokers, contracts..."
                  />
                </div>
              </div>

              <div className="ml-auto flex items-center gap-3">
                <button className="rounded-xl border border-slate-500/30 bg-slate-900/70 p-2.5 text-slate-200">
                  <Bell className="h-4 w-4" />
                </button>
                <button className="rounded-xl border border-slate-500/30 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
                  Developer Admin
                </button>
              </div>
            </div>

            {menuOpen && (
              <nav className="mt-4 grid gap-2 rounded-xl border border-slate-500/30 bg-slate-900/70 p-3 lg:hidden">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                        active ? "bg-blue-500/25 text-white" : "text-slate-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </header>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
