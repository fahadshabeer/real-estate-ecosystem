"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useBrokerSalesRequests } from "@/hooks/use-sales-control";
import { SaleRequestStatusPill } from "@/components/broker/sale-request-status-pill";

type TimelineEvent = {
  id: string;
  saleRequestId: string;
  label: string;
  actor: string;
  at: string;
  details: string;
};

function formatStatusLabel(status: string) {
  if (status === "Pending") return "Submitted";
  if (status === "Approved") return "Approved";
  if (status === "Rejected") return "Rejected";
  if (status === "Disputed") return "Dispute Raised";
  return status;
}

export default function BrokerSalesTimelinePage() {
  const params = useSearchParams();
  const requestIdFilter = params.get("request")?.trim() ?? "";
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const salesQuery = useBrokerSalesRequests(brokerId);
  const [search, setSearch] = useState(requestIdFilter);

  const timeline = useMemo(() => {
    const events: TimelineEvent[] = [];
    for (const row of salesQuery.data ?? []) {
      events.push({
        id: `${row.id}-submitted`,
        saleRequestId: row.id,
        label: "Submitted",
        actor: row.brokerAgentId ?? "Broker Admin",
        at: row.submittedAt,
        details: `Sale request submitted for ${row.propertyCode} under ${row.agreementId}.`,
      });
      if (row.status === "Approved") {
        events.push({
          id: `${row.id}-approved`,
          saleRequestId: row.id,
          label: "Approved",
          actor: "Developer",
          at: row.approvedAt ?? row.updatedAt,
          details: `Request approved and ${row.propertyCode} locked as sold.`,
        });
      } else if (row.status === "Rejected") {
        events.push({
          id: `${row.id}-rejected`,
          saleRequestId: row.id,
          label: "Rejected",
          actor: "Developer",
          at: row.rejectedAt ?? row.updatedAt,
          details: `Request rejected: ${row.rejectReason ?? "No reason provided"}.`,
        });
      } else if (row.status === "Disputed") {
        events.push({
          id: `${row.id}-disputed`,
          saleRequestId: row.id,
          label: "Dispute Raised",
          actor: "Developer",
          at: row.disputedAt ?? row.updatedAt,
          details: `Dispute opened for ${row.propertyCode}.`,
        });
      }
    }
    return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [salesQuery.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return timeline.filter((event) => {
      if (!q) return true;
      return [event.saleRequestId, event.label, event.actor, event.details].join(" ").toLowerCase().includes(q);
    });
  }, [timeline, search]);

  return (
    <div className="space-y-5 pb-6">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#dbe4eb] bg-white p-4">
        <div className="flex w-full max-w-[360px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
          <Search className="h-4 w-4 text-[#46a4a8]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
            placeholder="Search request ID or timeline event"
          />
        </div>
      </section>

      {salesQuery.error && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {salesQuery.error instanceof Error ? salesQuery.error.message : "Unable to load sales timeline."}
        </section>
      )}

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{filtered.length}</span>)
          </p>
        </div>
        <div className="min-h-[560px] px-6 py-4">
          {salesQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-md border border-[#ecf1f5] bg-[#f8fafc]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-[#7f8a99]">No sales timeline events found.</p>
          ) : (
            <ol className="space-y-3">
              {filtered.map((event) => {
                const request = (salesQuery.data ?? []).find((row) => row.id === event.saleRequestId);
                return (
                  <li key={event.id} className="rounded-md border border-[#e7edf3] bg-[#fcfdff] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#1f2a44]">{event.saleRequestId}</p>
                        <p className="text-xs text-[#7f8a99]">{new Date(event.at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {request ? <SaleRequestStatusPill status={request.status} /> : null}
                        <span className="rounded-md bg-[#edf4f8] px-2 py-1 text-xs font-medium text-[#4f6078]">{formatStatusLabel(request?.status ?? event.label)}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-[#355069]">{event.details}</p>
                    <p className="mt-2 text-xs text-[#7f8a99]">Actor: {event.actor}</p>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}
