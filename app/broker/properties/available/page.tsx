"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppContext } from "@/components/state/app-context";
import { useVisibleBrokerProperties } from "@/hooks/use-properties";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { DeveloperCell } from "@/components/ui/developer-cell";

export default function BrokerAvailableUnitsPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const propertiesQuery = useVisibleBrokerProperties(brokerId);
  const rows = useMemo(
    () => (propertiesQuery.data ?? []).filter((row) => row.status === "Available"),
    [propertiesQuery.data],
  );
  const showInitialSkeleton = propertiesQuery.isLoading && rows.length === 0;

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">Available Units</h1>
        <p className="mt-1 text-sm text-[#607187]">Fast view of sellable inventory only.</p>
      </section>

      {propertiesQuery.error && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {propertiesQuery.error instanceof Error ? propertiesQuery.error.message : "Unable to load available units."}
        </section>
      )}

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">Total(<span className="font-bold">{rows.length}</span>)</p>
        </div>
        <div className="min-h-[420px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Property Code</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Developer</th>
                <th className="px-4 py-3">Agreement</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {showInitialSkeleton && <TableSkeletonRows cols={6} rows={6} />}
              {!showInitialSkeleton &&
                rows.map((row) => (
                  <tr key={`${row.id}-${row.agreementId}`} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.id}</td>
                    <td className="px-4 py-3">{row.projectName}</td>
                    <td className="px-4 py-3"><DeveloperCell developerId={row.developerId} /></td>
                    <td className="px-4 py-3">{row.agreementId}</td>
                    <td className="px-4 py-3">{row.price.toLocaleString()} QAR</td>
                    <td className="px-4 py-3">
                      <Link href={`/broker/properties/${encodeURIComponent(row.id)}?agreementId=${encodeURIComponent(row.agreementId)}`} className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-2.5 py-1.5 text-xs text-[#355069]">
                        View Unit
                      </Link>
                    </td>
                  </tr>
                ))}
              {!showInitialSkeleton && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={6}>No available units found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
