"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Search } from "lucide-react";
import { useBrokerAnalytics } from "@/hooks/use-broker-analytics";
import { useAppContext } from "@/components/state/app-context";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

export default function BrokerSalesPerformancePage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId;
  const analytics = useBrokerAnalytics(brokerId);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return analytics.monthlySales.filter((row) => !q || row.month.toLowerCase().includes(q));
  }, [analytics.monthlySales, search]);
  const isInitialLoading = analytics.loading && rows.length === 0;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [currentPage, rows]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div className="space-y-5 pb-6">
      {analytics.error && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {analytics.error}
        </section>
      )}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Submitted Sales", String(analytics.kpis.submitted)],
          ["Approved Sales", String(analytics.kpis.approved)],
          ["Rejected Sales", String(analytics.kpis.rejected)],
          ["Pending Requests", String(analytics.kpis.pending)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-md border border-[#dbe4eb] bg-white p-4">
            <p className="text-xs text-[#7f8a99]">{label}</p>
            <p className="mt-2 text-xl font-semibold text-[#1f2a44]">{value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
        <h2 className="text-base font-semibold text-[#1f2a44]">Monthly Sales Trend</h2>
        <div className="mt-4 h-[300px] w-full">
          {isInitialLoading ? (
            <div className="h-full w-full animate-pulse rounded-md bg-[#eef3f6]" />
          ) : rows.length === 0 ? (
            <div className="grid h-full w-full place-items-center rounded-md border border-dashed border-[#dbe4eb] text-sm text-[#7f8a99]">
              No monthly sales trend data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              <LineChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6edf3" />
                <XAxis dataKey="month" tick={{ fill: "#607187", fontSize: 11 }} />
                <YAxis tick={{ fill: "#607187", fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #dbe4eb", backgroundColor: "#fff" }} />
                <Line type="monotone" dataKey="submitted" stroke="#3aa4a8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="approved" stroke="#14b8a6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
        <h2 className="text-base font-semibold text-[#1f2a44]">Status Distribution</h2>
        <div className="mt-4 h-[280px] w-full">
          {isInitialLoading ? (
            <div className="h-full w-full animate-pulse rounded-md bg-[#eef3f6]" />
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              <BarChart
                data={[
                  { status: "Submitted", value: analytics.kpis.submitted },
                  { status: "Approved", value: analytics.kpis.approved },
                  { status: "Rejected", value: analytics.kpis.rejected },
                  { status: "Pending", value: analytics.kpis.pending },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e6edf3" />
                <XAxis dataKey="status" tick={{ fill: "#607187", fontSize: 11 }} />
                <YAxis tick={{ fill: "#607187", fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #dbe4eb", backgroundColor: "#fff" }} />
                <Bar dataKey="value" fill="#3aa4a8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
          <Search className="h-4 w-4 text-[#46a4a8]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
            placeholder="Search month"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] text-[#38a0a6]">
            Total(<span className="font-bold">{rows.length}</span>)
          </p>
        </div>
        <div className="min-h-[520px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Approved</th>
                <th className="px-4 py-3">Rejected</th>
                <th className="px-4 py-3">Pending</th>
                <th className="px-4 py-3">Approval Rate</th>
              </tr>
            </thead>
            <tbody>
              {isInitialLoading && <TableSkeletonRows cols={6} rows={8} />}
              {!isInitialLoading &&
                pageRows.map((row) => (
                  <tr key={row.month} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.month}</td>
                    <td className="px-4 py-3">{row.submitted}</td>
                    <td className="px-4 py-3">{row.approved}</td>
                    <td className="px-4 py-3">{row.rejected}</td>
                    <td className="px-4 py-3">{row.pending}</td>
                    <td className="px-4 py-3">{percent(row.approvalRate)}</td>
                  </tr>
                ))}
              {!isInitialLoading && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={6}>
                    No sales performance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!isInitialLoading && rows.length > 0 && (
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
