"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Building2, ChevronDown, LogOut, Menu, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAppContext } from "@/components/state/app-context";
import { useNotifications } from "@/hooks/use-activity";
import { useSignOutSession } from "@/hooks/use-auth-session";
import { useCompanyProfile } from "@/hooks/use-company-profile";
import { companyRepository } from "@/lib/backend/factory";
import { classifyNotification, priorityChipClasses } from "@/lib/ui/activity-classification";
import { hasPermission } from "@/lib/auth/roles";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
};

function isNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/") return pathname === "/";
  // Base dashboard routes should only match exactly, not all children.
  if (href === "/portal" || href === "/broker") return false;
  return pathname.startsWith(`${href}/`);
}

export function AppShell({
  role,
  brand,
  navItems,
  children,
}: {
  role: "developer" | "broker";
  brand: string;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [panelPosition, setPanelPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [results, setResults] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [searching, setSearching] = useState(false);

  const notificationRef = useRef<HTMLDivElement | null>(null);
  const notificationButtonRef = useRef<HTMLButtonElement | null>(null);
  const notificationPanelRef = useRef<HTMLDivElement | null>(null);

  const { currentUser, logout } = useAppContext();
  const signOutMutation = useSignOutSession();
  const notificationsQuery = useNotifications(role, currentUser?.companyId);
  const companyQuery = useCompanyProfile(currentUser?.companyId);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      void (async () => {
        try {
          setSearching(true);
          const rows = await companyRepository.searchCompanies(
            role === "developer" ? "broker" : "developer",
            trimmed,
            20,
          );
          setResults(rows.map((row) => ({ id: row.id, name: row.name, status: row.status })));
        } catch {
          setResults([]);
        } finally {
          setSearching(false);
        }
      })();
    }, 250);
    return () => clearTimeout(timer);
  }, [query, role]);

  useEffect(() => {
    setNotificationsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const inButtonArea = notificationRef.current?.contains(target);
      const inPanelArea = notificationPanelRef.current?.contains(target);
      if (!inButtonArea && !inPanelArea) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [notificationsOpen]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return;

    const updatePosition = () => {
      const rect = notificationButtonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const panelWidth = 360;
      const margin = 12;
      const maxLeft = window.innerWidth - panelWidth - margin;
      const nextLeft = Math.max(margin, Math.min(rect.right - panelWidth, maxLeft));
      setPanelPosition({ top: rect.bottom + 8, left: nextLeft });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [notificationsOpen]);

  const roleNotifications = notificationsQuery.data ?? [];
  const readStateKey = currentUser?.id ? `estateflow_notifications_read_${role}_${currentUser.id}` : null;

  useEffect(() => {
    if (!readStateKey || typeof window === "undefined") return;
    const saved = window.localStorage.getItem(readStateKey);
    setLastReadAt(saved);
  }, [readStateKey]);

  const unreadCount = roleNotifications.filter((notification) => {
    if (!lastReadAt) return true;
    const readAtMs = new Date(lastReadAt).getTime();
    const createdAtMs = new Date(notification.createdAt).getTime();
    return Number.isFinite(createdAtMs) && createdAtMs > readAtMs;
  }).length;

  const markAllAsRead = () => {
    const nowIso = new Date().toISOString();
    setLastReadAt(nowIso);
    if (readStateKey && typeof window !== "undefined") {
      window.localStorage.setItem(readStateKey, nowIso);
    }
  };

  const companyName = companyQuery.data?.name ?? brand;
  const companyLogoUrl = companyQuery.data?.logoUrl;
  const userPermissions = currentUser?.permissions ?? [];
  const visibleNavItems = navItems.filter((item) => !item.permission || hasPermission(userPermissions, item.permission));

  useEffect(() => {
    if (!visibleNavItems.length) return;
    const canAccessCurrent = visibleNavItems.some((item) => isNavActive(pathname, item.href) || pathname === item.href);
    if (!canAccessCurrent) {
      router.replace(visibleNavItems[0].href);
    }
  }, [pathname, router, visibleNavItems]);

  const quickActionHref = (message: string) => {
    const base = role === "developer" ? "/portal" : "/broker";
    const text = message.toLowerCase();
    if (text.includes("agreement") || text.includes("contract")) return `${base}/agreements`;
    if (role === "developer" && text.includes("broker")) return "/portal/brokers";
    if (role === "broker" && text.includes("developer")) return "/broker/developers";
    if (text.includes("property") || text.includes("inventory") || text.includes("unit")) return `${base}/properties`;
    if (role === "developer" && (text.includes("sale") || text.includes("approval") || text.includes("dispute"))) return "/portal/sales-control";
    if (role === "broker" && (text.includes("sale") || text.includes("approval") || text.includes("dispute"))) return "/broker/sales";
    return `${base}/notifications`;
  };

  return (
    <div className="app-light min-h-screen bg-[#f4f6f9] text-[#1f2a44]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[255px] shrink-0 border-r border-[#e5eaef] bg-[#f8fafc] lg:flex lg:flex-col">
          <div className="border-b border-[#e5eaef] px-5 py-6">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#d2e5e8] bg-[#e9f6f7] text-[#2fa5a6]">
                {companyLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={companyLogoUrl} alt="Company logo" className="h-full w-full rounded-xl object-cover" />
                ) : (
                  <Building2 className="h-5 w-5" />
                )}
              </span>
              <div>
                <p className="text-sm font-extrabold tracking-[0.1em] text-[#36434f]">YOUFIRST</p>
                <p className="text-[11px] text-[#7f8a99]">{companyName}</p>
              </div>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            <nav className="space-y-1.5">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                      active
                        ? "bg-[#3aa4a8] text-white shadow-sm"
                        : "text-[#728195] hover:bg-[#ecf2f5] hover:text-[#22324f]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-[#e5eaef] bg-[#f8fafc] px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="rounded-lg border border-[#dbe4eb] bg-white p-2 lg:hidden"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>

              <div className="relative max-w-[540px] flex-1">
                <div className="flex items-center gap-2 rounded-lg border border-[#dbe4eb] bg-white px-3 py-2.5">
                  <Search className="h-4 w-4 text-[#7f8a99]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
                    placeholder="Search anything anywhere"
                  />
                </div>
                {!!query && (
                  <div className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-lg border border-[#dbe4eb] bg-white p-2 shadow-xl">
                    {searching ? (
                      <p className="rounded p-2 text-sm text-[#7f8a99]">Searching...</p>
                    ) : results.length === 0 ? (
                      <p className="rounded p-2 text-sm text-[#7f8a99]">No companies found.</p>
                    ) : (
                      results.map((item) => (
                        <div key={item.id} className="rounded border border-[#ecf1f5] bg-[#f9fbfc] p-2.5 text-sm">
                          <p className="font-semibold text-[#21304a]">{item.name}</p>
                          <p className="text-xs text-[#7f8a99]">
                            {item.id} · {item.status}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="ml-auto flex items-center gap-3">
                <button className="inline-flex items-center gap-1 rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-sm font-semibold text-[#1f2a44]">
                  ENG <ChevronDown className="h-3.5 w-3.5" />
                </button>

                <div className="relative" ref={notificationRef}>
                  <button
                    type="button"
                    ref={notificationButtonRef}
                    onClick={() => setNotificationsOpen((prev) => !prev)}
                    aria-haspopup="dialog"
                    aria-expanded={notificationsOpen}
                    aria-label="Toggle notifications"
                    className="rounded-md border border-[#dbe4eb] bg-white p-2.5 text-[#1f2a44] transition hover:bg-[#f5f9fb]"
                  >
                    <Bell className="h-5 w-5" />
                  </button>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 rounded-full bg-[#3aa4a8] px-1.5 text-[10px] font-semibold text-white">
                      {unreadCount}
                    </span>
                  )}

                  {notificationsOpen &&
                    isMounted &&
                    createPortal(
                      <div
                        ref={notificationPanelRef}
                        className="fixed z-[220] w-[360px] overflow-hidden rounded-xl border border-[#dbe4eb] bg-white shadow-2xl"
                        style={{ top: panelPosition.top, left: panelPosition.left }}
                      >
                        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-4 py-3">
                          <p className="text-sm font-semibold text-[#1f2a44]">Notifications</p>
                          <button type="button" onClick={markAllAsRead} className="text-xs font-medium text-[#3aa4a8]">
                            Mark all as read
                          </button>
                        </div>
                        <div className="max-h-80 overflow-auto p-2">
                          {notificationsQuery.isLoading && (
                            <p className="rounded p-2 text-sm text-[#7f8a99]">Loading notifications...</p>
                          )}
                          {notificationsQuery.isError && (
                            <p className="rounded p-2 text-sm text-rose-600">Unable to load notifications.</p>
                          )}
                          {!notificationsQuery.isLoading &&
                            !notificationsQuery.isError &&
                            roleNotifications.length === 0 && (
                              <p className="rounded p-2 text-sm text-[#7f8a99]">No notifications yet.</p>
                            )}
                          {!notificationsQuery.isLoading &&
                            !notificationsQuery.isError &&
                            roleNotifications.slice(0, 12).map((notification) => {
                              const meta = classifyNotification(notification);
                              return (
                              <div key={notification.id} className="mb-1 rounded-lg border border-[#ecf1f5] bg-[#fbfdfe] p-2.5 last:mb-0">
                                <div className="flex items-start gap-2">
                                  <span
                                    className={`mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                                      !lastReadAt ||
                                      new Date(notification.createdAt).getTime() > new Date(lastReadAt).getTime()
                                        ? "bg-[#3aa4a8]"
                                        : "bg-[#c3ccd8]"
                                    }`}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm text-[#28354f]">{notification.message}</p>
                                    <div className="mt-1 flex items-center gap-2">
                                      <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold capitalize ${priorityChipClasses(meta.priority)}`}>
                                        {meta.priority}
                                      </span>
                                      <Link href={quickActionHref(notification.message)} className="text-[10px] font-semibold text-[#3aa4a8]">
                                        Open
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                                <p className="mt-1 text-[11px] text-[#7f8a99]">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </p>
                              </div>
                            );})}
                        </div>
                      </div>,
                      document.body,
                    )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void logout();
                    signOutMutation.mutate();
                  }}
                  className="inline-flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-4 py-2 text-sm font-medium text-[#7f8a99] hover:text-[#22324f]"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </div>

            {menuOpen && (
              <nav className="mt-3 grid gap-2 rounded-xl border border-[#dbe4eb] bg-white p-3 lg:hidden">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isNavActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                        active ? "bg-[#3aa4a8] text-white" : "text-[#64748b]"
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

          <main className="px-4 py-5 md:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
