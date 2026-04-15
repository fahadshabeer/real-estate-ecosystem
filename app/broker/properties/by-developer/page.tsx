"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppContext } from "@/components/state/app-context";
import { useVisibleBrokerProperties } from "@/hooks/use-properties";
import { companyRepository } from "@/lib/backend/factory";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";

export default function BrokerInventoryByDeveloperPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const propertiesQuery = useVisibleBrokerProperties(brokerId);
  const properties = propertiesQuery.data ?? [];
  const showInitialSkeleton = propertiesQuery.isLoading && properties.length === 0;

  const rows = useMemo(() => {
    const grouped = new Map<string, { projects: Set<string>; units: number }>();
    for (const row of properties) {
      if (!grouped.has(row.developerId)) grouped.set(row.developerId, { projects: new Set(), units: 0 });
      const bucket = grouped.get(row.developerId)!;
      bucket.projects.add(row.projectName);
      bucket.units += 1;
    }
    return Array.from(grouped.entries()).map(([developerId, value]) => ({
      developerId,
      projectsVisible: value.projects.size,
      unitsAvailable: value.units,
    }));
  }, [properties]);

  const namesQuery = useQuery({
    queryKey: ["broker-inventory", "developer-by-developer", rows.map((row) => row.developerId).join("|")],
    enabled: rows.length > 0,
    queryFn: async () => {
      const result = await Promise.all(rows.map((row) => companyRepository.getCompanyById(row.developerId)));
      return Object.fromEntries(result.filter((row): row is NonNullable<typeof row> => Boolean(row)).map((row) => [row.id, row.name]));
    },
  });
  const queryError = propertiesQuery.error || namesQuery.error;

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">Inventory By Developer</h1>
        <p className="mt-1 text-sm text-[#607187]">Developer-first view for operational distribution planning.</p>
      </section>

      {queryError && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {queryError instanceof Error ? queryError.message : "Unable to load inventory by developer."}
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
                <th className="px-4 py-3">Developer</th>
                <th className="px-4 py-3">Projects Visible</th>
                <th className="px-4 py-3">Units Available</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {showInitialSkeleton && <TableSkeletonRows cols={4} rows={6} />}
              {!showInitialSkeleton &&
                rows.map((row) => (
                  <tr key={row.developerId} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3 font-medium text-[#1f2a44]">{namesQuery.data?.[row.developerId] ?? row.developerId}</td>
                    <td className="px-4 py-3">{row.projectsVisible}</td>
                    <td className="px-4 py-3">{row.unitsAvailable}</td>
                    <td className="px-4 py-3">
                      <Link href={`/broker/properties?developer=${encodeURIComponent(row.developerId)}`} className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-2.5 py-1.5 text-xs text-[#355069]">
                        Open Developer Inventory
                      </Link>
                    </td>
                  </tr>
                ))}
              {!showInitialSkeleton && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={4}>No developer inventory available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
