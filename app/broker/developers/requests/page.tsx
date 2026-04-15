"use client";

import Link from "next/link";
import { X, Eye } from "lucide-react";
import { useUpdateContractRequestStatus } from "@/hooks/use-agreements";
import { useBrokerDeveloperRelations } from "@/hooks/use-broker-developer-relations";
import { useAppContext } from "@/components/state/app-context";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { DeveloperCell } from "@/components/ui/developer-cell";
import { DeveloperConnectionStatusPill } from "@/components/broker/developer-connection-status-pill";
import { runWithToast } from "@/lib/ui/toast";

export default function BrokerRequestsSentPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const { requests, loading } = useBrokerDeveloperRelations(brokerId);
  const updateRequest = useUpdateContractRequestStatus();

  const rows = requests.filter((row) => (row.initiatedBy ?? "broker") === "broker");

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">Requests Sent</h1>
        <p className="mt-1 text-sm text-[#607187]">Track all outgoing broker-to-developer connection requests.</p>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{rows.length}</span>)
          </p>
        </div>
        <div className="min-h-[520px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Developer</th>
                <th className="px-4 py-3">Request Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeletonRows cols={4} rows={8} />}
              {!loading &&
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3"><DeveloperCell developerId={row.developerId} /></td>
                    <td className="px-4 py-3">{new Date(row.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><DeveloperConnectionStatusPill status={row.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/broker/developers/${encodeURIComponent(row.developerId)}`}
                          className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#355069]"
                          title="Open developer profile"
                          aria-label="Open developer profile"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          disabled={row.status !== "Pending"}
                          className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-rose-500 disabled:opacity-50"
                          title="Cancel request"
                          onClick={async () => {
                            try {
                              await runWithToast({
                                loading: "Canceling request...",
                                success: "Request canceled.",
                                action: () => updateRequest.mutateAsync({ requestId: row.id, action: "Reject" }),
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
              {!loading && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={4}>
                    No requests sent yet.
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
