"use client";

import Link from "next/link";
import { AlertTriangle, Eye, House, Info, Siren, TriangleAlert } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { BrokerCell } from "@/components/ui/broker-cell";
import { useAnalyticsModule } from "@/hooks/use-analytics-module";

function severityIcon(severity: "urgent" | "warning" | "info") {
  if (severity === "urgent") return <Siren className="h-4 w-4" />;
  if (severity === "warning") return <TriangleAlert className="h-4 w-4" />;
  return <Info className="h-4 w-4" />;
}

function severityStyles(severity: "urgent" | "warning" | "info") {
  if (severity === "urgent") return "border-[#f5c8c8] bg-[#fff3f3] text-[#b64646]";
  if (severity === "warning") return "border-[#f7e2b2] bg-[#fff9ed] text-[#9a6a00]";
  return "border-[#d2e9ff] bg-[#f2f9ff] text-[#2f6399]";
}

export default function ExecutiveInsightsPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId;
  const analytics = useAnalyticsModule(developerId);

  const expiring = analytics.agreements
    .map((agreement) => {
      const days = Math.ceil((new Date(agreement.validityEnd).getTime() - Date.now()) / 86400000);
      return { ...agreement, days };
    })
    .filter((agreement) => agreement.days >= 0 && agreement.days <= 30)
    .sort((a, b) => a.days - b.days)
    .slice(0, 15);

  const inactive = analytics.brokerPerformanceRows
    .filter((row) => row.sharedProperties > 0 && row.dealsClosed === 0)
    .slice(0, 15);

  return (
    <div className="space-y-5 pb-6">
      {analytics.error && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {analytics.error}
        </section>
      )}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-[#7f8a99]">
          <House className="h-3.5 w-3.5" />
          <span>/</span>
          <span>Analytics</span>
          <span>/</span>
          <span>Executive Insights</span>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        {analytics.executiveInsights.map((item, index) => (
          <article key={`${item.severity}-${index}`} className={`rounded-md border p-4 ${severityStyles(item.severity)}`}>
            <div className="flex items-start gap-2">
              {severityIcon(item.severity)}
              <p className="text-sm font-medium">{item.text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
          <div className="border-b border-[#ecf1f5] px-6 py-4">
            <p className="text-[16px] text-[#38a0a6]">Expiring Agreements (<span className="font-bold">{expiring.length}</span>)</p>
          </div>
          <div className="min-h-[360px] overflow-x-auto">
            <table className="min-w-full text-left text-sm text-[#4f6078]">
              <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
                <tr>
                  <th className="px-4 py-3">Contract ID</th>
                  <th className="px-4 py-3">Broker</th>
                  <th className="px-4 py-3">Days Left</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {analytics.loading && <TableSkeletonRows cols={4} rows={6} />}
                {!analytics.loading && expiring.map((agreement) => (
                  <tr key={agreement.id} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3 font-medium text-[#1f2a44]">{agreement.id}</td>
                    <td className="px-4 py-3"><BrokerCell brokerId={agreement.brokerId} /></td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-[#fff4d8] px-2 py-1 text-xs font-semibold text-[#a06b00]">{agreement.days} days</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/portal/contracts/${encodeURIComponent(agreement.id)}`}
                        className="inline-flex rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078]"
                        title="Open agreement"
                        aria-label="Open agreement"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {!analytics.loading && expiring.length === 0 && (
                  <tr className="border-t border-[#ecf1f5]"><td className="px-4 py-6 text-[#7f8a99]" colSpan={4}>No expiring agreements in the next 30 days.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
          <div className="border-b border-[#ecf1f5] px-6 py-4">
            <p className="text-[16px] text-[#38a0a6]">Inactive Brokers (<span className="font-bold">{inactive.length}</span>)</p>
          </div>
          <div className="min-h-[360px] overflow-x-auto">
            <table className="min-w-full text-left text-sm text-[#4f6078]">
              <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
                <tr>
                  <th className="px-4 py-3">Broker</th>
                  <th className="px-4 py-3">Shared Properties</th>
                  <th className="px-4 py-3">Deals Closed</th>
                  <th className="px-4 py-3">Alert</th>
                </tr>
              </thead>
              <tbody>
                {analytics.loading && <TableSkeletonRows cols={4} rows={6} />}
                {!analytics.loading && inactive.map((row) => (
                  <tr key={row.brokerId} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3"><BrokerCell brokerId={row.brokerId} /></td>
                    <td className="px-4 py-3">{row.sharedProperties}</td>
                    <td className="px-4 py-3">{row.dealsClosed}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#fff3f3] px-2 py-1 text-xs font-semibold text-[#b64646]">
                        <AlertTriangle className="h-3 w-3" />
                        Action needed
                      </span>
                    </td>
                  </tr>
                ))}
                {!analytics.loading && inactive.length === 0 && (
                  <tr className="border-t border-[#ecf1f5]"><td className="px-4 py-6 text-[#7f8a99]" colSpan={4}>No inactive brokers detected.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
