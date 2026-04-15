"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Eye, House, OctagonAlert, Scale, Search, X } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import {
  useApproveSaleRequest,
  useRaiseSaleDispute,
  useRejectSaleRequest,
  useSalesRequests,
} from "@/hooks/use-sales-control";
import { runWithToast } from "@/lib/ui/toast";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { BrokerCell } from "@/components/ui/broker-cell";

export default function PendingSalesApprovalsPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";

  const requestsQuery = useSalesRequests(developerId);
  const approveRequest = useApproveSaleRequest(developerId);
  const rejectRequest = useRejectSaleRequest(developerId);
  const raiseDispute = useRaiseSaleDispute(developerId);

  const [search, setSearch] = useState("");
  const [reasonByRequest, setReasonByRequest] = useState<
    Record<string, "duplicate claim" | "incomplete data" | "invalid agreement" | "already sold">
  >({});

  const pendingRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = (requestsQuery.data ?? [])
      .filter((row) => row.status === "Pending")
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return rows.filter((row) =>
      !q ||
      [row.id, row.propertyCode, row.projectName, row.brokerId, row.agreementId].join(" ").toLowerCase().includes(q),
    );
  }, [requestsQuery.data, search]);

  const urgentCount = pendingRows.filter((row) => Date.now() - new Date(row.submittedAt).getTime() > 24 * 60 * 60 * 1000).length;

  return (
    <div className="space-y-5 pb-6">
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-[#7f8a99]">
          <House className="h-3.5 w-3.5" />
          <span>/</span>
          <span>Sales Control</span>
          <span>/</span>
          <span>Pending Approvals</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
            <Search className="h-4 w-4 text-[#46a4a8]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
              placeholder="Search by request, property, broker"
            />
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border border-[#f4d9a6] bg-[#fff8e8] px-3 py-2 text-sm text-[#9a6700]">
            <OctagonAlert className="h-4 w-4" />
            Urgent Pending: <strong>{urgentCount}</strong>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{pendingRows.length}</span>)
          </p>
        </div>
        <div className="min-h-[520px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Request ID</th>
                <th className="px-4 py-3">Property Code</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Broker Company</th>
                <th className="px-4 py-3">Agreement</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requestsQuery.isLoading && (
                <TableSkeletonRows cols={8} rows={8} />
              )}
              {!requestsQuery.isLoading &&
                pendingRows.map((row) => (
                <tr key={row.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.id}</td>
                  <td className="px-4 py-3">{row.propertyCode}</td>
                  <td className="px-4 py-3">{row.projectName}</td>
                  <td className="px-4 py-3">
                    <BrokerCell brokerId={row.brokerId} />
                  </td>
                  <td className="px-4 py-3">{row.agreementId}</td>
                  <td className="px-4 py-3">{new Date(row.submittedAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                      Pending
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/portal/sales-control/${encodeURIComponent(row.id)}`}
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078]"
                        title="Review request"
                        aria-label="Review request"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-emerald-600"
                        title="Approve sale"
                        aria-label="Approve sale"
                        onClick={async () => {
                          try {
                            await runWithToast({
                              loading: "Approving sale...",
                              success: "Sale approved and property locked as sold.",
                              action: async () => {
                                await approveRequest.mutateAsync({
                                  saleRequestId: row.id,
                                });
                              },
                            });
                          } catch {}
                        }}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-rose-500"
                        title="Reject sale"
                        aria-label="Reject sale"
                        onClick={async () => {
                          try {
                            await runWithToast({
                              loading: "Rejecting sale...",
                              success: "Sale request rejected.",
                              action: () =>
                                rejectRequest.mutateAsync({
                                  saleRequestId: row.id,
                                  reason: reasonByRequest[row.id] ?? "incomplete data",
                                }),
                            });
                          } catch {}
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-amber-600"
                        title="Raise dispute"
                        aria-label="Raise dispute"
                        onClick={async () => {
                          try {
                            await runWithToast({
                              loading: "Opening dispute...",
                              success: "Dispute raised.",
                              action: () =>
                                raiseDispute.mutateAsync({
                                  saleRequestId: row.id,
                                }),
                            });
                          } catch {}
                        }}
                      >
                        <Scale className="h-3.5 w-3.5" />
                      </button>
                      <FancySelect
                        className="h-8 rounded-md border border-[#dbe4eb] bg-white px-2 text-xs text-[#1f2a44]"
                        value={reasonByRequest[row.id] ?? "incomplete data"}
                        onChange={(event) =>
                          setReasonByRequest((prev) => ({
                            ...prev,
                            [row.id]: event.target.value as
                              | "duplicate claim"
                              | "incomplete data"
                              | "invalid agreement"
                              | "already sold",
                          }))
                        }
                        title="Reject reason"
                      >
                        <option value="duplicate claim">duplicate claim</option>
                        <option value="incomplete data">incomplete data</option>
                        <option value="invalid agreement">invalid agreement</option>
                        <option value="already sold">already sold</option>
                      </FancySelect>
                    </div>
                  </td>
                </tr>
                ))}
              {!requestsQuery.isLoading && pendingRows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={8}>
                    No pending sale approvals.
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
