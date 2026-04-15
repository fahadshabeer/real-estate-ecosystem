"use client";

import { useEffect, useMemo, useState } from "react";
import { House, Search } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useDeveloperAgreements } from "@/hooks/use-agreements";
import { useAgreementPropertyMaps, useDeveloperProperties } from "@/hooks/use-properties";
import { companyRepository } from "@/lib/backend/factory";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { BrokerCell } from "@/components/ui/broker-cell";

export default function SharedInventoryPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";
  const [query, setQuery] = useState("");
  const [brokerNames, setBrokerNames] = useState<Record<string, string>>({});

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

  useEffect(() => {
    const brokerIds = [...new Set(agreements.map((agreement) => agreement.brokerId))];
    if (!brokerIds.length) return;
    void (async () => {
      const rows = await Promise.all(
        brokerIds.map(async (brokerId) => {
          const company = await companyRepository.getCompanyById(brokerId);
          return [brokerId, company?.name ?? brokerId] as const;
        }),
      );
      setBrokerNames(Object.fromEntries(rows));
    })();
  }, [agreements]);

  const sharedRows = useMemo(() => {
    const merged = maps
      .map((map) => {
        const agreement = agreements.find((item) => item.id === map.agreementId);
        const property = properties.find((item) => item.id === map.propertyId);
        if (!agreement || !property) return null;
        return {
          mapId: map.id,
          propertyId: property.id,
          projectName: property.projectName,
          unitNumber: property.unitNumber,
          status: property.status,
          agreementId: agreement.id,
          brokerId: agreement.brokerId,
          brokerName: brokerNames[agreement.brokerId] ?? agreement.brokerId,
          sharedDate: map.sharedDate,
          sharingType: "Non-Exclusive",
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));

    const q = query.trim().toLowerCase();
    if (!q) return merged;
    return merged.filter((row) =>
      [
        row.propertyId,
        row.projectName,
        row.unitNumber,
        row.agreementId,
        row.brokerId,
        row.brokerName,
        row.sharingType,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [agreements, brokerNames, maps, properties, query]);

  return (
    <div className="space-y-5 pb-6">
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-[#7f8a99]">
          <House className="h-3.5 w-3.5" />
          <span>/</span>
          <span>Inventory</span>
          <span>/</span>
          <span>Shared Inventory</span>
        </div>
        <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
          <Search className="h-4 w-4 text-[#46a4a8]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
            placeholder="Search shared inventory"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{sharedRows.length}</span>)
          </p>
          <p className="text-sm text-[#7f8a99]">Property visibility across brokers and agreements</p>
        </div>

        <div className="min-h-[500px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Property Code</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Agreement</th>
                <th className="px-4 py-3">Broker Company</th>
                <th className="px-4 py-3">Shared Date</th>
                <th className="px-4 py-3">Sharing Type</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(agreementsQuery.isLoading || mapsQuery.isLoading || propertiesQuery.isLoading) && (
                <TableSkeletonRows cols={7} rows={8} />
              )}
              {sharedRows.map((row) => (
                <tr key={row.mapId} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.propertyId}</td>
                  <td className="px-4 py-3">
                    {row.projectName} · {row.unitNumber}
                  </td>
                  <td className="px-4 py-3">{row.agreementId}</td>
                  <td className="px-4 py-3">
                    <BrokerCell brokerId={row.brokerId} />
                  </td>
                  <td className="px-4 py-3">{new Date(row.sharedDate).toLocaleString()}</td>
                  <td className="px-4 py-3">{row.sharingType}</td>
                  <td className="px-4 py-3">{row.status}</td>
                </tr>
              ))}
              {!agreementsQuery.isLoading && !mapsQuery.isLoading && !propertiesQuery.isLoading && sharedRows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={7}>
                    No shared properties found.
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
