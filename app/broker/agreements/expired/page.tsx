"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppContext } from "@/components/state/app-context";
import { useBrokerAgreements } from "@/hooks/use-agreements";
import { DeveloperCell } from "@/components/ui/developer-cell";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { AgreementStatusPill } from "@/components/broker/agreement-status-pill";

export default function BrokerExpiredAgreementsPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const agreementsQuery = useBrokerAgreements(brokerId);

  const rows = useMemo(
    () =>
      (agreementsQuery.data?.pages.flatMap((page) => page.items) ?? []).filter(
        (agreement) => agreement.status === "Expired",
      ),
    [agreementsQuery.data?.pages],
  );

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">Expired Agreements</h1>
        <p className="mt-1 text-sm text-[#607187]">Expired agreements no longer grant inventory visibility rights.</p>
      </section>

      {agreementsQuery.error && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {agreementsQuery.error instanceof Error ? agreementsQuery.error.message : "Unable to load agreements."}
        </section>
      )}

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{rows.length}</span>)
          </p>
        </div>
        <div className="min-h-[440px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Contract ID</th>
                <th className="px-4 py-3">Developer</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agreementsQuery.isLoading && <TableSkeletonRows cols={5} rows={6} />}
              {!agreementsQuery.isLoading &&
                rows.map((agreement) => (
                  <tr key={agreement.id} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3 font-medium text-[#1f2a44]">{agreement.id}</td>
                    <td className="px-4 py-3"><DeveloperCell developerId={agreement.developerId} /></td>
                    <td className="px-4 py-3">{agreement.validityEnd}</td>
                    <td className="px-4 py-3"><AgreementStatusPill status={agreement.status} /></td>
                    <td className="px-4 py-3">
                      <Link href={`/broker/agreements/${encodeURIComponent(agreement.id)}`} className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-2.5 py-1.5 text-xs text-[#355069]">
                        View History
                      </Link>
                    </td>
                  </tr>
                ))}
              {!agreementsQuery.isLoading && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>
                    No expired agreements.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!agreementsQuery.isLoading && agreementsQuery.hasNextPage && (
          <div className="border-t border-[#ecf1f5] px-6 py-4">
            <button
              type="button"
              onClick={() => agreementsQuery.fetchNextPage()}
              disabled={agreementsQuery.isFetchingNextPage}
              className="rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-sm text-[#355069] disabled:opacity-60"
            >
              {agreementsQuery.isFetchingNextPage ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
