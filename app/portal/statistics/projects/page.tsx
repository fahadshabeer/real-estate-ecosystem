"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Eye, House, Search } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { useAnalyticsModule } from "@/hooks/use-analytics-module";

function money(value: number) {
  return new Intl.NumberFormat("en-QA", { style: "currency", currency: "QAR", maximumFractionDigits: 0 }).format(value);
}

export default function ProjectAnalyticsPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId;
  const analytics = useAnalyticsModule(developerId);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return analytics.projectRows.filter((row) => !q || [row.name, row.code, row.city].join(" ").toLowerCase().includes(q));
  }, [analytics.projectRows, search]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [currentPage, rows]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalSold = rows.reduce((sum, row) => sum + row.sold, 0);
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const avgHealth = rows.length > 0 ? Math.round(rows.reduce((sum, row) => sum + row.healthScore, 0) / rows.length) : 0;

  const chartData = rows.slice(0, 8).map((row) => ({
    project: row.code,
    sold: row.sold,
    reserved: row.reserved,
  }));

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
          <span>Project Analytics</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
            <Search className="h-4 w-4 text-[#46a4a8]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
              placeholder="Search project"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Projects", String(rows.length)],
          ["Units Sold", String(totalSold)],
          ["Revenue Generated", money(totalRevenue)],
          ["Avg Health Score", `${avgHealth}%`],
        ].map(([label, value]) => (
          <article key={label} className="rounded-md border border-[#dbe4eb] bg-white p-4">
            <p className="text-xs text-[#7f8a99]">{label}</p>
            <p className="mt-2 text-xl font-semibold text-[#1f2a44]">{value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
        <h2 className="text-base font-semibold text-[#1f2a44]">Monthly Project Sales Trend</h2>
        <div className="mt-4 h-[300px] w-full">
          {analytics.loading ? (
            <div className="h-full w-full animate-pulse rounded-md bg-[#eef3f6]" />
          ) : chartData.length === 0 ? (
            <div className="grid h-full w-full place-items-center rounded-md border border-dashed border-[#dbe4eb] text-sm text-[#7f8a99]">
              No project sales trend data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6edf3" />
                <XAxis dataKey="project" tick={{ fill: "#607187", fontSize: 11 }} />
                <YAxis tick={{ fill: "#607187", fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #dbe4eb", backgroundColor: "#fff" }} />
                <Bar dataKey="sold" fill="#3aa4a8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="reserved" fill="#9dcfd8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] text-[#38a0a6]">Total(<span className="font-bold">{rows.length}</span>)</p>
        </div>
        <div className="min-h-[520px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Units Sold</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Broker Count</th>
                <th className="px-4 py-3">Sales Speed</th>
                <th className="px-4 py-3">Health</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {analytics.loading && <TableSkeletonRows cols={7} rows={8} />}
              {!analytics.loading && pageRows.map((row) => (
                <tr key={row.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#1f2a44]">{row.name}</p>
                    <p className="text-xs text-[#7f8a99]">{row.code}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.sold}</td>
                  <td className="px-4 py-3">{money(row.revenue)}</td>
                  <td className="px-4 py-3">{row.brokerCount}</td>
                  <td className="px-4 py-3">{row.salesSpeed}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-[#e6f6f7] px-2 py-1 text-xs font-semibold text-[#1f7d79]">{row.healthScore}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/portal/projects/${encodeURIComponent(row.id)}`}
                      className="inline-flex rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078]"
                      aria-label="Open project"
                      title="Open project"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {!analytics.loading && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]"><td className="px-4 py-6 text-[#7f8a99]" colSpan={7}>No project analytics yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {!analytics.loading && rows.length > 0 && (
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
