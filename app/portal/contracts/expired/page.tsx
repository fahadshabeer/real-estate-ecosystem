"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Copy, House, RefreshCcw } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useDeveloperAgreements } from "@/hooks/use-agreements";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { BrokerCell } from "@/components/ui/broker-cell";

export default function ExpiredAgreementsPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";
  const agreementsQuery = useDeveloperAgreements(developerId);

  const rows = useMemo(() => {
    const items = agreementsQuery.data?.pages.flatMap((page) => page.items) ?? [];
    return items.filter((row) => row.status === "Expired" || (row.status === "Active" && new Date(row.validityEnd).getTime() < Date.now()));
  }, [agreementsQuery.data?.pages]);
  const showInitialSkeleton = agreementsQuery.isLoading && rows.length === 0;

  return (
    <div className="space-y-5 pb-6">
      <section className="flex items-center gap-2 text-sm text-[#7f8a99]">
        <House className="h-3.5 w-3.5" />
        <span>/</span>
        <span>Agreements</span>
        <span>/</span>
        <span>Expired Agreements</span>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{rows.length}</span>)
          </p>
          <p className="text-sm text-[#7f8a99]">Expired agreements and renewal actions</p>
        </div>
        <div className="min-h-[420px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Contract ID</th>
                <th className="px-4 py-3">Broker</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {showInitialSkeleton && <TableSkeletonRows cols={5} rows={6} />}
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.id}</td>
                  <td className="px-4 py-3">
                    <BrokerCell brokerId={row.brokerId} />
                  </td>
                  <td className="px-4 py-3">{row.validityEnd}</td>
                  <td className="px-4 py-3">Expired</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/portal/contracts/new?brokerId=${encodeURIComponent(row.brokerId)}&renewFrom=${encodeURIComponent(row.id)}`}
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078]"
                        title="Renew agreement"
                        aria-label="Renew agreement"
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href={`/portal/contracts/new?brokerId=${encodeURIComponent(row.brokerId)}&duplicateFrom=${encodeURIComponent(row.id)}`}
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078]"
                        title="Duplicate agreement"
                        aria-label="Duplicate agreement"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {!showInitialSkeleton && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>
                    No expired agreements.
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
