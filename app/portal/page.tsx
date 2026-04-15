"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  Clock3,
  FileText,
  Home,
  Plus,
  Sparkles,
} from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { BrokerCell } from "@/components/ui/broker-cell";
import {
  useDeveloperAgreements,
  useDeveloperContractRequests,
  useUpdateContractRequestStatus,
} from "@/hooks/use-agreements";
import { useAnalyticsModule } from "@/hooks/use-analytics-module";
import { useDeveloperProperties } from "@/hooks/use-properties";
import { useActivityLogsPagination } from "@/hooks/use-activity";
import { runWithToast } from "@/lib/ui/toast";

const DashboardSalesChart = dynamic(
  () => import("@/components/portal/dashboard-sales-chart").then((m) => m.DashboardSalesChart),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-md bg-[#eef3f6]" /> },
);
const DashboardStatusChart = dynamic(
  () => import("@/components/portal/dashboard-status-chart").then((m) => m.DashboardStatusChart),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-md bg-[#eef3f6]" /> },
);
const DashboardBrokerChart = dynamic(
  () => import("@/components/portal/dashboard-broker-chart").then((m) => m.DashboardBrokerChart),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-md bg-[#eef3f6]" /> },
);

function daysUntil(dateIso: string) {
  const diff = new Date(dateIso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function toDateLabel(value: string) {
  return new Date(value).toLocaleString();
}

function shortMonthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return new Date(year, month - 1, 1).toLocaleString(undefined, { month: "short" });
}

type PendingActionItem = {
  id: string;
  title: string;
  note: string;
  href: string;
  action: string;
  onClick?: () => Promise<void>;
};

export default function DeveloperDashboardPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId;
  const [quickOpen, setQuickOpen] = useState(false);

  const agreementsQuery = useDeveloperAgreements(developerId);
  const requestsQuery = useDeveloperContractRequests(developerId);
  const updateRequest = useUpdateContractRequestStatus(developerId);
  const propertiesQuery = useDeveloperProperties(developerId);
  const activityQuery = useActivityLogsPagination({ role: "developer", actorLabel: developerId, limit: 20 });
  const analytics = useAnalyticsModule(developerId);

  const agreements = useMemo(
    () => agreementsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [agreementsQuery.data?.pages],
  );
  const properties = useMemo(
    () => propertiesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [propertiesQuery.data?.pages],
  );
  const activityLogs = useMemo(
    () => activityQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [activityQuery.data?.pages],
  );
  const pendingRequests = useMemo(
    () =>
      (requestsQuery.data ?? []).filter(
        (request) => (request.initiatedBy ?? "broker") === "broker" && request.status === "Pending",
      ),
    [requestsQuery.data],
  );

  const activeAgreements = agreements.filter((agreement) => agreement.status === "Active" || agreement.status === "Renewed");
  const expiringAgreements = activeAgreements
    .map((agreement) => ({ ...agreement, daysLeft: daysUntil(agreement.validityEnd) }))
    .filter((agreement) => agreement.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const dashboardLoading =
    agreementsQuery.isLoading ||
    propertiesQuery.isLoading ||
    requestsQuery.isLoading ||
    activityQuery.isLoading ||
    analytics.loading;
  const dashboardError =
    agreementsQuery.error ||
    propertiesQuery.error ||
    requestsQuery.error ||
    activityQuery.error ||
    analytics.error;

  const brokerRanking = analytics.brokerPerformanceRows.slice(0, 5);

  const monthlySalesData = analytics.monthlySales.map((row) => ({
    month: shortMonthLabel(row.month),
    sold: row.sold,
    pending: row.pending,
    reserved: 0,
  }));

  const agreementStatusSummary = [
    { label: "Active", value: activeAgreements.length, total: Math.max(1, agreements.length), color: "bg-emerald-500" },
    { label: "Expiring", value: expiringAgreements.length, total: Math.max(1, agreements.length), color: "bg-amber-500" },
    {
      label: "Suspended",
      value: agreements.filter((agreement) => agreement.status === "Suspended").length,
      total: Math.max(1, agreements.length),
      color: "bg-rose-500",
    },
  ];

  const sharedThisWeek = analytics.maps.filter((map) => {
    const diff = Date.now() - new Date(map.sharedDate).getTime();
    return diff <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  const pendingActions: PendingActionItem[] = [
    ...pendingRequests.slice(0, 3).map((request) => ({
      id: request.id,
      title: `Broker request from ${request.brokerId}`,
      note: "Partnership request pending review",
      href: "/portal",
      action: "Approve",
      onClick: async () => {
        await runWithToast({
          loading: "Approving request...",
          success: "Request approved.",
          action: () => updateRequest.mutateAsync({ requestId: request.id, action: "Approve" }),
        });
      },
    })),
    ...expiringAgreements.slice(0, 3).map((agreement) => ({
      id: agreement.id,
      title: `${agreement.id} expires in ${agreement.daysLeft} day(s)`,
      note: `Broker: ${agreement.brokerId}`,
      href: "/portal/contracts",
      action: "Open",
    })),
  ].slice(0, 6);

  const brokerActivity = activityLogs
    .filter((log) => log.details.toLowerCase().includes("broker") || log.details.toLowerCase().includes("brk-"))
    .slice(0, 6);

  const topProject = analytics.forecast.topProject;
  const fastestUnitType = analytics.typeRows[0];
  const mostTrustedBroker = [...brokerRanking].sort((a, b) => b.trustScore - a.trustScore)[0];
  const smartAlerts = analytics.executiveInsights.map((alert, index) => ({
    id: `insight-${index}`,
    level: alert.severity,
    text: alert.text,
  }));

  const kpiCards = [
    {
      label: "Total Projects",
      value: analytics.projects.length,
      sub: `${analytics.projects.length} Active Projects`,
      href: "/portal/projects",
      icon: Building2,
    },
    {
      label: "Total Inventory",
      value: analytics.inventoryStatus.total,
      sub: `${analytics.inventoryStatus.available} Available Units`,
      href: "/portal/properties",
      icon: Home,
    },
    {
      label: "Active Broker Companies",
      value: [...new Set(analytics.agreements.filter((agreement) => agreement.status === "Active" || agreement.status === "Renewed").map((agreement) => agreement.brokerId))].length,
      sub: `${[...new Set(analytics.agreements.filter((agreement) => agreement.status === "Active" || agreement.status === "Renewed").map((agreement) => agreement.brokerId))].length} Brokers Connected`,
      href: "/portal/brokers",
      icon: Building2,
    },
    {
      label: "Active Agreements",
      value: activeAgreements.length,
      sub: `${activeAgreements.length} Agreements Active`,
      href: "/portal/contracts",
      icon: FileText,
    },
    {
      label: "Pending Sales Approval",
      value: analytics.salesRequests.filter((request) => request.status === "Pending").length,
      sub: `${analytics.salesRequests.filter((request) => request.status === "Pending").length} Requests Pending`,
      href: "/portal/sales-control",
      icon: Clock3,
    },
    {
      label: "Expiring Agreements",
      value: expiringAgreements.length,
      sub: `${expiringAgreements.length} Expiring Soon`,
      href: "/portal/contracts",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-5 pb-6 text-[#1f2a44]">
      <section className="rounded-md border border-[#dbe4eb] bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">Developer Dashboard</h1>
            <p className="mt-1 text-sm text-[#607187]">
              Welcome back, monitor your broker network and inventory today.
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setQuickOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-md bg-[#3aa4a8] px-4 py-2 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" /> Quick Create <ChevronDown className="h-4 w-4" />
            </button>
            {quickOpen && (
              <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-md border border-[#dbe4eb] bg-white shadow-lg">
                <Link href="/portal/properties/new" className="block px-3 py-2 text-sm hover:bg-[#f3f8fb]">
                  Add Property
                </Link>
                <Link href="/portal/contracts/new" className="block px-3 py-2 text-sm hover:bg-[#f3f8fb]">
                  Create Agreement
                </Link>
                <Link href="/portal/brokers/new" className="block px-3 py-2 text-sm hover:bg-[#f3f8fb]">
                  Invite Broker
                </Link>
                <Link href="/portal/projects" className="block px-3 py-2 text-sm hover:bg-[#f3f8fb]">
                  Add Project
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {dashboardError && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Unable to fully load dashboard data right now. Please refresh.
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={`kpi-skeleton-${index}`} className="h-[126px] animate-pulse rounded-md border border-[#dbe4eb] bg-[#eef3f6]" />
            ))
          : kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className="rounded-md border border-[#dbe4eb] bg-white p-4 transition hover:bg-[#f8fbfc]">
              <div className="flex items-start justify-between">
                <span className="inline-flex rounded-md bg-[#e8f6f6] p-2">
                  <Icon className="h-4 w-4 text-[#2fa5a6]" />
                </span>
                <span className="text-xs text-[#90a0b4]">Open</span>
              </div>
              <p className="mt-3 text-xs text-[#7f8a99]">{card.label}</p>
              <p className="font-display text-2xl font-semibold text-[#1f2a44]">{card.value}</p>
              <p className="mt-1 text-xs text-[#607187]">{card.sub}</p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <article className="rounded-md border border-[#dbe4eb] bg-white p-5 xl:col-span-2">
          <h3 className="font-display text-lg font-semibold text-[#1f2a44]">Monthly Sales Performance</h3>
          <p className="mt-1 text-xs text-[#7f8a99]">Sold, pending approvals, and reserved movement overview.</p>
          <div className="mt-4 h-[300px] w-full">
            {dashboardLoading ? (
              <div className="h-full w-full animate-pulse rounded-md bg-[#eef3f6]" />
            ) : (
              <DashboardSalesChart data={monthlySalesData} />
            )}
          </div>
        </article>

        <article className="rounded-md border border-[#dbe4eb] bg-white p-5">
          <h3 className="font-display text-lg font-semibold text-[#1f2a44]">Broker Performance Ranking</h3>
          <div className="mt-4 h-[200px] w-full">
            {dashboardLoading ? (
              <div className="h-full w-full animate-pulse rounded-md bg-[#eef3f6]" />
            ) : (
              <DashboardBrokerChart
                data={brokerRanking.length ? brokerRanking.map((row) => ({ broker: row.brokerId.slice(0, 10), deals: row.dealsClosed })) : []}
              />
            )}
          </div>
          <div className="mt-3 space-y-2">
            {brokerRanking.length === 0 && <p className="text-sm text-[#7f8a99]">No broker performance data yet.</p>}
            {brokerRanking.map((row) => (
              <div key={row.brokerId} className="flex items-center justify-between rounded-md border border-[#ecf1f5] bg-[#f9fbfc] px-3 py-2">
                <div>
                  <BrokerCell brokerId={row.brokerId} />
                  <p className="mt-1 text-xs text-[#7f8a99]">Approval success: {row.approvalSuccess.toFixed(1)}%</p>
                </div>
                <span className="text-sm font-semibold text-[#2fa5a6]">{row.dealsClosed} deals</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <article className="rounded-md border border-[#dbe4eb] bg-white p-5">
          <h3 className="font-display text-lg font-semibold text-[#1f2a44]">Inventory Status Distribution</h3>
          <div className="mt-4 h-[250px] w-full">
            {dashboardLoading ? (
              <div className="h-full w-full animate-pulse rounded-md bg-[#eef3f6]" />
            ) : (
              <DashboardStatusChart
                data={[
                  { name: "Available", value: analytics.inventoryStatus.available, color: "#0ea5e9" },
                  { name: "Reserved", value: analytics.inventoryStatus.reserved, color: "#f59e0b" },
                  { name: "Sold", value: analytics.inventoryStatus.sold, color: "#10b981" },
                  { name: "Blocked", value: analytics.inventoryStatus.blocked, color: "#94a3b8" },
                ]}
              />
            )}
          </div>
        </article>

        <article className="rounded-md border border-[#dbe4eb] bg-white p-5">
          <h3 className="font-display text-lg font-semibold text-[#1f2a44]">Agreement Status Overview</h3>
          <div className="mt-4 space-y-4">
            {agreementStatusSummary.map((item) => {
              const width = Math.min(100, Math.round((item.value / item.total) * 100));
              return (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-[#5e6b80]">{item.label}</span>
                    <span className="font-medium text-[#1f2a44]">{item.value}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#e8edf2]">
                    <div className={`h-full ${item.color}`} style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-md border border-[#dbe4eb] bg-white p-5">
          <h3 className="font-display text-lg font-semibold text-[#1f2a44]">Property Sharing Activity</h3>
          <p className="mt-1 text-xs text-[#7f8a99]">Units shared in the past 7 days</p>
          <p className="mt-5 font-display text-4xl font-semibold text-[#2fa5a6]">{sharedThisWeek}</p>
          <p className="mt-2 text-sm text-[#607187]">Linked to {activeAgreements.length} active agreement(s).</p>
          <div className="mt-5 rounded-md border border-[#e2e9ef] bg-[#f8fbfc] p-3 text-sm text-[#4f6078]">
            Total share mappings: <span className="font-semibold text-[#1f2a44]">{analytics.maps.length}</span>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-md border border-[#dbe4eb] bg-white p-5">
          <h3 className="font-display text-lg font-semibold text-[#1f2a44]">Pending Actions</h3>
          <div className="mt-4 space-y-2">
            {pendingActions.length === 0 && (
              <div className="rounded-md border border-[#ecf1f5] bg-[#f9fbfc] p-3 text-sm text-[#7f8a99]">
                No urgent action pending.
              </div>
            )}
            {pendingActions.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-[#ecf1f5] bg-[#f9fbfc] p-3">
                <div>
                  <p className="text-sm font-medium text-[#1f2a44]">{item.title}</p>
                  <p className="text-xs text-[#7f8a99]">{item.note}</p>
                </div>
                {item.onClick ? (
                  <button
                    onClick={async () => {
                      try {
                        await item.onClick?.();
                      } catch {}
                    }}
                    className="rounded-md border border-[#dbe4eb] bg-white px-3 py-1.5 text-xs text-[#4f6078]"
                  >
                    {item.action}
                  </button>
                ) : (
                  <Link href={item.href} className="rounded-md border border-[#dbe4eb] bg-white px-3 py-1.5 text-xs text-[#4f6078]">
                    {item.action}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-md border border-[#dbe4eb] bg-white p-5">
          <h3 className="font-display text-lg font-semibold text-[#1f2a44]">Quick Broker Activity</h3>
          <div className="mt-4 space-y-2">
            {brokerActivity.length === 0 && (
              <div className="rounded-md border border-[#ecf1f5] bg-[#f9fbfc] p-3 text-sm text-[#7f8a99]">
                No broker activity yet.
              </div>
            )}
            {brokerActivity.map((log) => (
              <div key={log.id} className="rounded-md border border-[#ecf1f5] bg-[#f9fbfc] p-3">
                <p className="text-sm text-[#1f2a44]">{log.action}</p>
                <p className="text-xs text-[#7f8a99]">{log.details}</p>
                <p className="mt-1 text-[11px] text-[#9aa6b2]">{toDateLabel(log.createdAt)}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <article className="rounded-md border border-[#dbe4eb] bg-white p-5 xl:col-span-2">
          <h3 className="font-display text-lg font-semibold text-[#1f2a44]">Recent Activity Feed</h3>
          <div className="mt-4 space-y-2">
            {activityLogs.length === 0 && (
              <div className="rounded-md border border-[#ecf1f5] bg-[#f9fbfc] p-3 text-sm text-[#7f8a99]">
                No activity yet. Start by inviting a broker company.
              </div>
            )}
            {activityLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="flex gap-3 rounded-md border border-[#ecf1f5] bg-[#f9fbfc] p-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#3aa4a8]" />
                <div>
                  <p className="text-sm text-[#1f2a44]">{log.details}</p>
                  <p className="mt-1 text-[11px] text-[#9aa6b2]">{toDateLabel(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-md border border-[#dbe4eb] bg-white p-5">
          <h3 className="font-display text-lg font-semibold text-[#1f2a44]">Smart Alerts</h3>
          <div className="mt-4 space-y-2">
            {smartAlerts.length === 0 && (
              <div className="rounded-md border border-[#ecf1f5] bg-[#f9fbfc] p-3 text-sm text-[#7f8a99]">
                No urgent alerts right now.
              </div>
            )}
            {smartAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-md border p-3 text-sm ${
                  alert.level === "urgent"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : alert.level === "warning"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-blue-200 bg-blue-50 text-blue-700"
                }`}
              >
                {alert.text}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[#7f8a99]">Top Performing Project</p>
          <p className="mt-2 text-lg font-semibold text-[#1f2a44]">{topProject?.name ?? "No project data yet"}</p>
          <p className="mt-1 text-sm text-[#607187]">{topProject ? `${topProject.sold} units sold so far` : "Share and sell inventory to see project performance."}</p>
        </article>
        <article className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[#7f8a99]">Fastest Selling Unit Type</p>
          <p className="mt-2 text-lg font-semibold text-[#1f2a44]">{fastestUnitType?.type ?? "No unit type trend yet"}</p>
          <p className="mt-1 text-sm text-[#607187]">{fastestUnitType ? `${fastestUnitType.demandHits} demand hits` : "Sales trend appears after first completed deals."}</p>
        </article>
        <article className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[#7f8a99]">Most Trusted Broker</p>
          <p className="mt-2 text-lg font-semibold text-[#1f2a44]">{mostTrustedBroker?.brokerId ?? "No broker quality signal yet"}</p>
          <p className="mt-1 text-sm text-[#607187]">{mostTrustedBroker ? `${mostTrustedBroker.trustScore}% trust score` : "Trust score appears after agreement lifecycle events."}</p>
        </article>
      </section>

      <section className="inline-flex items-center gap-2 rounded-md border border-[#cde6e6] bg-[#eff9f9] px-3 py-1.5 text-xs text-[#207f86]">
        <Sparkles className="h-3.5 w-3.5" />
        Decision-ready intelligence mode is active for executive monitoring.
      </section>
    </div>
  );
}
