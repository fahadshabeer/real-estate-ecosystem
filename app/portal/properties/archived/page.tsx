"use client";

import { useMemo } from "react";
import { ArchiveRestore, House } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useDeveloperProperties, useUpdateProperty } from "@/hooks/use-properties";
import { runWithToast } from "@/lib/ui/toast";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";

export default function ArchivedUnitsPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";

  const propertiesQuery = useDeveloperProperties(developerId);
  const updateProperty = useUpdateProperty(developerId);

  const archived = useMemo(
    () =>
      (propertiesQuery.data?.pages.flatMap((page) => page.items) ?? []).filter(
        (property) => property.status === "Hidden",
      ),
    [propertiesQuery.data?.pages],
  );

  return (
    <div className="space-y-5 pb-6">
      <section className="flex items-center gap-2 text-sm text-[#7f8a99]">
        <House className="h-3.5 w-3.5" />
        <span>/</span>
        <span>Inventory</span>
        <span>/</span>
        <span>Archived Units</span>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{archived.length}</span>)
          </p>
          <p className="text-sm text-[#7f8a99]">Hidden inventory preserved in history</p>
        </div>
        <div className="min-h-[500px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Property Code</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Unit Number</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {propertiesQuery.isLoading && <TableSkeletonRows cols={5} rows={8} />}
              {archived.map((property) => (
                <tr key={property.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 font-medium text-[#1f2a44]">{property.id}</td>
                  <td className="px-4 py-3">{property.projectName}</td>
                  <td className="px-4 py-3">{property.unitNumber}</td>
                  <td className="px-4 py-3">{property.propertyType}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await runWithToast({
                            loading: "Restoring property...",
                            success: "Property restored to available inventory.",
                            action: () =>
                              updateProperty.mutateAsync({
                                propertyId: property.id,
                                data: { status: "Available" },
                              }),
                          });
                        } catch {}
                      }}
                      className="inline-flex items-center rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078]"
                      title="Restore property"
                      aria-label="Restore property"
                    >
                      <ArchiveRestore className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {!propertiesQuery.isLoading && archived.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>
                    No archived units found.
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
