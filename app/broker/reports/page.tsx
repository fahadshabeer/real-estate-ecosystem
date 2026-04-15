"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useBrokerReports } from "@/hooks/use-broker-reports";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { DeveloperCell } from "@/components/ui/developer-cell";

function money(value: number) {
  return new Intl.NumberFormat("en-QA", {
    style: "currency",
    currency: "QAR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function BrokerMonthlyReportsPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId;
  const reports = useBrokerReports(brokerId);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.monthlyRows.filter((row) => !q || row.monthLabel.toLowerCase().includes(q));
  }, [reports.monthlyRows, search]);
  const isInitialLoading = reports.loading && rows.length === 0;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [currentPage, rows]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalRevenue = rows.reduce((sum, row) => sum + row.revenueEstimate, 0);
  const totalSubmitted = rows.reduce((sum, row) => sum + row.submitted, 0);
  const totalApproved = rows.reduce((sum, row) => sum + row.approved, 0);
  const totalRejected = rows.reduce((sum, row) => sum + row.rejected, 0);

  return (
    <div className="space-y-5 pb-6">
      {reports.error && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {reports.error}
        </section>
      )}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Submitted Sales", String(totalSubmitted)],
          ["Approved Sales", String(totalApproved)],
          ["Rejected Sales", String(totalRejected)],
          ["Revenue Contribution", money(totalRevenue)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-md border border-[#dbe4eb] bg-white p-4">
            <p className="text-xs text-[#7f8a99]">{label}</p>
            <p className="mt-2 text-xl font-semibold text-[#1f2a44]">{value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
        <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
          <Search className="h-4 w-4 text-[#46a4a8]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
            placeholder="Search month report"
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
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Approved</th>
                <th className="px-4 py-3">Rejected</th>
                <th className="px-4 py-3">Top Developer</th>
                <th className="px-4 py-3">Top Agent</th>
              </tr>
            </thead>
            <tbody>
              {isInitialLoading && <TableSkeletonRows cols={6} rows={8} />}
              {!isInitialLoading &&
                pageRows.map((row) => (
                  <tr key={row.month} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.monthLabel}</td>
                    <td className="px-4 py-3">{row.submitted}</td>
                    <td className="px-4 py-3">{row.approved}</td>
                    <td className="px-4 py-3">{row.rejected}</td>
                    <td className="px-4 py-3">
                      {row.topDeveloper === "-" ? "-" : <DeveloperCell developerId={row.topDeveloper} />}
                    </td>
                    <td className="px-4 py-3">{row.topAgent}</td>
                  </tr>
                ))}
              {!isInitialLoading && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={6}>
                    No monthly reports found.
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
