"use client";

import { useMemo } from "react";
import { House } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useDeveloperAgreements } from "@/hooks/use-agreements";
import { useAgreementPropertyMaps, useDeveloperProperties } from "@/hooks/use-properties";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { BrokerCell } from "@/components/ui/broker-cell";

export default function ReservedSoldUnitsPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";

  const agreementsQuery = useDeveloperAgreements(developerId);
  const propertiesQuery = useDeveloperProperties(developerId);

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

  const rows = useMemo(() => {
    return properties
      .filter((property) => property.status === "Reserved" || property.status === "Sold")
      .map((property) => {
        const links = maps.filter((map) => map.propertyId === property.id);
        const agreement = agreements.find((item) => item.id === links[0]?.agreementId);
        return {
          ...property,
          agreementId: agreement?.id ?? "—",
          brokerId: agreement?.brokerId ?? "—",
          sharedDate: links[0]?.sharedDate ?? "—",
        };
      });
  }, [agreements, maps, properties]);

  const reservedCount = rows.filter((row) => row.status === "Reserved").length;
  const soldCount = rows.filter((row) => row.status === "Sold").length;

  return (
    <div className="space-y-5 pb-6">
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-[#7f8a99]">
          <House className="h-3.5 w-3.5" />
          <span>/</span>
          <span>Inventory</span>
          <span>/</span>
          <span>Reserved / Sold Units</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-3">
            <p className="text-xs text-[#7f8a99]">Reserved Units</p>
            <p className="mt-1 text-xl font-semibold text-[#1f2a44]">{reservedCount}</p>
          </article>
          <article className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-3">
            <p className="text-xs text-[#7f8a99]">Sold Units</p>
            <p className="mt-1 text-xl font-semibold text-[#1f2a44]">{soldCount}</p>
          </article>
          <article className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-3">
            <p className="text-xs text-[#7f8a99]">Total Tracked</p>
            <p className="mt-1 text-xl font-semibold text-[#1f2a44]">{rows.length}</p>
          </article>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{rows.length}</span>)
          </p>
          <p className="text-sm text-[#7f8a99]">Reservation and sold monitoring</p>
        </div>

        <div className="min-h-[500px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Broker</th>
                <th className="px-4 py-3">Agreement</th>
                <th className="px-4 py-3">Shared Date</th>
              </tr>
            </thead>
            <tbody>
              {(agreementsQuery.isLoading || mapsQuery.isLoading || propertiesQuery.isLoading) && (
                <TableSkeletonRows cols={6} rows={8} />
              )}
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.id}</td>
                  <td className="px-4 py-3">
                    {row.projectName} · {row.unitNumber}
                  </td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">
                    {row.brokerId === "—" ? "—" : <BrokerCell brokerId={row.brokerId} />}
                  </td>
                  <td className="px-4 py-3">{row.agreementId}</td>
                  <td className="px-4 py-3">{row.sharedDate === "—" ? "—" : new Date(row.sharedDate).toLocaleString()}</td>
                </tr>
              ))}
              {!agreementsQuery.isLoading && !mapsQuery.isLoading && !propertiesQuery.isLoading && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={6}>
                    No reserved or sold units found.
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
