"use client";

import { useMemo } from "react";
import { useAppContext } from "@/components/state/app-context";
import { useVisibleBrokerProperties } from "@/hooks/use-properties";
import { useBrokerSalesRequests } from "@/hooks/use-sales-control";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";

export default function BrokerReservedSoldPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const propertiesQuery = useVisibleBrokerProperties(brokerId);
  const salesQuery = useBrokerSalesRequests(brokerId);

  const reservedRows = useMemo(
    () => (propertiesQuery.data ?? []).filter((row) => row.status === "Reserved"),
    [propertiesQuery.data],
  );
  const soldRows = useMemo(
    () => (salesQuery.data ?? []).filter((row) => row.status === "Approved"),
    [salesQuery.data],
  );
  const showReservedSkeleton = propertiesQuery.isLoading && reservedRows.length === 0;
  const showSoldSkeleton = salesQuery.isLoading && soldRows.length === 0;

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">Reserved / Sold</h1>
        <p className="mt-1 text-sm text-[#607187]">Track reservation and sold-state inventory outcomes.</p>
      </section>

      {(propertiesQuery.error || salesQuery.error) && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {(propertiesQuery.error || salesQuery.error) instanceof Error
            ? ((propertiesQuery.error || salesQuery.error) as Error).message
            : "Unable to load reserved/sold data."}
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
          <div className="border-b border-[#ecf1f5] px-6 py-4">
            <p className="text-[16px] font-medium text-[#38a0a6]">Reserved(<span className="font-bold">{reservedRows.length}</span>)</p>
          </div>
          <div className="min-h-[340px] overflow-x-auto">
            <table className="min-w-full text-left text-sm text-[#4f6078]">
              <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
                <tr>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Reserved Date</th>
                  <th className="px-4 py-3">Agreement</th>
                </tr>
              </thead>
              <tbody>
                {showReservedSkeleton && <TableSkeletonRows cols={3} rows={5} />}
                {!showReservedSkeleton &&
                  reservedRows.map((row) => (
                    <tr key={`${row.id}-${row.agreementId}`} className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-3">{row.id}</td>
                      <td className="px-4 py-3">{new Date(row.sharedDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{row.agreementId}</td>
                    </tr>
                  ))}
                {!showReservedSkeleton && reservedRows.length === 0 && (
                  <tr className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-6 text-[#7f8a99]" colSpan={3}>No reserved units.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
          <div className="border-b border-[#ecf1f5] px-6 py-4">
            <p className="text-[16px] font-medium text-[#38a0a6]">Sold(<span className="font-bold">{soldRows.length}</span>)</p>
          </div>
          <div className="min-h-[340px] overflow-x-auto">
            <table className="min-w-full text-left text-sm text-[#4f6078]">
              <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
                <tr>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Approved Sale Date</th>
                  <th className="px-4 py-3">Developer</th>
                </tr>
              </thead>
              <tbody>
                {showSoldSkeleton && <TableSkeletonRows cols={3} rows={5} />}
                {!showSoldSkeleton &&
                  soldRows.map((row) => (
                    <tr key={row.id} className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-3">{row.propertyCode}</td>
                      <td className="px-4 py-3">{row.approvedAt ? new Date(row.approvedAt).toLocaleDateString() : "-"}</td>
                      <td className="px-4 py-3">{row.developerId}</td>
                    </tr>
                  ))}
                {!showSoldSkeleton && soldRows.length === 0 && (
                  <tr className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-6 text-[#7f8a99]" colSpan={3}>No sold units yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
