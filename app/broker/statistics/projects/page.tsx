"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useBrokerAnalytics } from "@/hooks/use-broker-analytics";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { DeveloperCell } from "@/components/ui/developer-cell";

export default function BrokerProjectAnalyticsPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId;
  const analytics = useBrokerAnalytics(brokerId);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return analytics.projectRows.filter((row) => !q || [row.projectName, row.developerId, row.demandLevel].join(" ").toLowerCase().includes(q));
  }, [analytics.projectRows, search]);
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
      <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
        <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
          <Search className="h-4 w-4 text-[#46a4a8]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
            placeholder="Search project analytics"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] text-[#38a0a6]">
            Total(<span className="font-bold">{rows.length}</span>)
          </p>
        </div>
        <div className="min-h-[560px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Developer</th>
                <th className="px-4 py-3">Units Visible</th>
                <th className="px-4 py-3">Submitted Sales</th>
                <th className="px-4 py-3">Approved Sales</th>
                <th className="px-4 py-3">Demand Level</th>
                <th className="px-4 py-3">Badge</th>
              </tr>
            </thead>
            <tbody>
              {isInitialLoading && <TableSkeletonRows cols={7} rows={8} />}
              {!isInitialLoading &&
                pageRows.map((row, index) => (
                  <tr key={`${row.projectName}-${row.developerId}`} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.projectName}</td>
                    <td className="px-4 py-3">
                      <DeveloperCell developerId={row.developerId} />
                    </td>
                    <td className="px-4 py-3">{row.unitsVisible}</td>
                    <td className="px-4 py-3">{row.submittedSales}</td>
                    <td className="px-4 py-3">{row.approvedSales}</td>
                    <td className="px-4 py-3">{row.demandLevel}</td>
                    <td className="px-4 py-3">
                      {(currentPage - 1) * pageSize + index === 0 ? (
                        <span className="rounded-md bg-[#e6f6f7] px-2 py-1 text-xs font-semibold text-[#1f7d79]">
                          Fastest Moving
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              {!isInitialLoading && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={7}>
                    No project analytics records found.
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
