"use client";

import { useMemo, useState } from "react";
import { House, Search } from "lucide-react";
import { Bar, ComposedChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppContext } from "@/components/state/app-context";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { useAnalyticsModule } from "@/hooks/use-analytics-module";

function money(value: number) {
  return new Intl.NumberFormat("en-QA", { style: "currency", currency: "QAR", maximumFractionDigits: 0 }).format(value);
}

export default function RevenueForecastPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId;
  const analytics = useAnalyticsModule(developerId);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const projectionRows = useMemo(() => {
    return analytics.projectRows
      .map((row) => {
        const soldPriceAvg = row.sold > 0 ? row.revenue / row.sold : 0;
        const projected = row.revenue + soldPriceAvg * Math.min(row.available, 12) * 0.35;
        return {
          ...row,
          projected,
        };
      })
      .sort((a, b) => b.projected - a.projected);
  }, [analytics.projectRows]);
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projectionRows.filter((row) => !q || [row.name, row.code, row.salesSpeed].join(" ").toLowerCase().includes(q));
  }, [projectionRows, search]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows]);

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
          <span>Revenue Forecast</span>
        </div>
        <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
          <Search className="h-4 w-4 text-[#46a4a8]" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
            placeholder="Search project forecast"
          />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Approved Revenue", money(analytics.forecast.approvedRevenue)],
          ["Pending Pipeline", money(analytics.forecast.pendingRevenue)],
          ["Projected Next 30 Days", money(analytics.forecast.projected30d)],
          ["Approval Rate", `${analytics.forecast.approvalRate.toFixed(1)}%`],
        ].map(([label, value]) => (
          <article key={label} className="rounded-md border border-[#dbe4eb] bg-white p-4">
            <p className="text-xs text-[#7f8a99]">{label}</p>
            <p className="mt-2 text-xl font-semibold text-[#1f2a44]">{value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
        <h2 className="text-base font-semibold text-[#1f2a44]">Revenue Pace and Sales Volume</h2>
        <div className="mt-4 h-[300px] w-full">
          {analytics.loading ? (
            <div className="h-full w-full animate-pulse rounded-md bg-[#eef3f6]" />
          ) : analytics.monthlySales.length === 0 ? (
            <div className="grid h-full w-full place-items-center rounded-md border border-dashed border-[#dbe4eb] text-sm text-[#7f8a99]">
              No revenue pace data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              <ComposedChart data={analytics.monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6edf3" />
                <XAxis dataKey="month" tick={{ fill: "#607187", fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fill: "#607187", fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "#607187", fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #dbe4eb", backgroundColor: "#fff" }} />
                <Bar yAxisId="left" dataKey="sold" fill="#3aa4a8" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="left" dataKey="pending" fill="#9dcfd8" radius={[6, 6, 0, 0]} />
                <Line yAxisId="right" dataKey="revenue" stroke="#2c6f8f" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] text-[#38a0a6]">Total(<span className="font-bold">{filteredRows.length}</span>)</p>
        </div>
        <div className="min-h-[520px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Current Revenue</th>
                <th className="px-4 py-3">Projected Revenue</th>
                <th className="px-4 py-3">Available Units</th>
                <th className="px-4 py-3">Sales Speed</th>
              </tr>
            </thead>
            <tbody>
              {analytics.loading && <TableSkeletonRows cols={5} rows={8} />}
              {!analytics.loading && pageRows.map((row) => (
                <tr key={row.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.name}</td>
                  <td className="px-4 py-3">{money(row.revenue)}</td>
                  <td className="px-4 py-3">{money(row.projected)}</td>
                  <td className="px-4 py-3">{row.available}</td>
                  <td className="px-4 py-3">{row.salesSpeed}</td>
                </tr>
              ))}
              {!analytics.loading && filteredRows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]"><td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>No forecast data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {!analytics.loading && filteredRows.length > 0 && (
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
