"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useDownloadReportExport, useGenerateReportExport, useReportExportHistory } from "@/hooks/use-report-exports";
import { runWithToast } from "@/lib/ui/toast";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";

export default function BrokerExportsCenterPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "broker";
  const exportScopeKey = `broker:${brokerId}`;
  const historyQuery = useReportExportHistory(exportScopeKey, 300);
  const exportReport = useGenerateReportExport(exportScopeKey);
  const downloadExport = useDownloadReportExport();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (historyQuery.data ?? []).filter(
      (row) =>
        !q ||
        row.id.toLowerCase().includes(q) ||
        row.reportType.toLowerCase().includes(q) ||
        row.format.toLowerCase().includes(q),
    );
  }, [historyQuery.data, search]);
  const isInitialLoading = historyQuery.isLoading && filteredRows.length === 0;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div className="space-y-5 pb-6">
      {historyQuery.error && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {historyQuery.error instanceof Error ? historyQuery.error.message : "Failed to load export history."}
        </section>
      )}
      <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
        <h2 className="text-base font-semibold text-[#1f2a44]">Exports Center</h2>
        <p className="mt-1 text-sm text-[#607187]">Centralized export history for broker reporting outputs.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="ui-btn-secondary inline-flex items-center gap-2"
            onClick={async () => {
              try {
                await runWithToast({
                  loading: "Generating PDF export...",
                  success: "PDF export generated.",
                  action: () =>
                    exportReport.mutateAsync({
                      reportType: "Executive Summary",
                      format: "PDF",
                      filtersSummary: "default",
                      generatedBy: brokerId,
                    }),
                });
              } catch {}
            }}
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </button>
          <button
            type="button"
            className="ui-btn-secondary inline-flex items-center gap-2"
            onClick={async () => {
              try {
                await runWithToast({
                  loading: "Generating Excel export...",
                  success: "Excel export generated.",
                  action: () =>
                    exportReport.mutateAsync({
                      reportType: "Executive Summary",
                      format: "Excel",
                      filtersSummary: "default",
                      generatedBy: brokerId,
                    }),
                });
              } catch {}
            }}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
        <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
            placeholder="Search exports by ID, type, format"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] text-[#38a0a6]">
            Total(<span className="font-bold">{filteredRows.length}</span>)
          </p>
        </div>
        <div className="min-h-[560px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Export ID</th>
                <th className="px-4 py-3">Report Type</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Filters</th>
                <th className="px-4 py-3">Generated By</th>
                <th className="px-4 py-3">Generated At</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {isInitialLoading && <TableSkeletonRows cols={7} rows={8} />}
              {!isInitialLoading &&
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.id}</td>
                    <td className="px-4 py-3">{row.reportType}</td>
                    <td className="px-4 py-3">{row.format}</td>
                    <td className="px-4 py-3">{row.filtersSummary}</td>
                    <td className="px-4 py-3">{row.generatedBy}</td>
                    <td className="px-4 py-3">{new Date(row.generatedAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078] hover:bg-[#edf2f7]"
                        title="Download"
                        disabled={downloadExport.isPending}
                        onClick={async () => {
                          try {
                            await runWithToast({
                              loading: "Preparing export download...",
                              success: "Download started.",
                              action: () => downloadExport.mutateAsync({ exportId: row.id }),
                            });
                          } catch {}
                        }}
                      >
                        {downloadExport.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                  </tr>
                ))}
              {!isInitialLoading && filteredRows.length === 0 ? (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={7}>
                    No export history yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {!isInitialLoading && filteredRows.length > 0 && (
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
