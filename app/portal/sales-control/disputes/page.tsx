"use client";

import { useMemo } from "react";
import { Check, House, X } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useResolveSaleDispute, useSalesDisputes } from "@/hooks/use-sales-control";
import { runWithToast } from "@/lib/ui/toast";
import { BrokerCell } from "@/components/ui/broker-cell";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";

export default function SalesDisputesPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";
  const disputesQuery = useSalesDisputes(developerId);
  const resolve = useResolveSaleDispute(developerId);

  const rows = useMemo(() => disputesQuery.data ?? [], [disputesQuery.data]);

  return (
    <div className="space-y-5 pb-6">
      <section className="flex items-center gap-2 text-sm text-[#7f8a99]">
        <House className="h-3.5 w-3.5" />
        <span>/</span>
        <span>Sales Control</span>
        <span>/</span>
        <span>Disputes</span>
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
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Broker A</th>
                <th className="px-4 py-3">Broker B</th>
                <th className="px-4 py-3">Claim Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputesQuery.isLoading && <TableSkeletonRows cols={6} rows={8} />}
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.propertyId}</td>
                  <td className="px-4 py-3">
                    <BrokerCell brokerId={row.brokerA} />
                  </td>
                  <td className="px-4 py-3">
                    <BrokerCell brokerId={row.brokerB} />
                  </td>
                  <td className="px-4 py-3">{new Date(row.claimTime).toLocaleString()}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-emerald-600"
                        title="Resolve dispute"
                        aria-label="Resolve dispute"
                        onClick={async () => {
                          try {
                            await runWithToast({
                              loading: "Resolving dispute...",
                              success: "Dispute resolved.",
                              action: () =>
                                resolve.mutateAsync({
                                  disputeId: row.id,
                                  action: "Resolved",
                                }),
                            });
                          } catch {}
                        }}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-rose-500"
                        title="Reject dispute"
                        aria-label="Reject dispute"
                        onClick={async () => {
                          try {
                            await runWithToast({
                              loading: "Rejecting dispute...",
                              success: "Dispute rejected.",
                              action: () =>
                                resolve.mutateAsync({
                                  disputeId: row.id,
                                  action: "Rejected",
                                }),
                            });
                          } catch {}
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!disputesQuery.isLoading && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={6}>
                    No disputes currently open.
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
