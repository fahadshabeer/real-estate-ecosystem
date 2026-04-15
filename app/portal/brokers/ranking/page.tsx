"use client";

import { useMemo } from "react";
import { House, Trophy } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useBrokerCompaniesPagination } from "@/hooks/use-broker-companies";
import { useDeveloperAgreements } from "@/hooks/use-agreements";
import { useAgreementPropertyMaps, useDeveloperProperties } from "@/hooks/use-properties";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";

export default function BrokerRankingPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";
  const brokersQuery = useBrokerCompaniesPagination();
  const agreementsQuery = useDeveloperAgreements(developerId);
  const propertiesQuery = useDeveloperProperties(developerId);

  const brokers = useMemo(
    () => brokersQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [brokersQuery.data?.pages],
  );
  const agreements = useMemo(
    () => agreementsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [agreementsQuery.data?.pages],
  );
  const mapsQuery = useAgreementPropertyMaps(agreements.map((agreement) => agreement.id));
  const maps = mapsQuery.data ?? [];
  const properties = useMemo(
    () => propertiesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [propertiesQuery.data?.pages],
  );
  const rankingRows = useMemo(() => {
    return brokers
      .map((broker) => {
        const agreementsForBroker = agreements.filter((agreement) => agreement.brokerId === broker.id);
        const agreementIdSet = new Set(agreementsForBroker.map((agreement) => agreement.id));
        const mapsForBroker = maps.filter((map) => agreementIdSet.has(map.agreementId));
        const uniquePropertyIds = [...new Set(mapsForBroker.map((map) => map.propertyId))];
        const soldDeals = uniquePropertyIds.filter((propertyId) =>
          properties.some((property) => property.id === propertyId && property.status === "Sold"),
        ).length;
        const approvalSuccess = uniquePropertyIds.length
          ? Math.round((soldDeals / uniquePropertyIds.length) * 100)
          : 0;
        const responseTimeHours = Math.max(2, 36 - soldDeals * 2);
        const trustScore = Math.max(
          55,
          Math.min(
            99,
            72 + soldDeals * 2 + Math.round(approvalSuccess * 0.12) - (broker.status === "suspended" ? 20 : 0),
          ),
        );
        return {
          id: broker.id,
          name: broker.name,
          soldDeals,
          approvalSuccess,
          responseTimeHours,
          trustScore,
        };
      })
      .sort((a, b) => b.trustScore - a.trustScore || b.soldDeals - a.soldDeals);
  }, [agreements, brokers, maps, properties]);

  const showInitialSkeleton =
    (brokersQuery.isLoading || agreementsQuery.isLoading || propertiesQuery.isLoading || mapsQuery.isLoading) &&
    brokers.length === 0;

  return (
    <div className="space-y-5 pb-6">
      <section className="flex items-center gap-2 text-sm text-[#7f8a99]">
        <House className="h-3.5 w-3.5" />
        <span>/</span>
        <span>Broker Network</span>
        <span>/</span>
        <span>Broker Ranking</span>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">Leaderboard</p>
          <p className="text-sm text-[#7f8a99]">Performance and trust score based ranking</p>
        </div>
        <div className="min-h-[500px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Broker Name</th>
                <th className="px-4 py-3">Broker ID</th>
                <th className="px-4 py-3">Deals Closed</th>
                <th className="px-4 py-3">Approval Success</th>
                <th className="px-4 py-3">Response Time</th>
                <th className="px-4 py-3">Trust Score</th>
              </tr>
            </thead>
            <tbody>
              {showInitialSkeleton && <TableSkeletonRows cols={7} rows={8} />}
              {rankingRows.map((row, index) => (
                <tr key={row.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 font-semibold text-[#1f2a44]">
                    <span className="inline-flex items-center gap-1">
                      {index + 1}
                      {index < 3 && <Trophy className="h-3.5 w-3.5 text-amber-500" />}
                    </span>
                  </td>
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3">{row.id}</td>
                  <td className="px-4 py-3">{row.soldDeals}</td>
                  <td className="px-4 py-3">{row.approvalSuccess}%</td>
                  <td className="px-4 py-3">{row.responseTimeHours}h</td>
                  <td className="px-4 py-3">{row.trustScore}%</td>
                </tr>
              ))}
              {!showInitialSkeleton && rankingRows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={7}>
                    No ranking data available yet.
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
