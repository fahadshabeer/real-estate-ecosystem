"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { House, Search } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { useAnalyticsModule } from "@/hooks/use-analytics-module";

export default function DemandTrendsPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId;
  const analytics = useAnalyticsModule(developerId);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const topRequests = useMemo(() => {
    const map = new Map<string, { propertyCode: string; project: string; requestCount: number; approved: number }>();
    for (const row of analytics.salesRequests) {
      if (!map.has(row.propertyCode)) {
        map.set(row.propertyCode, {
          propertyCode: row.propertyCode,
          project: row.projectName,
          requestCount: 0,
          approved: 0,
        });
      }
      const item = map.get(row.propertyCode)!;
      item.requestCount += 1;
      if (row.status === "Approved") item.approved += 1;
    }
    const q = search.trim().toLowerCase();
    return Array.from(map.values())
      .filter((row) => q.length === 0 || [row.propertyCode, row.project].join(" ").toLowerCase().includes(q))
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, 30);
  }, [analytics.salesRequests, search]);
  const totalPages = Math.max(1, Math.ceil(topRequests.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return topRequests.slice(start, start + pageSize);
  }, [currentPage, topRequests]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const chartData = analytics.typeRows.slice(0, 8).map((row) => ({
    type: row.type,
    hits: row.demandHits,
  }));

  const luxuryDemand = analytics.typeRows
    .filter((row) => row.type.toLowerCase().includes("luxury") || row.type.toLowerCase().includes("villa"))
    .reduce((sum, row) => sum + row.demandHits, 0);

  const offPlanDemand = analytics.projectRows
    .filter((row) => row.available > row.sold)
    .reduce((sum, row) => sum + row.sold + row.reserved, 0);

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
          <span>Demand Trends</span>
        </div>
        <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
          <Search className="h-4 w-4 text-[#46a4a8]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
            placeholder="Search property or project"
          />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Most Requested Type", analytics.typeRows[0]?.type ?? "N/A"],
          ["Demand Hits", String(analytics.typeRows.reduce((sum, row) => sum + row.demandHits, 0))],
          ["Luxury/Villa Demand", String(luxuryDemand)],
          ["Off-Plan Demand Index", String(offPlanDemand)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-md border border-[#dbe4eb] bg-white p-4">
            <p className="text-xs text-[#7f8a99]">{label}</p>
            <p className="mt-2 text-xl font-semibold text-[#1f2a44]">{value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
        <h2 className="text-base font-semibold text-[#1f2a44]">Demand by Property Type</h2>
        <div className="mt-4 h-[300px] w-full">
          {analytics.loading ? (
            <div className="h-full w-full animate-pulse rounded-md bg-[#eef3f6]" />
          ) : chartData.length === 0 ? (
            <div className="grid h-full w-full place-items-center rounded-md border border-dashed border-[#dbe4eb] text-sm text-[#7f8a99]">
              No demand trend chart data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6edf3" />
                <XAxis dataKey="type" tick={{ fill: "#607187", fontSize: 11 }} />
                <YAxis tick={{ fill: "#607187", fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #dbe4eb", backgroundColor: "#fff" }} />
                <Bar dataKey="hits" fill="#3aa4a8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] text-[#38a0a6]">Total(<span className="font-bold">{topRequests.length}</span>)</p>
        </div>
        <div className="min-h-[520px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Property Code</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Request Count</th>
                <th className="px-4 py-3">Approved Sales</th>
                <th className="px-4 py-3">Demand Signal</th>
              </tr>
            </thead>
            <tbody>
              {analytics.loading && <TableSkeletonRows cols={5} rows={8} />}
              {!analytics.loading && pageRows.map((row) => (
                <tr key={row.propertyCode} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.propertyCode}</td>
                  <td className="px-4 py-3">{row.project}</td>
                  <td className="px-4 py-3">{row.requestCount}</td>
                  <td className="px-4 py-3">{row.approved}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-[#eef6ff] px-2 py-1 text-xs font-semibold text-[#3f6ea8]">
                      {row.requestCount >= 4 ? "High" : row.requestCount >= 2 ? "Medium" : "Low"}
                    </span>
                  </td>
                </tr>
              ))}
              {!analytics.loading && topRequests.length === 0 && (
                <tr className="border-t border-[#ecf1f5]"><td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>No demand trend data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {!analytics.loading && topRequests.length > 0 && (
          <div className="flex items-center justify-end gap-4 border-t border-[#ecf1f5] px-4 py-3 text-sm text-[#7f8a99]">
            <span>
              Currently at Page: {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              className="rounded-md border border-[#dbe4eb] bg-white px-3 py-1.5 text-[#1f2a44] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
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
