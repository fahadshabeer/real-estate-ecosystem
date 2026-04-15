"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Ban, FileText, House, Plus, Search, ShieldCheck } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useBrokerCompaniesPagination, useUpdateBrokerCompanyStatus } from "@/hooks/use-broker-companies";
import { useDeveloperAgreements, useDeveloperContractRequests } from "@/hooks/use-agreements";
import { useAgreementPropertyMaps, useDeveloperProperties } from "@/hooks/use-properties";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { runWithToast } from "@/lib/ui/toast";
import { deriveConnectionLifecycleStatus } from "@/lib/ui/connection-lifecycle";

export default function BrokersPage() {
  const listQuery = useBrokerCompaniesPagination();
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";
  const agreementsQuery = useDeveloperAgreements(developerId);
  const requestsQuery = useDeveloperContractRequests(developerId);
  const propertiesQuery = useDeveloperProperties(developerId);

  const agreements = useMemo(
    () => agreementsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [agreementsQuery.data?.pages],
  );
  const agreementIds = agreements.map((agreement) => agreement.id);
  const mapsQuery = useAgreementPropertyMaps(agreementIds);
  const maps = mapsQuery.data ?? [];
  const properties = useMemo(
    () => propertiesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [propertiesQuery.data?.pages],
  );

  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const requests = requestsQuery.data ?? [];
  const updateCompanyStatus = useUpdateBrokerCompanyStatus();

  const rows = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listQuery.data?.pages],
  );
  const enrichedRows = useMemo(() => {
    return rows.map((broker) => {
      const agreementsForBroker = agreements.filter((agreement) => agreement.brokerId === broker.id);
      const requestsForBroker = requests.filter((request) => request.brokerId === broker.id);
      const agreementIdSet = new Set(agreementsForBroker.map((agreement) => agreement.id));
      const mapsForBroker = maps.filter((map) => agreementIdSet.has(map.agreementId));
      const uniquePropertyIds = [...new Set(mapsForBroker.map((map) => map.propertyId))];
      const soldDeals = uniquePropertyIds.filter((propertyId) =>
        properties.some((property) => property.id === propertyId && property.status === "Sold"),
      ).length;

      const activeAgreements = agreementsForBroker.filter((agreement) => agreement.status === "Active").length;
      const brokerSuspended = broker.status === "suspended";
      const status = deriveConnectionLifecycleStatus({
        agreements: agreementsForBroker,
        requests: requestsForBroker,
        suspended: brokerSuspended,
      });
      const latestRequest = [...requestsForBroker].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )[0];
      const approvalRate = uniquePropertyIds.length
        ? Math.round((soldDeals / uniquePropertyIds.length) * 100)
        : 0;
      const trustScore = Math.max(
        55,
        Math.min(99, 70 + activeAgreements * 4 + Math.round(approvalRate * 0.18) - (brokerSuspended ? 25 : 0)),
      );

      return {
        ...broker,
        companyStatus: broker.status,
        activeAgreements,
        sharedProperties: uniquePropertyIds.length,
        soldDeals,
        trustScore,
        status,
        latestRequestId: latestRequest?.id,
        suspensionReason: broker.suspensionReason,
        suspendedAt: broker.suspendedAt,
      };
    });
  }, [agreements, maps, properties, requests, rows]);

  const filteredRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return enrichedRows.filter((broker) => {
      const matchesQuery =
        !q ||
        [broker.name, broker.id, broker.email, broker.phone, broker.status].join(" ").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" ? true : broker.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [enrichedRows, statusFilter, tableSearch]);

  const showInitialSkeleton =
    (listQuery.isLoading ||
      agreementsQuery.isLoading ||
      requestsQuery.isLoading ||
      propertiesQuery.isLoading ||
      mapsQuery.isLoading) &&
    rows.length === 0;

  return (
    <div className="space-y-5 pb-6">
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-[#7f8a99]">
          <House className="h-3.5 w-3.5" />
          <span>/</span>
          <span>Broker Network</span>
          <span>/</span>
          <span>All Brokers</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
            <Search className="h-4 w-4 text-[#46a4a8]" />
            <input
              value={tableSearch}
              onChange={(event) => setTableSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
              placeholder="Search by broker ID, name, email"
            />
          </div>
          <Link
            href="/portal/brokers/new"
            className="inline-flex items-center gap-2 rounded-md bg-[#3aa4a8] px-5 py-2.5 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> Invite Broker
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{filteredRows.length}</span>)
          </p>
          <div className="flex items-center gap-3 text-sm text-[#8f9aaa]">
            <span>Status</span>
            <FancySelect
              className="h-10 min-w-[160px] rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All</option>
              <option value="Agreement Active">Agreement Active</option>
              <option value="Agreement Pending">Agreement Pending</option>
              <option value="Connected">Connected</option>
              <option value="Invitation Sent">Invitation Sent</option>
              <option value="Suspended">Suspended</option>
            </FancySelect>
          </div>
        </div>
        <div className="min-h-[520px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Broker Name</th>
                <th className="px-4 py-3">Broker ID</th>
                <th className="px-4 py-3">Active Agreements</th>
                <th className="px-4 py-3">Shared Properties</th>
                <th className="px-4 py-3">Sold Deals</th>
                <th className="px-4 py-3">Trust Score</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {showInitialSkeleton && <TableSkeletonRows cols={8} rows={8} />}
              {filteredRows.map((broker) => (
                <tr key={broker.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 font-medium text-[#1f2a44]">
                    <Link href={`/portal/brokers/${broker.id}`} className="hover:text-[#2f9ea3]">
                      {broker.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{broker.id}</td>
                  <td className="px-4 py-3">{broker.activeAgreements}</td>
                  <td className="px-4 py-3">{broker.sharedProperties}</td>
                  <td className="px-4 py-3">{broker.soldDeals}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#e8f4f4] px-2 py-1 text-xs font-semibold text-[#1f7d79]">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {broker.trustScore}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={broker.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/portal/brokers/${broker.id}`}
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078]"
                        title="View profile"
                      >
                        <Search className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href={
                          broker.latestRequestId
                            ? `/portal/contracts/new?brokerId=${encodeURIComponent(broker.id)}&requestId=${encodeURIComponent(broker.latestRequestId)}`
                            : `/portal/contracts/new?brokerId=${encodeURIComponent(broker.id)}`
                        }
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-cyan-700"
                        title="Create agreement"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </Link>
                      {broker.companyStatus === "suspended" ? (
                        <button
                          type="button"
                          disabled={updateCompanyStatus.isPending}
                          className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-emerald-600"
                          title="Reactivate broker"
                          onClick={async () => {
                            try {
                              await runWithToast({
                                loading: "Reactivating broker...",
                                success: "Broker reactivated.",
                                action: () =>
                                  updateCompanyStatus.mutateAsync({
                                    companyId: broker.id,
                                    status: "active",
                                  }),
                              });
                            } catch {}
                          }}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={updateCompanyStatus.isPending}
                          className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-rose-500"
                          title="Suspend broker"
                          onClick={async () => {
                            try {
                              await runWithToast({
                                loading: "Suspending broker...",
                                success: "Broker suspended.",
                                action: () =>
                                  updateCompanyStatus.mutateAsync({
                                    companyId: broker.id,
                                    status: "suspended",
                                    reason: "Access review pending",
                                  }),
                              });
                            } catch {}
                          }}
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!showInitialSkeleton && filteredRows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={8}>
                    No brokers found for selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#ecf1f5] px-6 py-4">
          <span className="text-sm text-[#9aa6b2]">
            Currently at Page: 1 of {listQuery.hasNextPage ? 2 : 1}
          </span>
          <button className="rounded-full border border-[#dbe4eb] bg-white px-3 py-1.5 text-sm text-[#4f6078] opacity-50">
            Prev
          </button>
          <button
            disabled={!listQuery.hasNextPage || listQuery.isFetchingNextPage}
            onClick={() => listQuery.fetchNextPage()}
            className="rounded-full border border-[#dbe4eb] bg-white px-3 py-1.5 text-sm text-[#4f6078] disabled:opacity-45"
          >
            {listQuery.isFetchingNextPage ? "Loading..." : "Next"}
          </button>
        </div>
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Invitation Sent": "bg-blue-100 text-blue-700",
    Connected: "bg-cyan-100 text-cyan-700",
    "Agreement Pending": "bg-amber-100 text-amber-700",
    "Agreement Active": "bg-emerald-100 text-emerald-700",
    Suspended: "bg-rose-100 text-rose-700",
    Terminated: "bg-slate-100 text-slate-700",
  };
  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${map[status] ?? map.Terminated}`}>{status}</span>;
}
