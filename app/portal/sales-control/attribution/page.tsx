"use client";

import { useMemo } from "react";
import { House } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useSalesAttribution } from "@/hooks/use-sales-control";
import { BrokerCell } from "@/components/ui/broker-cell";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";

export default function SalesAttributionPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";
  const attributionQuery = useSalesAttribution(developerId);

  const rows = useMemo(() => attributionQuery.data ?? [], [attributionQuery.data]);

  return (
    <div className="space-y-5 pb-6">
      <section className="flex items-center gap-2 text-sm text-[#7f8a99]">
        <House className="h-3.5 w-3.5" />
        <span>/</span>
        <span>Sales Control</span>
        <span>/</span>
        <span>Sales Attribution</span>
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
                <th className="px-4 py-3">Sale Request</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Broker</th>
                <th className="px-4 py-3">Agreement</th>
                <th className="px-4 py-3">Sold By</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {attributionQuery.isLoading && <TableSkeletonRows cols={6} rows={8} />}
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.saleRequestId}</td>
                  <td className="px-4 py-3">{row.propertyId}</td>
                  <td className="px-4 py-3">
                    <BrokerCell brokerId={row.brokerId} />
                  </td>
                  <td className="px-4 py-3">{row.agreementId}</td>
                  <td className="px-4 py-3">{row.soldBy}</td>
                  <td className="px-4 py-3">{new Date(row.soldAt).toLocaleString()}</td>
                </tr>
              ))}
              {!attributionQuery.isLoading && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={6}>
                    No attribution records yet.
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
