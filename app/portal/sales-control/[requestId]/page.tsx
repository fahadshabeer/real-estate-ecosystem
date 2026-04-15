"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, House, Scale, X } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { InnerShellHeader } from "@/components/ui/inner-shell-header";
import { useApproveSaleRequest, useRaiseSaleDispute, useRejectSaleRequest, useSalesRequests } from "@/hooks/use-sales-control";
import { runWithToast } from "@/lib/ui/toast";
import { BrokerCell } from "@/components/ui/broker-cell";

export default function SaleRequestDetailPage() {
  const params = useParams<{ requestId: string }>();
  const requestIdRaw = params?.requestId;
  const requestId = decodeURIComponent(Array.isArray(requestIdRaw) ? requestIdRaw[0] : requestIdRaw ?? "");
  const router = useRouter();
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";

  const requestsQuery = useSalesRequests(developerId);
  const approve = useApproveSaleRequest(developerId);
  const reject = useRejectSaleRequest(developerId);
  const dispute = useRaiseSaleDispute(developerId);

  const request = useMemo(
    () => (requestsQuery.data ?? []).find((row) => row.id === requestId),
    [requestId, requestsQuery.data],
  );
  const [reason, setReason] = useState<"duplicate claim" | "incomplete data" | "invalid agreement" | "already sold">(
    "incomplete data",
  );

  if (requestsQuery.isLoading && !request) {
    return <div className="rounded-md border border-[#dbe4eb] bg-white p-6 text-sm text-[#607187]">Loading request...</div>;
  }

  if (!request) {
    return (
      <div className="rounded-md border border-[#dbe4eb] bg-white p-6 text-sm text-[#607187]">
        Sale request not found.
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <InnerShellHeader sectionLabel="Sales Control" title="Sale Request Review" backHref="/portal/sales-control" />

      <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#7f8a99]">Request ID</p>
            <h1 className="font-display text-xl font-semibold text-[#1f2a44]">{request.id}</h1>
          </div>
          <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">{request.status}</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Meta label="Property Code" value={request.propertyCode} />
          <Meta label="Project" value={request.projectName} />
          <Meta label="Unit Number" value={request.unitNumber} />
          <Meta label="Property Price" value={`${request.propertyPrice.toLocaleString()} QAR`} />
          <Meta label="Agreement" value={request.agreementId} />
          <Meta label="Submitted" value={new Date(request.submittedAt).toLocaleString()} />
        </div>
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-[#1f2a44]">Broker Information</h2>
        <div className="mt-3 rounded-md border border-[#ecf1f5] bg-[#f9fbfc] p-3">
          <BrokerCell brokerId={request.brokerId} />
          <p className="mt-2 text-sm text-[#607187]">Submitted by Agent: {request.brokerAgentId ?? "AGT-PLACEHOLDER"}</p>
          <p className="text-sm text-[#607187]">Request Notes: {request.requestNotes ?? "No notes provided."}</p>
          <p className="text-sm text-[#607187]">Buyer docs: Placeholder for future uploaded documents.</p>
        </div>
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-[#1f2a44]">Decision</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <FancySelect
            value={reason}
            onChange={(event) =>
              setReason(
                event.target.value as "duplicate claim" | "incomplete data" | "invalid agreement" | "already sold",
              )
            }
            className="h-10 min-w-[230px] rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]"
          >
            <option value="duplicate claim">duplicate claim</option>
            <option value="incomplete data">incomplete data</option>
            <option value="invalid agreement">invalid agreement</option>
            <option value="already sold">already sold</option>
          </FancySelect>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md bg-[#3aa4a8] px-4 py-2 text-sm font-medium text-white"
            onClick={async () => {
              try {
                await runWithToast({
                  loading: "Approving sale...",
                  success: "Sale approved and inventory locked.",
                  action: async () => {
                    await approve.mutateAsync({
                      saleRequestId: request.id,
                    });
                  },
                });
                router.push("/portal/sales-control/approved");
              } catch {}
            }}
          >
            <Check className="h-4 w-4" />
            Approve
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-4 py-2 text-sm text-[#4f6078]"
            onClick={async () => {
              try {
                await runWithToast({
                  loading: "Rejecting sale...",
                  success: "Sale request rejected.",
                  action: () =>
                    reject.mutateAsync({
                      saleRequestId: request.id,
                      reason,
                    }),
                });
                router.push("/portal/sales-control/rejected");
              } catch {}
            }}
          >
            <X className="h-4 w-4" />
            Reject
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-4 py-2 text-sm text-[#4f6078]"
            onClick={async () => {
              try {
                await runWithToast({
                  loading: "Raising dispute...",
                  success: "Dispute opened.",
                  action: () =>
                    dispute.mutateAsync({
                      saleRequestId: request.id,
                    }),
                });
                router.push("/portal/sales-control/disputes");
              } catch {}
            }}
          >
            <Scale className="h-4 w-4" />
            Dispute
          </button>
        </div>
      </section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-md border border-[#ecf1f5] bg-[#f9fbfc] p-3">
      <p className="text-xs text-[#7f8a99]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#1f2a44]">{value}</p>
    </article>
  );
}
