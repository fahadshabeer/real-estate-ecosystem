"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileText, House, Loader2 } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { useDownloadReportExport, useGenerateReportExport, useReportExportHistory } from "@/hooks/use-report-exports";
import { runWithToast } from "@/lib/ui/toast";

export default function ExportsCenterPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId;
  const exportScopeKey = `developer:${developerId ?? ""}`;
  const exportHistory = useReportExportHistory(exportScopeKey, 300);
  const generateExport = useGenerateReportExport(exportScopeKey);
  const downloadExport = useDownloadReportExport();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (exportHistory.data ?? []).filter(
      (row) =>
        !q ||
        row.id.toLowerCase().includes(q) ||
        row.reportType.toLowerCase().includes(q) ||
        row.format.toLowerCase().includes(q),
    );
  }, [exportHistory.data, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div className="space-y-5 pb-6">
      {exportHistory.error && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {exportHistory.error instanceof Error ? exportHistory.error.message : "Failed to load export history."}
        </section>
      )}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-[#7f8a99]">
          <House className="h-3.5 w-3.5" />
          <span>/</span>
          <span>Reports</span>
          <span>/</span>
          <span>Exports Center</span>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <button
          type="button"
          className="rounded-md border border-[#dbe4eb] bg-white p-4 text-left"
          onClick={async () => {
            try {
              await runWithToast({
                loading: "Generating monthly executive PDF...",
                success: "Executive PDF generated.",
                action: () =>
                  generateExport.mutateAsync({
                    reportType: "Executive Summary",
                    format: "PDF",
                    filtersSummary: "Auto summary",
                    generatedBy: developerId ?? "developer",
                  }),
              });
            } catch {}
          }}
        >
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#eef6ff] text-[#2f6399]"><FileText className="h-4 w-4" /></div>
          <p className="mt-3 text-sm font-semibold text-[#1f2a44]">Export Executive PDF</p>
          <p className="mt-1 text-xs text-[#7f8a99]">Board-ready monthly summary</p>
        </button>

        <button
          type="button"
          className="rounded-md border border-[#dbe4eb] bg-white p-4 text-left"
          onClick={async () => {
            try {
              await runWithToast({
                loading: "Generating broker Excel export...",
                success: "Broker Excel generated.",
                action: () =>
                  generateExport.mutateAsync({
                    reportType: "Broker Matrix",
                    format: "Excel",
                    filtersSummary: "Active broker matrix",
                    generatedBy: developerId ?? "developer",
                  }),
              });
            } catch {}
          }}
        >
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#eaf8ee] text-[#2d7a46]"><FileSpreadsheet className="h-4 w-4" /></div>
          <p className="mt-3 text-sm font-semibold text-[#1f2a44]">Export Broker Excel</p>
          <p className="mt-1 text-xs text-[#7f8a99]">Detailed broker-level metrics</p>
        </button>

        <button
          type="button"
          className="rounded-md border border-[#dbe4eb] bg-white p-4 text-left"
          onClick={async () => {
            try {
              await runWithToast({
                loading: "Generating inventory CSV...",
                success: "Inventory CSV generated.",
                action: () =>
                  generateExport.mutateAsync({
                    reportType: "Inventory Snapshot",
                    format: "CSV",
                    filtersSummary: "All projects and statuses",
                    generatedBy: developerId ?? "developer",
                  }),
              });
            } catch {}
          }}
        >
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#f5f9fb] text-[#607187]"><Download className="h-4 w-4" /></div>
          <p className="mt-3 text-sm font-semibold text-[#1f2a44]">Export Inventory CSV</p>
          <p className="mt-1 text-xs text-[#7f8a99]">Operations handoff format</p>
        </button>
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
          <p className="text-[16px] text-[#38a0a6]">Total(<span className="font-bold">{filteredRows.length}</span>)</p>
        </div>
        <div className="min-h-[520px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Export ID</th>
                <th className="px-4 py-3">Report Type</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Filters</th>
                <th className="px-4 py-3">Generated At</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {exportHistory.isLoading && <TableSkeletonRows cols={6} rows={8} />}
              {!exportHistory.isLoading && pageRows.map((row) => (
                <tr key={row.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.id}</td>
                  <td className="px-4 py-3">{row.reportType}</td>
                  <td className="px-4 py-3">{row.format}</td>
                  <td className="px-4 py-3">{row.filtersSummary}</td>
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
              {!exportHistory.isLoading && filteredRows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]"><td className="px-4 py-6 text-[#7f8a99]" colSpan={6}>No exports yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {!exportHistory.isLoading && filteredRows.length > 0 && (
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
