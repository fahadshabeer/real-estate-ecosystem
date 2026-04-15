"use client";

import { AlertTriangle, Info, Siren } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useBrokerAnalytics } from "@/hooks/use-broker-analytics";

const severityStyles: Record<string, string> = {
  urgent: "border-rose-200 bg-rose-50 text-rose-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
};

function SeverityIcon({ severity }: { severity: "urgent" | "warning" | "info" }) {
  if (severity === "urgent") return <Siren className="h-4 w-4" />;
  if (severity === "warning") return <AlertTriangle className="h-4 w-4" />;
  return <Info className="h-4 w-4" />;
}

export default function BrokerExecutiveInsightsPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId;
  const analytics = useBrokerAnalytics(brokerId);
  const isInitialLoading =
    analytics.loading &&
    analytics.developerRows.length === 0 &&
    analytics.agentRows.length === 0 &&
    analytics.projectRows.length === 0 &&
    analytics.executiveInsights.length === 0;

  return (
    <div className="space-y-5 pb-6">
      {analytics.error && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {analytics.error}
        </section>
      )}
      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <p className="text-xs text-[#7f8a99]">Active Developers</p>
          <p className="mt-2 text-xl font-semibold text-[#1f2a44]">{analytics.developerRows.length}</p>
        </article>
        <article className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <p className="text-xs text-[#7f8a99]">Active Agents</p>
          <p className="mt-2 text-xl font-semibold text-[#1f2a44]">
            {analytics.agentRows.filter((row) => row.status === "Active").length}
          </p>
        </article>
        <article className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <p className="text-xs text-[#7f8a99]">Tracked Projects</p>
          <p className="mt-2 text-xl font-semibold text-[#1f2a44]">{analytics.projectRows.length}</p>
        </article>
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
        <h2 className="text-base font-semibold text-[#1f2a44]">Executive Insights</h2>
        <div className="mt-4 space-y-3">
          {isInitialLoading && <div className="h-20 w-full animate-pulse rounded-md bg-[#eef3f6]" />}
          {!isInitialLoading && analytics.executiveInsights.length === 0 && (
            <div className="rounded-md border border-dashed border-[#dbe4eb] px-4 py-6 text-sm text-[#7f8a99]">
              No executive insights available yet.
            </div>
          )}
          {!isInitialLoading &&
            analytics.executiveInsights.map((item, index) => (
              <article
                key={`${item.severity}-${index}`}
                className={`rounded-md border p-3 ${severityStyles[item.severity]}`}
              >
                <div className="flex items-start gap-2">
                  <SeverityIcon severity={item.severity} />
                  <p className="text-sm">{item.text}</p>
                </div>
              </article>
            ))}
        </div>
      </section>
    </div>
  );
}
