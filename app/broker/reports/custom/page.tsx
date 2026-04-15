"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import { useMemo, useState } from "react";
import { useAppContext } from "@/components/state/app-context";
import { useBrokerReports } from "@/hooks/use-broker-reports";
import { useGenerateReportExport } from "@/hooks/use-report-exports";
import { runWithToast } from "@/lib/ui/toast";

type ReportDimension = "Developer" | "Agent" | "Project";
type ReportStatus = "All" | "Approved" | "Pending" | "Rejected";

export default function BrokerCustomReportsPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId;
  const reports = useBrokerReports(brokerId);
  const exportReport = useGenerateReportExport(`broker:${brokerId ?? ""}`);

  const [dimension, setDimension] = useState<ReportDimension>("Developer");
  const [status, setStatus] = useState<ReportStatus>("All");
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [previewOpen, setPreviewOpen] = useState(false);

  const filteredSales = useMemo(() => {
    const now = Date.now();
    const maxAgeDays = dateRange === "Last 7 days" ? 7 : dateRange === "Last 90 days" ? 90 : 30;
    return reports.analytics.sales.filter((sale) => {
      const statusOk = status === "All" ? true : sale.status === status;
      const submittedAt = new Date(sale.submittedAt).getTime();
      const dateOk = Number.isFinite(submittedAt) ? now - submittedAt <= maxAgeDays * 86400000 : false;
      return statusOk && dateOk;
    });
  }, [dateRange, reports.analytics.sales, status]);

  const previewRows = useMemo(() => {
    if (dimension === "Developer") {
      return reports.developerRows.map((row) => {
        const submittedSales = filteredSales.filter((sale) => sale.developerId === row.developerId).length;
        const approvedSales = filteredSales.filter(
          (sale) => sale.developerId === row.developerId && sale.status === "Approved",
        ).length;
        return {
        key: row.developerId,
        label: row.developerId,
        a: row.unitsVisible,
        b: submittedSales,
        c: approvedSales,
      };
      });
    }
    if (dimension === "Agent") {
      return reports.agentRows.map((row) => {
        const submittedSales = filteredSales.filter((sale) => sale.brokerAgentId === row.agentId).length;
        const approvedSales = filteredSales.filter(
          (sale) => sale.brokerAgentId === row.agentId && sale.status === "Approved",
        ).length;
        return {
        key: row.agentId,
        label: row.name,
        a: row.assignedUnits,
        b: submittedSales,
        c: approvedSales,
      };
      });
    }
    return reports.projectRows.map((row) => {
      const submittedSales = filteredSales.filter((sale) => sale.projectName === row.projectName).length;
      const approvedSales = filteredSales.filter(
        (sale) => sale.projectName === row.projectName && sale.status === "Approved",
      ).length;
      return {
      key: `${row.projectName}-${row.developerId}`,
      label: row.projectName,
      a: row.unitsVisible,
      b: submittedSales,
      c: approvedSales,
    };
    });
  }, [dimension, filteredSales, reports.agentRows, reports.developerRows, reports.projectRows]);

  return (
    <div className="space-y-5 pb-6">
      {reports.error && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {reports.error}
        </section>
      )}
      <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
        <h2 className="text-base font-semibold text-[#1f2a44]">Custom Reports</h2>
        <p className="mt-1 text-sm text-[#607187]">Build management-focused reports with custom dimensions and filters.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="ui-label">
            Dimension
            <FancySelect className="ui-select" value={dimension} onChange={(e) => setDimension(e.target.value as ReportDimension)}>
              <option>Developer</option>
              <option>Agent</option>
              <option>Project</option>
            </FancySelect>
          </label>
          <label className="ui-label">
            Status
            <FancySelect className="ui-select" value={status} onChange={(e) => setStatus(e.target.value as ReportStatus)}>
              <option>All</option>
              <option>Approved</option>
              <option>Pending</option>
              <option>Rejected</option>
            </FancySelect>
          </label>
          <label className="ui-label">
            Date Range
            <FancySelect className="ui-select" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </FancySelect>
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="ui-btn-secondary" onClick={() => setPreviewOpen((prev) => !prev)}>
            {previewOpen ? "Hide Preview" : "Generate Preview"}
          </button>
          <button
            type="button"
            className="ui-btn-primary"
            disabled={exportReport.isPending}
            onClick={async () => {
              try {
                await runWithToast({
                  loading: "Exporting custom report...",
                  success: "Custom report exported.",
                  action: () =>
                    exportReport.mutateAsync({
                      reportType: "Custom Reports",
                      format: "PDF",
                      filtersSummary: `${dimension} | ${status} | ${dateRange}`,
                      generatedBy: brokerId ?? "broker",
                    }),
                });
              } catch {}
            }}
          >
            {exportReport.isPending ? "Exporting..." : "Export Report"}
          </button>
        </div>
      </section>

      {previewOpen ? (
        <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
          <div className="border-b border-[#ecf1f5] px-6 py-4">
            <h3 className="text-base font-semibold text-[#1f2a44]">Preview · {dimension} Report</h3>
          </div>
          <div className="min-h-[360px] overflow-x-auto">
            <table className="min-w-full text-left text-sm text-[#4f6078]">
              <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
                <tr>
                  <th className="px-4 py-3">{dimension}</th>
                  <th className="px-4 py-3">Visible/Assigned</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Approved</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => (
                  <tr key={row.key} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.label}</td>
                    <td className="px-4 py-3">{row.a}</td>
                    <td className="px-4 py-3">{row.b}</td>
                    <td className="px-4 py-3">{row.c}</td>
                  </tr>
                ))}
                {previewRows.length === 0 ? (
                  <tr className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-6 text-[#7f8a99]" colSpan={4}>
                      No preview rows available.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
