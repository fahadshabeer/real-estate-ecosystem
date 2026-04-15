"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppContext } from "@/components/state/app-context";
import { useBrokerAgreements } from "@/hooks/use-agreements";
import { DeveloperCell } from "@/components/ui/developer-cell";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { useActivityLogsPagination } from "@/hooks/use-activity";

export default function BrokerAgreementHistoryPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const agreementsQuery = useBrokerAgreements(brokerId);
  const logsQuery = useActivityLogsPagination({ role: "broker", actorLabel: brokerId, limit: 100 });

  const agreements = useMemo(() => agreementsQuery.data?.pages.flatMap((page) => page.items) ?? [], [agreementsQuery.data?.pages]);
  const logs = useMemo(() => logsQuery.data?.pages.flatMap((page) => page.items) ?? [], [logsQuery.data?.pages]);
  const historyRows = useMemo(
    () => {
      const agreementById = new Map(agreements.map((agreement) => [agreement.id, agreement]));
      const baselineRows = agreements.flatMap((agreement) => {
        const rows = [
          {
            id: `${agreement.id}-created`,
            agreementId: agreement.id,
            developerId: agreement.developerId,
            action: "Agreement Created",
            details: `Agreement ${agreement.id} created with status ${agreement.status}.`,
            createdAt: agreement.createdAt,
          },
        ];
        if (agreement.updatedAt !== agreement.createdAt) {
          rows.push({
            id: `${agreement.id}-updated`,
            agreementId: agreement.id,
            developerId: agreement.developerId,
            action: "Agreement Updated",
            details: `Agreement ${agreement.id} updated to status ${agreement.status}.`,
            createdAt: agreement.updatedAt,
          });
        }
        return rows;
      });

      const logRows = logs
        .map((log) => {
          const matchedAgreement = agreements.find((agreement) => log.details.includes(agreement.id));
          if (!matchedAgreement) return null;
          return {
            id: `log-${log.id}`,
            agreementId: matchedAgreement.id,
            developerId: matchedAgreement.developerId,
            action: log.action,
            details: log.details,
            createdAt: log.createdAt,
          };
        })
        .filter((row): row is NonNullable<typeof row> => Boolean(row))
        .filter((row, index, arr) => arr.findIndex((item) => item.id === row.id) === index);

      const merged = [...baselineRows, ...logRows].filter((row) => agreementById.has(row.agreementId));
      return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    [agreements, logs],
  );

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">Agreement History</h1>
        <p className="mt-1 text-sm text-[#607187]">Legal event timeline and version activity across all broker agreements.</p>
      </section>

      {(agreementsQuery.error || logsQuery.error) && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {(agreementsQuery.error instanceof Error && agreementsQuery.error.message) ||
            (logsQuery.error instanceof Error && logsQuery.error.message) ||
            "Unable to load agreement history."}
        </section>
      )}

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{historyRows.length}</span>)
          </p>
        </div>
        <div className="min-h-[520px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Contract ID</th>
                <th className="px-4 py-3">Developer</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {(agreementsQuery.isLoading || logsQuery.isLoading) && <TableSkeletonRows cols={5} rows={8} />}
              {!agreementsQuery.isLoading &&
                !logsQuery.isLoading &&
                historyRows.map((row) => (
                  <tr key={row.id} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3 font-medium text-[#1f2a44]">
                      <Link href={`/broker/agreements/${encodeURIComponent(row.agreementId)}`} className="hover:text-[#2f9ea3]">
                        {row.agreementId}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><DeveloperCell developerId={row.developerId} /></td>
                    <td className="px-4 py-3">{row.action}</td>
                    <td className="px-4 py-3">{row.details}</td>
                    <td className="px-4 py-3">{new Date(row.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              {!agreementsQuery.isLoading && !logsQuery.isLoading && historyRows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>
                    No history records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!logsQuery.isLoading && logsQuery.hasNextPage && (
          <div className="border-t border-[#ecf1f5] px-6 py-4">
            <button
              type="button"
              onClick={() => logsQuery.fetchNextPage()}
              disabled={logsQuery.isFetchingNextPage}
              className="rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-sm text-[#355069] disabled:opacity-60"
            >
              {logsQuery.isFetchingNextPage ? "Loading..." : "Load More Logs"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
