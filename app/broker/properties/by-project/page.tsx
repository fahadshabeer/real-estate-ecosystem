"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppContext } from "@/components/state/app-context";
import { useVisibleBrokerProperties } from "@/hooks/use-properties";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { DeveloperCell } from "@/components/ui/developer-cell";

export default function BrokerInventoryByProjectPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const propertiesQuery = useVisibleBrokerProperties(brokerId);
  const properties = propertiesQuery.data ?? [];
  const showInitialSkeleton = propertiesQuery.isLoading && properties.length === 0;

  const rows = useMemo(() => {
    const grouped = new Map<string, { developerId: string; total: number; available: number; sold: number }>();
    for (const row of properties) {
      const key = row.projectName || "N/A";
      if (!grouped.has(key)) {
        grouped.set(key, { developerId: row.developerId, total: 0, available: 0, sold: 0 });
      }
      const bucket = grouped.get(key)!;
      bucket.total += 1;
      if (row.status === "Available") bucket.available += 1;
      if (row.status === "Sold") bucket.sold += 1;
    }
    return Array.from(grouped.entries()).map(([project, value]) => ({ project, ...value }));
  }, [properties]);

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">Inventory By Project</h1>
        <p className="mt-1 text-sm text-[#607187]">Project-level inventory visibility for fast sales execution.</p>
      </section>

      {propertiesQuery.error && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {propertiesQuery.error instanceof Error
            ? propertiesQuery.error.message
            : "Unable to load inventory by project."}
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
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Developer</th>
                <th className="px-4 py-3">Units Visible</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Sold</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {showInitialSkeleton && <TableSkeletonRows cols={6} rows={6} />}
              {!showInitialSkeleton &&
                rows.map((row) => (
                  <tr key={`${row.project}-${row.developerId}`} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.project}</td>
                    <td className="px-4 py-3"><DeveloperCell developerId={row.developerId} /></td>
                    <td className="px-4 py-3">{row.total}</td>
                    <td className="px-4 py-3">{row.available}</td>
                    <td className="px-4 py-3">{row.sold}</td>
                    <td className="px-4 py-3">
                      <Link href={`/broker/properties?project=${encodeURIComponent(row.project)}`} className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-2.5 py-1.5 text-xs text-[#355069]">
                        Open Project Units
                      </Link>
                    </td>
                  </tr>
                ))}
              {!showInitialSkeleton && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={6}>No project inventory available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
