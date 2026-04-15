"use client";

import { useMemo } from "react";
import { ArchiveRestore, House } from "lucide-react";
import { useBrokerCompaniesPagination, useUpdateBrokerCompanyStatus } from "@/hooks/use-broker-companies";
import { runWithToast } from "@/lib/ui/toast";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";

export default function SuspendedBrokersPage() {
  const listQuery = useBrokerCompaniesPagination();
  const updateCompanyStatus = useUpdateBrokerCompanyStatus();

  const brokers = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listQuery.data?.pages],
  );
  const rows = useMemo(() => {
    return brokers
      .filter((broker) => broker.status === "suspended")
      .map((broker) => ({
        ...broker,
        reason: broker.suspensionReason ?? "Access review pending",
        suspendedAt: broker.suspendedAt ?? broker.updatedAt,
      }));
  }, [brokers]);
  const showInitialSkeleton = listQuery.isLoading && brokers.length === 0;

  return (
    <div className="space-y-5 pb-6">
      <section className="flex items-center gap-2 text-sm text-[#7f8a99]">
        <House className="h-3.5 w-3.5" />
        <span>/</span>
        <span>Broker Network</span>
        <span>/</span>
        <span>Suspended Brokers</span>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{rows.length}</span>)
          </p>
          <p className="text-sm text-[#7f8a99]">Suspended brokers lose inventory visibility immediately</p>
        </div>
        <div className="min-h-[500px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Broker Name</th>
                <th className="px-4 py-3">Broker ID</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Suspension Date</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {showInitialSkeleton && <TableSkeletonRows cols={5} rows={8} />}
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.name}</td>
                  <td className="px-4 py-3">{row.id}</td>
                  <td className="px-4 py-3">{row.reason}</td>
                  <td className="px-4 py-3">{new Date(row.suspendedAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={updateCompanyStatus.isPending}
                      className="inline-flex items-center rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078]"
                      title="Reactivate broker"
                      aria-label="Reactivate broker"
                      onClick={async () => {
                        try {
                          await runWithToast({
                            loading: "Reactivating broker...",
                            success: "Broker reactivated.",
                            action: async () => {
                              await updateCompanyStatus.mutateAsync({
                                companyId: row.id,
                                status: "active",
                              });
                            },
                          });
                        } catch {}
                      }}
                    >
                      <ArchiveRestore className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {!showInitialSkeleton && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>
                    No suspended brokers.
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
