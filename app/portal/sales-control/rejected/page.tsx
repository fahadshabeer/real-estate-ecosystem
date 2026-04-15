"use client";

import { useMemo } from "react";
import { House } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useSalesRequests } from "@/hooks/use-sales-control";
import { BrokerCell } from "@/components/ui/broker-cell";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";

export default function RejectedSalesPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";
  const requestsQuery = useSalesRequests(developerId);

  const rows = useMemo(
    () => (requestsQuery.data ?? []).filter((row) => row.status === "Rejected"),
    [requestsQuery.data],
  );

  return (
    <div className="space-y-5 pb-6">
      <section className="flex items-center gap-2 text-sm text-[#7f8a99]">
        <House className="h-3.5 w-3.5" />
        <span>/</span>
        <span>Sales Control</span>
        <span>/</span>
        <span>Rejected Sales</span>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{rows.length}</span>)
          </p>
        </div>
        <div className="min-h-[500px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Request ID</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Broker</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Rejected Date</th>
              </tr>
            </thead>
            <tbody>
              {requestsQuery.isLoading && <TableSkeletonRows cols={5} rows={8} />}
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.id}</td>
                  <td className="px-4 py-3">{row.propertyCode}</td>
                  <td className="px-4 py-3">
                    <BrokerCell brokerId={row.brokerId} />
                  </td>
                  <td className="px-4 py-3">{row.rejectReason ?? "—"}</td>
                  <td className="px-4 py-3">{row.rejectedAt ? new Date(row.rejectedAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
              {!requestsQuery.isLoading && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>
                    No rejected sales yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
