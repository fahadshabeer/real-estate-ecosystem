"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, House, Search } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { BrokerCell } from "@/components/ui/broker-cell";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { useGenerateReportExport } from "@/hooks/use-report-exports";
import { useReportsModule } from "@/hooks/use-reports-module";
import { runWithToast } from "@/lib/ui/toast";

function money(value: number) {
  return new Intl.NumberFormat("en-QA", { style: "currency", currency: "QAR", maximumFractionDigits: 0 }).format(value);
}

export default function BrokerReportsPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId;
  const reports = useReportsModule(developerId);
  const exportMutation = useGenerateReportExport(`developer:${developerId ?? ""}`);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.brokerRows.filter((row) => !q || row.brokerId.toLowerCase().includes(q));
  }, [reports.brokerRows, search]);
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
          <span>Broker Reports</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
            <Search className="h-4 w-4 text-[#46a4a8]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
              placeholder="Search broker"
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md bg-[#3aa4a8] px-4 py-2 text-sm font-semibold text-white"
            onClick={async () => {
              try {
                await runWithToast({
                  loading: "Generating broker report...",
                  success: "Broker report generated.",
                  action: () =>
                    exportMutation.mutateAsync({
                      reportType: "Broker Performance Report",
                      format: "Excel",
                      filtersSummary: search ? `Broker contains \"${search}\"` : "All brokers",
                      generatedBy: developerId ?? "developer",
                    }),
                });
              } catch {}
            }}
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
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
                <th className="px-4 py-3">Broker</th>
                <th className="px-4 py-3">Properties Shared</th>
                <th className="px-4 py-3">Deals Closed</th>
                <th className="px-4 py-3">Approval Rate</th>
                <th className="px-4 py-3">Revenue Contribution</th>
                <th className="px-4 py-3">Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {reports.loading && <TableSkeletonRows cols={6} rows={8} />}
              {!reports.loading && pageRows.map((row) => (
                <tr key={row.brokerId} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3"><BrokerCell brokerId={row.brokerId} /></td>
                  <td className="px-4 py-3">{row.propertiesShared}</td>
                  <td className="px-4 py-3">{row.dealsClosed}</td>
                  <td className="px-4 py-3">{row.approvalRate.toFixed(1)}%</td>
                  <td className="px-4 py-3">{money(row.revenueContribution)}</td>
                  <td className="px-4 py-3">{row.conversionRate.toFixed(1)}%</td>
                </tr>
              ))}
              {!reports.loading && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]"><td className="px-4 py-6 text-[#7f8a99]" colSpan={6}>No broker report data yet.</td></tr>
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
    </div>
  );
}
