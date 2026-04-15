"use client";

import Link from "next/link";
import { Check, FilePlus2, House, X } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useDeveloperContractRequests, useUpdateContractRequestStatus } from "@/hooks/use-agreements";
import { runWithToast } from "@/lib/ui/toast";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { BrokerCell } from "@/components/ui/broker-cell";

export default function BrokerRequestsPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";
  const requestsQuery = useDeveloperContractRequests(developerId);
  const statusMutation = useUpdateContractRequestStatus(developerId);

  const requests = (requestsQuery.data ?? []).filter(
    (request) =>
      (request.initiatedBy ?? "broker") === "broker" &&
      (request.status === "Pending" || request.status === "Invitation Sent"),
  );
  const showInitialSkeleton = requestsQuery.isLoading && requests.length === 0;

  return (
    <div className="space-y-5 pb-6">
      <section className="flex items-center gap-2 text-sm text-[#7f8a99]">
        <House className="h-3.5 w-3.5" />
        <span>/</span>
        <span>Broker Network</span>
        <span>/</span>
        <span>Broker Requests</span>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{requests.length}</span>)
          </p>
          <p className="text-sm text-[#7f8a99]">Incoming broker partnership requests</p>
        </div>
        <div className="min-h-[520px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Broker</th>
                <th className="px-4 py-3">Developer ID</th>
                <th className="px-4 py-3">Request Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {showInitialSkeleton && <TableSkeletonRows cols={5} rows={8} />}
              {requests.map((request) => (
                <tr key={request.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3">
                    <BrokerCell brokerId={request.brokerId} />
                  </td>
                  <td className="px-4 py-3">{request.developerId}</td>
                  <td className="px-4 py-3">{new Date(request.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={request.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={statusMutation.isPending}
                        onClick={async () => {
                          try {
                            await runWithToast({
                              loading: "Approving request...",
                              success: "Broker connected successfully.",
                              action: () =>
                                statusMutation.mutateAsync({ requestId: request.id, action: "Approve" }),
                            });
                          } catch {}
                        }}
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-emerald-600"
                        title="Approve request"
                        aria-label="Approve request"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={statusMutation.isPending}
                        onClick={async () => {
                          try {
                            await runWithToast({
                              loading: "Rejecting request...",
                              success: "Request rejected.",
                              action: () =>
                                statusMutation.mutateAsync({ requestId: request.id, action: "Reject" }),
                            });
                          } catch {}
                        }}
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-rose-500"
                        title="Reject request"
                        aria-label="Reject request"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <Link
                        href={`/portal/contracts/new?brokerId=${encodeURIComponent(request.brokerId)}&requestId=${encodeURIComponent(request.id)}`}
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-cyan-700"
                        title="Create agreement"
                        aria-label="Create agreement"
                      >
                        <FilePlus2 className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {!showInitialSkeleton && requests.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>
                    No pending broker requests.
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

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pending: "bg-blue-100 text-blue-700",
    Connected: "bg-cyan-100 text-cyan-700",
    "Agreement Pending": "bg-amber-100 text-amber-700",
    "Agreement Active": "bg-emerald-100 text-emerald-700",
    Rejected: "bg-rose-100 text-rose-700",
    Drafted: "bg-slate-100 text-slate-700",
    "Invitation Sent": "bg-blue-100 text-blue-700",
  };
  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${map[status] ?? "bg-slate-100 text-slate-700"}`}>{status}</span>;
}
