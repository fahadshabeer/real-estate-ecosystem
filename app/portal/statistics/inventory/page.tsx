"use client";

import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { House, Search } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { useAnalyticsModule } from "@/hooks/use-analytics-module";

const COLORS = ["#56b67f", "#f1c05c", "#f07171", "#98a6b8"];

export default function InventoryAnalyticsPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId;
  const analytics = useAnalyticsModule(developerId);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return analytics.typeRows.filter((row) => !q || row.type.toLowerCase().includes(q));
  }, [analytics.typeRows, search]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [currentPage, rows]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const pieData = [
    { label: "Available", value: analytics.inventoryStatus.available },
    { label: "Reserved", value: analytics.inventoryStatus.reserved },
    { label: "Sold", value: analytics.inventoryStatus.sold },
    { label: "Blocked", value: analytics.inventoryStatus.blocked },
  ];

  const aging90 = analytics.properties.filter((row) => row.status === "Available" && (Date.now() - new Date(row.createdAt).getTime()) / 86400000 > 90).length;

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
          <span>Inventory Analytics</span>
        </div>
        <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
          <Search className="h-4 w-4 text-[#46a4a8]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
            placeholder="Search property type"
          />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Total Units", String(analytics.inventoryStatus.total)],
          ["Available", String(analytics.inventoryStatus.available)],
          ["Reserved", String(analytics.inventoryStatus.reserved)],
          ["Sold", String(analytics.inventoryStatus.sold)],
          ["Aging 90+ Days", String(aging90)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-md border border-[#dbe4eb] bg-white p-4">
            <p className="text-xs text-[#7f8a99]">{label}</p>
            <p className="mt-2 text-xl font-semibold text-[#1f2a44]">{value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
        <h2 className="text-base font-semibold text-[#1f2a44]">Inventory Status Distribution</h2>
        <div className="mt-4 h-[290px] w-full">
          {analytics.loading ? (
            <div className="h-full w-full animate-pulse rounded-md bg-[#eef3f6]" />
          ) : pieData.every((row) => row.value === 0) ? (
            <div className="grid h-full w-full place-items-center rounded-md border border-dashed border-[#dbe4eb] text-sm text-[#7f8a99]">
              No inventory distribution data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={95}>
                  {pieData.map((entry, index) => (
                    <Cell key={entry.label} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #dbe4eb", backgroundColor: "#fff" }} />
              </PieChart>
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
                <th className="px-4 py-3">Property Type</th>
                <th className="px-4 py-3">Units</th>
                <th className="px-4 py-3">Average Sale Time</th>
                <th className="px-4 py-3">Demand Hits</th>
                <th className="px-4 py-3">Demand Level</th>
              </tr>
            </thead>
            <tbody>
              {analytics.loading && <TableSkeletonRows cols={5} rows={8} />}
              {!analytics.loading && pageRows.map((row) => (
                <tr key={row.type} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.type}</td>
                  <td className="px-4 py-3">{row.count}</td>
                  <td className="px-4 py-3">{row.avgSaleDays > 0 ? `${Math.round(row.avgSaleDays)} days` : "No sold data"}</td>
                  <td className="px-4 py-3">{row.demandHits}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-[#eef6ff] px-2 py-1 text-xs font-semibold text-[#3f6ea8]">{row.demandLevel}</span>
                  </td>
                </tr>
              ))}
              {!analytics.loading && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]"><td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>No inventory analytics yet.</td></tr>
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
