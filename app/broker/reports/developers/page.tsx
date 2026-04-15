"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useBrokerReports } from "@/hooks/use-broker-reports";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { DeveloperCell } from "@/components/ui/developer-cell";
import { useGenerateReportExport } from "@/hooks/use-report-exports";
import { runWithToast } from "@/lib/ui/toast";

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

export default function BrokerDeveloperReportsPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId;
  const reports = useBrokerReports(brokerId);
  const exportReport = useGenerateReportExport(`broker:${brokerId ?? ""}`);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.developerRows.filter((row) => !q || row.developerId.toLowerCase().includes(q));
  }, [reports.developerRows, search]);
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

  return (
    <div className="space-y-5 pb-6">
      {reports.error && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {reports.error}
        </section>
      )}
      <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
            <Search className="h-4 w-4 text-[#46a4a8]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
              placeholder="Search developer reports"
            />
          </div>
          <button
            type="button"
            className="ui-btn-secondary inline-flex items-center gap-2"
            onClick={async () => {
              try {
                await runWithToast({
                  loading: "Generating developer report export...",
                  success: "Developer report exported.",
                  action: () =>
                    exportReport.mutateAsync({
                      reportType: "Developer Reports",
                      format: "Excel",
                      filtersSummary: `rows:${rows.length}`,
                      generatedBy: brokerId ?? "broker",
                    }),
                });
              } catch {}
            }}
          >
            <Download className="h-4 w-4" />
            Export Developer Report
          </button>
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
                <th className="px-4 py-3">Developer</th>
                <th className="px-4 py-3">Units Visible</th>
                <th className="px-4 py-3">Submitted Sales</th>
                <th className="px-4 py-3">Approved Sales</th>
                <th className="px-4 py-3">Contribution</th>
                <th className="px-4 py-3">Approval Speed</th>
              </tr>
            </thead>
            <tbody>
              {isInitialLoading && <TableSkeletonRows cols={6} rows={8} />}
              {!isInitialLoading &&
                pageRows.map((row) => (
                  <tr key={row.developerId} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3">
                      <DeveloperCell developerId={row.developerId} />
                    </td>
                    <td className="px-4 py-3">{row.unitsVisible}</td>
                    <td className="px-4 py-3">{row.submittedSales}</td>
                    <td className="px-4 py-3">{row.approvedSales}</td>
                    <td className="px-4 py-3">{percent(row.contribution)}</td>
                    <td className="px-4 py-3">{row.approvalSpeed}</td>
                  </tr>
                ))}
              {!isInitialLoading && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={6}>
                    No developer reports found.
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
