"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useBrokerAnalytics } from "@/hooks/use-broker-analytics";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { DeveloperCell } from "@/components/ui/developer-cell";

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

export default function BrokerConversionMetricsPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId;
  const analytics = useBrokerAnalytics(brokerId);
  const [search, setSearch] = useState("");
  const [agentPage, setAgentPage] = useState(1);
  const [developerPage, setDeveloperPage] = useState(1);
  const pageSize = 10;

  const agentRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return analytics.conversion.byAgent.filter((row) => !q || [row.label, row.id].join(" ").toLowerCase().includes(q));
  }, [analytics.conversion.byAgent, search]);
  const isInitialAgentLoading = analytics.loading && agentRows.length === 0;
  const agentTotalPages = Math.max(1, Math.ceil(agentRows.length / pageSize));
  const currentAgentPage = Math.min(agentPage, agentTotalPages);
  const agentPageRows = useMemo(() => {
    const start = (currentAgentPage - 1) * pageSize;
    return agentRows.slice(start, start + pageSize);
  }, [agentRows, currentAgentPage]);

  const developerRows = analytics.conversion.byDeveloper;
  const isInitialDeveloperLoading = analytics.loading && developerRows.length === 0;
  const developerTotalPages = Math.max(1, Math.ceil(developerRows.length / pageSize));
  const currentDeveloperPage = Math.min(developerPage, developerTotalPages);
  const developerPageRows = useMemo(() => {
    const start = (currentDeveloperPage - 1) * pageSize;
    return developerRows.slice(start, start + pageSize);
  }, [currentDeveloperPage, developerRows]);

  useEffect(() => {
    setAgentPage(1);
  }, [search]);

  return (
    <div className="space-y-5 pb-6">
      {analytics.error && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {analytics.error}
        </section>
      )}
      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <p className="text-xs text-[#7f8a99]">Overall Conversion Rate</p>
          <p className="mt-2 text-xl font-semibold text-[#1f2a44]">{percent(analytics.conversion.overall)}</p>
        </article>
        <article className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <p className="text-xs text-[#7f8a99]">Assigned Units</p>
          <p className="mt-2 text-xl font-semibold text-[#1f2a44]">{analytics.assignments.length}</p>
        </article>
        <article className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <p className="text-xs text-[#7f8a99]">Approved Sales</p>
          <p className="mt-2 text-xl font-semibold text-[#1f2a44]">{analytics.kpis.approved}</p>
        </article>
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
        <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
          <Search className="h-4 w-4 text-[#46a4a8]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
            placeholder="Search agent conversion"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="border-b border-[#ecf1f5] px-6 py-4">
          <h2 className="text-base font-semibold text-[#1f2a44]">Agent Conversion</h2>
        </div>
        <div className="min-h-[360px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Approved Sales</th>
                <th className="px-4 py-3">Assigned Units</th>
                <th className="px-4 py-3">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {isInitialAgentLoading && <TableSkeletonRows cols={4} rows={6} />}
              {!isInitialAgentLoading &&
                agentPageRows.map((row) => (
                  <tr key={row.id} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1f2a44]">{row.label}</p>
                      <p className="text-xs text-[#7f8a99]">{row.id}</p>
                    </td>
                    <td className="px-4 py-3">{row.approvedSales}</td>
                    <td className="px-4 py-3">{row.assignedUnits}</td>
                    <td className="px-4 py-3">{percent(row.value)}</td>
                  </tr>
                ))}
              {!isInitialAgentLoading && agentRows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={4}>
                    No agent conversion records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!isInitialAgentLoading && agentRows.length > 0 && (
          <div className="flex items-center justify-end gap-4 border-t border-[#ecf1f5] px-4 py-3 text-sm text-[#7f8a99]">
            <span>
              Currently at Page: {currentAgentPage} of {agentTotalPages}
            </span>
            <button
              type="button"
              onClick={() => setAgentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentAgentPage <= 1}
              className="rounded-md border border-[#dbe4eb] bg-white px-3 py-1.5 text-[#1f2a44] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setAgentPage((prev) => Math.min(agentTotalPages, prev + 1))}
              disabled={currentAgentPage >= agentTotalPages}
              className="rounded-md border border-[#dbe4eb] bg-white px-3 py-1.5 text-[#1f2a44] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="border-b border-[#ecf1f5] px-6 py-4">
          <h2 className="text-base font-semibold text-[#1f2a44]">Developer Conversion</h2>
        </div>
        <div className="min-h-[320px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Developer</th>
                <th className="px-4 py-3">Approved Sales</th>
                <th className="px-4 py-3">Assigned Units</th>
                <th className="px-4 py-3">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {isInitialDeveloperLoading && <TableSkeletonRows cols={4} rows={5} />}
              {!isInitialDeveloperLoading &&
                developerPageRows.map((row) => (
                  <tr key={row.id} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3">
                      <DeveloperCell developerId={row.id} />
                    </td>
                    <td className="px-4 py-3">{row.approvedSales}</td>
                    <td className="px-4 py-3">{row.assignedUnits}</td>
                    <td className="px-4 py-3">{percent(row.value)}</td>
                  </tr>
                ))}
              {!isInitialDeveloperLoading && developerRows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={4}>
                    No developer conversion records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!isInitialDeveloperLoading && developerRows.length > 0 && (
          <div className="flex items-center justify-end gap-4 border-t border-[#ecf1f5] px-4 py-3 text-sm text-[#7f8a99]">
            <span>
              Currently at Page: {currentDeveloperPage} of {developerTotalPages}
            </span>
            <button
              type="button"
              onClick={() => setDeveloperPage((prev) => Math.max(1, prev - 1))}
              disabled={currentDeveloperPage <= 1}
              className="rounded-md border border-[#dbe4eb] bg-white px-3 py-1.5 text-[#1f2a44] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setDeveloperPage((prev) => Math.min(developerTotalPages, prev + 1))}
              disabled={currentDeveloperPage >= developerTotalPages}
              className="rounded-md border border-[#dbe4eb] bg-white px-3 py-1.5 text-[#1f2a44] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
