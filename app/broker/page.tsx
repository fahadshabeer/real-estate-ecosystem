"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Home,
  Plus,
  Sparkles,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { useBrokerContractRequests } from "@/hooks/use-agreements";
import { useBrokerAnalytics } from "@/hooks/use-broker-analytics";
import { useActivityLogsPagination } from "@/hooks/use-activity";
import { useVisibleBrokerProperties } from "@/hooks/use-properties";
import { useBrokerSalesRequests } from "@/hooks/use-sales-control";
import { DeveloperCell } from "@/components/ui/developer-cell";

function shortMonthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return new Date(year, month - 1, 1).toLocaleString(undefined, { month: "short" });
}

function errorMessage(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return null;
}

export default function BrokerDashboardPage() {
  const { currentUser } = useAppContext();
  const [quickOpen, setQuickOpen] = useState(false);
  const quickMenuRef = useRef<HTMLDivElement | null>(null);
  const brokerId = currentUser?.companyId;

  const propertiesQuery = useVisibleBrokerProperties(brokerId);
  const requestsQuery = useBrokerContractRequests(brokerId);
  const salesQuery = useBrokerSalesRequests(brokerId);
  const activityQuery = useActivityLogsPagination({ role: "broker", actorLabel: brokerId, limit: 20 });
  const analytics = useBrokerAnalytics(brokerId);

  const brokerAgreements = analytics.agreements;
  const sharedProperties = propertiesQuery.data ?? [];
  const brokerAgents = analytics.agents;
  const brokerRequests = requestsQuery.data ?? [];
  const brokerSalesRequests = salesQuery.data ?? [];
  const activityLogs = useMemo(
    () => activityQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [activityQuery.data?.pages],
  );

  const activeAgreements = brokerAgreements.filter((row) => row.status === "Active" || row.status === "Renewed");
  const activeDevelopers = [...new Set(activeAgreements.map((row) => row.developerId))];
  const pendingSales = brokerSalesRequests.filter((row) => row.status === "Pending");
  const totalAgents = brokerAgents.filter((row) => row.status === "Active").length;

  const inventoryStatus = useMemo(
    () => ({
      available: analytics.properties.filter((row) => row.status === "Available").length,
      reserved: analytics.properties.filter((row) => row.status === "Reserved").length,
      sold: analytics.properties.filter((row) => row.status === "Sold").length,
    }),
    [analytics.properties],
  );

  const agreementStatus = useMemo(
    () => ({
      active: analytics.agreements.filter((row) => row.status === "Active" || row.status === "Renewed").length,
      expiring: analytics.agreements.filter((row) => {
        const days = (new Date(row.validityEnd).getTime() - Date.now()) / 86400000;
        return days >= 0 && days <= 15;
      }).length,
      pending: analytics.agreements.filter((row) => row.status === "Pending Approval" || row.status === "Draft").length,
    }),
    [analytics.agreements],
  );

  const monthlyTrend = useMemo(
    () =>
      analytics.monthlySales.map((row) => ({
        key: row.month,
        label: shortMonthLabel(row.month),
        submitted: row.submitted,
        approved: row.approved,
        rejected: row.rejected,
      })),
    [analytics.monthlySales],
  );

  const byDeveloper = useMemo(
    () =>
      analytics.developerRows.slice(0, 6).map((row) => ({
        developerId: row.developerId,
        totalRequests: row.salesClosed,
        approved: row.salesClosed,
        contributionPct: Math.round(row.revenueContribution),
      })),
    [analytics.developerRows],
  );

  const pendingAgreementActions = analytics.agreements
    .filter((row) => row.status === "Pending Approval" || row.status === "Draft")
    .slice(0, 3)
    .map((row) => ({
      id: row.id,
      title: `Agreement ${row.id} awaiting review`,
      note: `Developer ${row.developerId} requires contract action`,
      href: "/broker/agreements",
      action: "Review",
    }));

  const pendingActions = [
    ...brokerRequests
      .filter((row) => row.status === "Invitation Sent")
      .slice(0, 3)
      .map((row) => ({
        id: row.id,
        title: `Developer invitation ${row.id}`,
        note: `Review and accept connection from ${row.developerId}`,
        href: "/broker/developers/requests",
        action: "Accept",
      })),
    ...pendingAgreementActions.map((row) => ({
      ...row,
      href: `/broker/agreements/${encodeURIComponent(row.id)}`,
    })),
    ...pendingSales.slice(0, 3).map((row) => ({
      id: row.id,
      title: `Sale request ${row.id} pending`,
      note: `${row.propertyCode} · ${row.projectName}`,
      href: `/broker/sales/timeline?request=${encodeURIComponent(row.id)}`,
      action: "Open",
    })),
  ].slice(0, 6);

  const agentActivity = brokerAgents
    .map((row) => ({
      id: row.id,
      name: row.name,
      assigned: row.assignedPropertiesCount,
      status: row.status,
      submissions: brokerSalesRequests.filter((sale) => sale.brokerAgentId === row.id).length,
    }))
    .sort((a, b) => b.submissions - a.submissions || b.assigned - a.assigned)
    .slice(0, 6);

  const recentFeed = [
    ...sharedProperties.slice(0, 4).map((row) => ({
      id: `property-${row.id}`,
      when: row.sharedDate,
      text: `Property ${row.id} shared under agreement ${row.agreementId}.`,
    })),
    ...brokerAgreements.slice(0, 4).map((row) => ({
      id: `agreement-${row.id}`,
      when: row.updatedAt,
      text: `Agreement ${row.id} is ${row.status}.`,
    })),
    ...brokerSalesRequests.slice(0, 4).map((row) => ({
      id: `sale-${row.id}`,
      when: row.updatedAt,
      text: `Sale request ${row.id} is ${row.status} for ${row.propertyCode}.`,
    })),
    ...activityLogs.slice(0, 4).map((row) => ({
      id: `activity-${row.id}`,
      when: row.createdAt,
      text: row.details,
    })),
  ]
    .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
    .slice(0, 8);

  const smartAlerts = analytics.executiveInsights
    .map((alert, index) => ({
      id: `insight-${index}`,
      level: alert.severity,
      text: alert.text,
    }))
    .slice(0, 6);

  const bestDeveloper = analytics.developerRows[0];
  const bestAgent = analytics.agentRows[0];
  const fastestProject = analytics.projectRows[0];

  const quickActions = [
    { label: "Submit Sale", href: "/broker/sales" },
    { label: "Add Agent", href: "/broker/agents/new" },
    { label: "Open Inventory", href: "/broker/properties" },
    { label: "Request Agreement", href: "/broker/developers" },
  ];
  const dashboardLoading = propertiesQuery.isLoading || requestsQuery.isLoading || salesQuery.isLoading || activityQuery.isLoading || analytics.loading;
  const dashboardErrorMessage =
    errorMessage(propertiesQuery.error) ??
    errorMessage(requestsQuery.error) ??
    errorMessage(salesQuery.error) ??
    errorMessage(activityQuery.error) ??
    analytics.error ??
    null;

  const kpiCards = [
    { label: "Active Developers", value: activeDevelopers.length, sub: "Connected Developers", href: "/broker/developers", icon: Building2 },
    { label: "Active Agreements", value: activeAgreements.length, sub: "Agreements Active", href: "/broker/agreements", icon: FileText },
    { label: "Shared Inventory", value: inventoryStatus.available, sub: "Available Units", href: "/broker/properties", icon: Home },
    { label: "Pending Sales Requests", value: analytics.kpis.pending, sub: "Awaiting Review", href: "/broker/sales", icon: Clock3 },
    { label: "Total Agents", value: totalAgents, sub: "Active Agents", href: "/broker/agents", icon: UserRound },
    { label: "Approved Sales", value: analytics.kpis.approved, sub: "Closed & Approved", href: "/broker/sales", icon: CheckCircle2 },
  ];

  useEffect(() => {
    if (!quickOpen) return;

    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (quickMenuRef.current?.contains(target)) return;
      setQuickOpen(false);
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setQuickOpen(false);
      }
    };

    window.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onEscape);
    };
  }, [quickOpen]);

  useEffect(() => {
    if (!brokerId) return;
    const id = window.setInterval(() => {
      void propertiesQuery.refetch();
      void requestsQuery.refetch();
      void salesQuery.refetch();
      void activityQuery.refetch();
    }, 30_000);
    return () => window.clearInterval(id);
  }, [brokerId, propertiesQuery.refetch, requestsQuery.refetch, salesQuery.refetch, activityQuery.refetch]);

  return (
    <div className="space-y-5 pb-6 text-[#1f2a44]">
      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">Broker Dashboard</h1>
            <p className="mt-1 text-sm text-[#607187]">Manage developers, inventory, agents, and sales efficiently.</p>
          </div>
          <div ref={quickMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setQuickOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-md bg-[#3aa4a8] px-4 py-2 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              Quick Action
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {quickOpen && (
              <div className="absolute right-0 z-20 mt-2 min-w-[210px] overflow-hidden rounded-xl border border-[#dbe4eb] bg-white shadow-xl">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    onClick={() => setQuickOpen(false)}
                    className="block border-b border-[#ecf1f5] px-3 py-2 text-sm text-[#355069] last:border-b-0 hover:bg-[#f6fafc]"
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {dashboardErrorMessage && (
        <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {dashboardErrorMessage}
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {dashboardLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={`broker-kpi-skeleton-${index}`} className="h-[128px] animate-pulse rounded-xl border border-[#dbe4eb] bg-[#eef3f6]" />
            ))
          : kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className="rounded-xl border border-[#dbe4eb] bg-white p-4 transition hover:border-[#c9dde1] hover:shadow-sm">
              <span className="inline-flex rounded-lg bg-[#e8f6f6] p-2">
                <Icon className="h-4 w-4 text-[#2fa5a6]" />
              </span>
              <p className="mt-3 text-xs text-[#7f8a99]">{card.label}</p>
              <p className="font-display text-2xl text-[#1f2a44]">{card.value}</p>
              <p className="text-xs text-[#7f8a99]">{card.sub}</p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <article className="rounded-xl border border-[#dbe4eb] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-[#1f2a44]">Monthly Sales Trend</h2>
            <span className="text-xs text-[#7f8a99]">Submitted vs Approved vs Rejected</span>
          </div>
          <div className="space-y-3">
            {dashboardLoading && <div className="h-[220px] animate-pulse rounded-lg bg-[#eef3f6]" />}
            {!dashboardLoading && monthlyTrend.map((row) => {
              const max = Math.max(1, row.submitted, row.approved, row.rejected);
              return (
                <div key={row.key} className="grid grid-cols-[48px_1fr] items-center gap-3">
                  <span className="text-xs text-[#7f8a99]">{row.label}</span>
                  <div className="space-y-1">
                    <div className="h-2 rounded-full bg-[#edf3f6]">
                      <div className="h-2 rounded-full bg-[#3aa4a8]" style={{ width: `${(row.submitted / max) * 100}%` }} />
                    </div>
                    <div className="h-2 rounded-full bg-[#edf3f6]">
                      <div className="h-2 rounded-full bg-[#22c55e]" style={{ width: `${(row.approved / max) * 100}%` }} />
                    </div>
                    <div className="h-2 rounded-full bg-[#edf3f6]">
                      <div className="h-2 rounded-full bg-[#f87171]" style={{ width: `${(row.rejected / max) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {!dashboardLoading && monthlyTrend.length === 0 && (
              <p className="rounded-lg border border-[#ecf1f5] bg-[#f8fafc] p-3 text-xs text-[#7f8a99]">
                No monthly trend data yet.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-xl border border-[#dbe4eb] bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-[#1f2a44]">Developer Contribution</h2>
          <p className="mt-1 text-xs text-[#7f8a99]">Opportunity contribution by connected developers</p>
          <div className="mt-4 space-y-3">
            {dashboardLoading && <div className="h-[220px] animate-pulse rounded-lg bg-[#eef3f6]" />}
            {!dashboardLoading && byDeveloper.map((row) => (
              <div key={row.developerId} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <DeveloperCell developerId={row.developerId} />
                  <span className="text-[#607187]">{row.contributionPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#edf3f6]">
                  <div className="h-2 rounded-full bg-[#3b82f6]" style={{ width: `${row.contributionPct}%` }} />
                </div>
              </div>
            ))}
            {!dashboardLoading && byDeveloper.length === 0 && (
              <p className="rounded-lg border border-[#ecf1f5] bg-[#f8fafc] p-3 text-xs text-[#7f8a99]">
                No developer contribution data yet.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-[#dbe4eb] bg-white p-5">
          <h3 className="font-display text-base font-semibold text-[#1f2a44]">Inventory Status</h3>
          {dashboardLoading ? (
            <div className="mt-3 h-[78px] animate-pulse rounded-lg bg-[#eef3f6]" />
          ) : (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-[#607187]">Available</span><span className="font-semibold">{inventoryStatus.available}</span></div>
              <div className="flex items-center justify-between"><span className="text-[#607187]">Reserved</span><span className="font-semibold">{inventoryStatus.reserved}</span></div>
              <div className="flex items-center justify-between"><span className="text-[#607187]">Sold</span><span className="font-semibold">{inventoryStatus.sold}</span></div>
            </div>
          )}
        </article>
        <article className="rounded-xl border border-[#dbe4eb] bg-white p-5">
          <h3 className="font-display text-base font-semibold text-[#1f2a44]">Agreement Status</h3>
          {dashboardLoading ? (
            <div className="mt-3 h-[78px] animate-pulse rounded-lg bg-[#eef3f6]" />
          ) : (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-[#607187]">Active</span><span className="font-semibold">{agreementStatus.active}</span></div>
              <div className="flex items-center justify-between"><span className="text-[#607187]">Expiring</span><span className="font-semibold">{agreementStatus.expiring}</span></div>
              <div className="flex items-center justify-between"><span className="text-[#607187]">Pending</span><span className="font-semibold">{agreementStatus.pending}</span></div>
            </div>
          )}
        </article>
        <article className="rounded-xl border border-[#dbe4eb] bg-white p-5">
          <h3 className="font-display text-base font-semibold text-[#1f2a44]">Agent Activity Snapshot</h3>
          {dashboardLoading ? (
            <div className="mt-3 h-[78px] animate-pulse rounded-lg bg-[#eef3f6]" />
          ) : (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-[#607187]">Active Today</span><span className="font-semibold">{totalAgents}</span></div>
              <div className="flex items-center justify-between"><span className="text-[#607187]">Assigned Inventory</span><span className="font-semibold">{brokerAgents.reduce((sum, row) => sum + row.assignedPropertiesCount, 0)}</span></div>
              <div className="flex items-center justify-between"><span className="text-[#607187]">Pending Submissions</span><span className="font-semibold">{pendingSales.length}</span></div>
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-[#dbe4eb] bg-white">
          <div className="flex items-center justify-between border-b border-[#ecf1f5] px-5 py-4">
            <h3 className="font-display text-base font-semibold text-[#1f2a44]">Pending Actions</h3>
            <Clock3 className="h-4 w-4 text-[#7f8a99]" />
          </div>
          <div className="p-4">
            {pendingActions.length === 0 ? (
              <p className="rounded-lg border border-[#ecf1f5] bg-[#f8fafc] p-3 text-sm text-[#7f8a99]">
                No urgent pending actions.
              </p>
            ) : (
              <div className="space-y-2">
                {pendingActions.map((row) => (
                  <div key={row.id} className="flex items-center justify-between rounded-lg border border-[#ecf1f5] bg-[#f9fbfc] p-3">
                    <div>
                      <p className="text-sm font-medium text-[#1f2a44]">{row.title}</p>
                      <p className="text-xs text-[#7f8a99]">{row.note}</p>
                    </div>
                    <Link href={row.href} className="rounded-md border border-[#dbe4eb] bg-white px-2.5 py-1.5 text-xs text-[#355069]">
                      {row.action}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>

        <article className="rounded-xl border border-[#dbe4eb] bg-white">
          <div className="flex items-center justify-between border-b border-[#ecf1f5] px-5 py-4">
            <h3 className="font-display text-base font-semibold text-[#1f2a44]">Agent Quick Activity</h3>
            <UserRound className="h-4 w-4 text-[#7f8a99]" />
          </div>
          <div className="p-4">
            {analytics.loading && <TableSkeletonRows cols={3} rows={4} />}
            {!analytics.loading && agentActivity.length === 0 && (
              <p className="rounded-lg border border-[#ecf1f5] bg-[#f8fafc] p-3 text-sm text-[#7f8a99]">
                No active agents yet.
              </p>
            )}
            {!analytics.loading && agentActivity.length > 0 && (
              <div className="space-y-2">
                {agentActivity.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between rounded-lg border border-[#ecf1f5] bg-[#f9fbfc] p-3">
                    <div>
                      <p className="text-sm font-medium text-[#1f2a44]">{agent.name}</p>
                      <p className="text-xs text-[#7f8a99]">{agent.id}</p>
                    </div>
                    <div className="text-right text-xs text-[#607187]">
                      <p>{agent.assigned} assigned</p>
                      <p>{agent.submissions} submissions</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-[#dbe4eb] bg-white">
          <div className="flex items-center justify-between border-b border-[#ecf1f5] px-5 py-4">
            <h3 className="font-display text-base font-semibold text-[#1f2a44]">Recent Activity</h3>
            <TrendingUp className="h-4 w-4 text-[#7f8a99]" />
          </div>
          <div className="p-4">
            {recentFeed.length === 0 ? (
              <p className="rounded-lg border border-[#ecf1f5] bg-[#f8fafc] p-3 text-sm text-[#7f8a99]">
                No recent activity yet.
              </p>
            ) : (
              <div className="space-y-2">
                {recentFeed.map((item) => (
                  <div key={item.id} className="rounded-lg border border-[#ecf1f5] bg-[#f9fbfc] p-3">
                    <p className="text-sm text-[#1f2a44]">{item.text}</p>
                    <p className="mt-1 text-xs text-[#7f8a99]">{new Date(item.when).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>

        <article className="rounded-xl border border-[#dbe4eb] bg-white">
          <div className="flex items-center justify-between border-b border-[#ecf1f5] px-5 py-4">
            <h3 className="font-display text-base font-semibold text-[#1f2a44]">Smart Alerts</h3>
            <BellRing className="h-4 w-4 text-[#7f8a99]" />
          </div>
          <div className="p-4">
            {smartAlerts.length === 0 ? (
              <p className="rounded-lg border border-[#ecf1f5] bg-[#f8fafc] p-3 text-sm text-[#7f8a99]">
                No critical alerts. Operations are stable.
              </p>
            ) : (
              <div className="space-y-2">
                {smartAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-lg border p-3 text-sm ${
                      alert.level === "urgent"
                        ? "border-rose-200 bg-rose-50 text-rose-800"
                        : alert.level === "warning"
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-blue-200 bg-blue-50 text-blue-800"
                    }`}
                  >
                    {alert.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-[#dbe4eb] bg-white p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#2fa5a6]" />
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7f8a99]">Best Developer</p>
          </div>
          <div className="mt-3">
            {bestDeveloper ? (
              <DeveloperCell developerId={bestDeveloper.developerId} />
            ) : (
              <p className="text-sm text-[#7f8a99]">No developer sales data yet.</p>
            )}
          </div>
        </article>
        <article className="rounded-xl border border-[#dbe4eb] bg-white p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#2fa5a6]" />
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7f8a99]">Best Agent</p>
          </div>
          <div className="mt-3">
            {bestAgent ? (
              <>
                <p className="text-sm font-semibold text-[#1f2a44]">{bestAgent.name}</p>
                <p className="text-xs text-[#7f8a99]">{bestAgent.agentId}</p>
              </>
            ) : (
              <p className="text-sm text-[#7f8a99]">No agent activity yet.</p>
            )}
          </div>
        </article>
        <article className="rounded-xl border border-[#dbe4eb] bg-white p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#2fa5a6]" />
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7f8a99]">Fastest Project</p>
          </div>
          <div className="mt-3">
            {fastestProject ? (
              <>
                <p className="text-sm font-semibold text-[#1f2a44]">{fastestProject.projectName}</p>
                <p className="text-xs text-[#7f8a99]">{fastestProject.approvedSales} approved sale(s)</p>
              </>
            ) : (
              <p className="text-sm text-[#7f8a99]">No approved sales yet.</p>
            )}
          </div>
        </article>
      </section>

      {!analytics.loading && activeAgreements.length === 0 && (
        <section className="rounded-xl border border-[#dbe4eb] bg-white p-6">
          <h3 className="font-display text-lg font-semibold text-[#1f2a44]">No active agreements yet</h3>
          <p className="mt-1 text-sm text-[#607187]">
            Start by requesting a developer connection and accepting an agreement to unlock inventory visibility.
          </p>
          <Link href="/broker/developers" className="mt-4 inline-flex rounded-md bg-[#3aa4a8] px-4 py-2 text-sm font-medium text-white">
            Open Developers Module
          </Link>
        </section>
      )}
    </div>
  );
}
