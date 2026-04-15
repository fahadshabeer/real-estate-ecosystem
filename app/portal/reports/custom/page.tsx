"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import { useMemo, useState } from "react";
import { Download, Filter, House } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useGenerateReportExport } from "@/hooks/use-report-exports";
import { useReportsModule } from "@/hooks/use-reports-module";
import { runWithToast } from "@/lib/ui/toast";

export default function CustomReportsPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId;
  const reports = useReportsModule(developerId);
  const exportMutation = useGenerateReportExport(`developer:${developerId ?? ""}`);

  const [project, setProject] = useState("all");
  const [broker, setBroker] = useState("all");
  const [status, setStatus] = useState("all");
  const [dateRange, setDateRange] = useState("30d");
  const [generated, setGenerated] = useState(false);

  const previewRows = useMemo(() => {
    return reports.raw.salesRequests.filter((row) => {
      if (project !== "all" && row.projectName !== project) return false;
      if (broker !== "all" && row.brokerId !== broker) return false;
      if (status !== "all" && row.status !== status) return false;
      return true;
    });
  }, [broker, project, reports.raw.salesRequests, status]);

  const filterSummary = "Project=" + project + ", Broker=" + broker + ", Status=" + status + ", Range=" + dateRange;

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
          <span>Custom Reports</span>
        </div>
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
        <h2 className="text-base font-semibold text-[#1f2a44]">Build Custom Report</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FancySelect value={project} onChange={(e) => setProject(e.target.value)} className="h-11 rounded-md border border-[#dbe4eb] px-3 text-sm">
            <option value="all">All Projects</option>
            {reports.projectRows.map((row) => (
              <option key={row.projectId} value={row.projectName}>{row.projectName}</option>
            ))}
          </FancySelect>
          <FancySelect value={broker} onChange={(e) => setBroker(e.target.value)} className="h-11 rounded-md border border-[#dbe4eb] px-3 text-sm">
            <option value="all">All Brokers</option>
            {reports.brokerRows.map((row) => (
              <option key={row.brokerId} value={row.brokerId}>{row.brokerId}</option>
            ))}
          </FancySelect>
          <FancySelect value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 rounded-md border border-[#dbe4eb] px-3 text-sm">
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Disputed">Disputed</option>
          </FancySelect>
          <FancySelect value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="h-11 rounded-md border border-[#dbe4eb] px-3 text-sm">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option>
          </FancySelect>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-md bg-[#3aa4a8] px-4 py-2 text-sm font-semibold text-white" onClick={() => setGenerated(true)}>
            <Filter className="h-4 w-4" />
            Generate Preview
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-4 py-2 text-sm font-semibold text-[#1f2a44]"
            onClick={async () => {
              try {
                await runWithToast({
                  loading: "Exporting custom report...",
                  success: "Custom report exported.",
                  action: () =>
                    exportMutation.mutateAsync({
                      reportType: "Custom Report",
                      format: "PDF",
                      filtersSummary: filterSummary,
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

      {generated && (
        <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
          <h3 className="text-base font-semibold text-[#1f2a44]">Report Preview</h3>
          <p className="mt-1 text-sm text-[#607187]">{filterSummary}</p>
          <div className="mt-3 space-y-2">
            {previewRows.slice(0, 20).map((row) => (
              <div key={row.id} className="rounded-md border border-[#e8eef3] bg-[#f8fafc] p-3 text-sm text-[#4f6078]">
                {row.id} | {row.projectName} | {row.propertyCode} | {row.brokerId} | {row.status}
              </div>
            ))}
            {previewRows.length === 0 && <p className="text-sm text-[#7f8a99]">No rows for selected filters.</p>}
          </div>
        </section>
      )}
    </div>
  );
}
