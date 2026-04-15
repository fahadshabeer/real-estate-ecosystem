"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileText, House, Search } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { useGenerateReportExport } from "@/hooks/use-report-exports";
import { useReportsModule } from "@/hooks/use-reports-module";
import { runWithToast } from "@/lib/ui/toast";

function money(value: number) {
  return new Intl.NumberFormat("en-QA", { style: "currency", currency: "QAR", maximumFractionDigits: 0 }).format(value);
}

export default function MonthlyReportsPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId;
  const reports = useReportsModule(developerId);
  const exportMutation = useGenerateReportExport(`developer:${developerId ?? ""}`);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.monthlyRows.filter((row) => !q || row.monthLabel.toLowerCase().includes(q));
  }, [reports.monthlyRows, search]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [currentPage, rows]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const sold = rows.reduce((sum, row) => sum + row.soldUnits, 0);
  const revenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const activeBrokers = Math.max(...rows.map((row) => row.brokerCount), 0);
  const newAgreements = rows.reduce((sum, row) => sum + row.agreementsCreated, 0);

  return (
    <div className="space-y-5 pb-6">
      {reports.error && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {reports.error}
        </section>
      )}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-[#7f8a99]">
          <House className="h-3.5 w-3.5" />
          <span>/</span>
          <span>Reports</span>
          <span>/</span>
          <span>Monthly Reports</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
            <Search className="h-4 w-4 text-[#46a4a8]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
              placeholder="Search month"
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md bg-[#3aa4a8] px-4 py-2 text-sm font-semibold text-white"
            onClick={async () => {
              try {
                await runWithToast({
                  loading: "Generating monthly PDF report...",
                  success: "Monthly report generated.",
                  action: () =>
                    exportMutation.mutateAsync({
                      reportType: "Monthly Report",
                      format: "PDF",
                      filtersSummary: search ? `Month contains \"${search}\"` : "All months",
                      generatedBy: developerId ?? "developer",
                    }),
                });
              } catch {}
            }}
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Units Sold", String(sold)],
          ["Revenue Generated", money(revenue)],
          ["Active Brokers", String(activeBrokers)],
          ["New Agreements", String(newAgreements)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-md border border-[#dbe4eb] bg-white p-4">
            <p className="text-xs text-[#7f8a99]">{label}</p>
            <p className="mt-2 text-xl font-semibold text-[#1f2a44]">{value}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] text-[#38a0a6]">Total(<span className="font-bold">{rows.length}</span>)</p>
        </div>
        <div className="min-h-[520px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Sold Units</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Broker Count</th>
                <th className="px-4 py-3">Agreements Created</th>
                <th className="px-4 py-3">MoM</th>
              </tr>
            </thead>
            <tbody>
              {reports.loading && <TableSkeletonRows cols={6} rows={8} />}
              {!reports.loading && pageRows.map((row) => (
                <tr key={row.month} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.monthLabel}</td>
                  <td className="px-4 py-3">{row.soldUnits}</td>
                  <td className="px-4 py-3">{money(row.revenue)}</td>
                  <td className="px-4 py-3">{row.brokerCount}</td>
                  <td className="px-4 py-3">{row.agreementsCreated}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-[#eef6ff] px-2 py-1 text-xs font-semibold text-[#3f6ea8]">
                      {row.mom >= 0 ? "+" : ""}
                      {row.mom.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              {!reports.loading && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]"><td className="px-4 py-6 text-[#7f8a99]" colSpan={6}>No monthly report data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {!reports.loading && rows.length > 0 && (
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

      <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
        <div className="inline-flex items-center gap-2 rounded-md bg-[#f5f9fb] px-3 py-2 text-sm text-[#4f6078]">
          <FileText className="h-4 w-4" />
          Executive Summary: Monthly sales and broker participation trends are now available for management review and legal follow-up.
        </div>
      </section>
    </div>
  );
}
