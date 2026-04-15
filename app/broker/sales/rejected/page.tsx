"use client";

import { useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useBrokerSalesRequests } from "@/hooks/use-sales-control";
import { SaleRequestStatusPill } from "@/components/broker/sale-request-status-pill";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { DeveloperCell } from "@/components/ui/developer-cell";

export default function BrokerRejectedSalesPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const salesQuery = useBrokerSalesRequests(brokerId);
  const rows = useMemo(() => (salesQuery.data ?? []).filter((row) => row.status === "Rejected"), [salesQuery.data]);
  const showInitialSkeleton = salesQuery.isLoading && rows.length === 0;

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (!q) return true;
      return [row.id, row.propertyCode, row.projectName, row.agreementId, row.developerId, row.rejectReason ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, search]);

  const selected = selectedId ? rows.find((row) => row.id === selectedId) ?? null : null;

  return (
    <div className="space-y-5 pb-6">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#dbe4eb] bg-white p-4">
        <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
          <Search className="h-4 w-4 text-[#46a4a8]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
            placeholder="Search rejected requests"
          />
        </div>
      </section>

      {salesQuery.error && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {salesQuery.error instanceof Error ? salesQuery.error.message : "Unable to load rejected sales."}
        </section>
      )}

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{filtered.length}</span>)
          </p>
        </div>
        <div className="min-h-[560px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Request ID</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Developer</th>
                <th className="px-4 py-3">Agreement</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Rejected Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {showInitialSkeleton && <TableSkeletonRows cols={9} rows={8} />}
              {!showInitialSkeleton &&
                filtered.map((row) => (
                  <tr key={row.id} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.id}</td>
                    <td className="px-4 py-3">{row.propertyCode}</td>
                    <td className="px-4 py-3">{row.projectName}</td>
                    <td className="px-4 py-3">
                      <DeveloperCell developerId={row.developerId} />
                    </td>
                    <td className="px-4 py-3">{row.agreementId}</td>
                    <td className="px-4 py-3">{row.rejectReason ?? "-"}</td>
                    <td className="px-4 py-3">{new Date(row.rejectedAt ?? row.updatedAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <SaleRequestStatusPill status={row.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedId(row.id)}
                        className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#355069]"
                        title="Open"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              {!showInitialSkeleton && filtered.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={9}>
                    No rejected requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <h2 className="font-display text-lg text-[#1f2a44]">Rejected Sale Detail</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="ui-label">Request ID<input readOnly className="ui-input" value={selected.id} /></label>
            <label className="ui-label">Property<input readOnly className="ui-input" value={selected.propertyCode} /></label>
            <label className="ui-label">Project<input readOnly className="ui-input" value={selected.projectName} /></label>
            <label className="ui-label">Agreement<input readOnly className="ui-input" value={selected.agreementId} /></label>
            <label className="ui-label">Reject Reason<input readOnly className="ui-input" value={selected.rejectReason ?? "-"} /></label>
            <label className="ui-label">Rejected At<input readOnly className="ui-input" value={new Date(selected.rejectedAt ?? selected.updatedAt).toLocaleString()} /></label>
            <label className="ui-label sm:col-span-2 lg:col-span-3">Notes<textarea readOnly className="ui-textarea" value={selected.requestNotes ?? "-"} /></label>
          </div>
        </section>
      )}
    </div>
  );
}
