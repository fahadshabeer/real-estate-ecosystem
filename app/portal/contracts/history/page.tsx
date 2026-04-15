"use client";

import Link from "next/link";
import { useMemo } from "react";
import { House } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useDeveloperAgreements } from "@/hooks/use-agreements";

export default function AgreementHistoryPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";
  const agreementsQuery = useDeveloperAgreements(developerId);

  const rows = useMemo(() => {
    const items = agreementsQuery.data?.pages.flatMap((page) => page.items) ?? [];
    return items
      .flatMap((agreement) => [
        {
          id: `${agreement.id}-created`,
          agreementId: agreement.id,
          action: "Created",
          actor: agreement.initiatedBy === "developer" ? "Developer" : "Broker",
          details: `Agreement ${agreement.id} created`,
          createdAt: agreement.createdAt,
        },
        {
          id: `${agreement.id}-updated`,
          agreementId: agreement.id,
          action: "Updated",
          actor: "System",
          details: `Status: ${agreement.status}`,
          createdAt: agreement.updatedAt,
        },
      ])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [agreementsQuery.data?.pages]);

  return (
    <div className="space-y-5 pb-6">
      <section className="flex items-center gap-2 text-sm text-[#7f8a99]">
        <House className="h-3.5 w-3.5" />
        <span>/</span>
        <span>Agreements</span>
        <span>/</span>
        <span>Agreement History</span>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{rows.length}</span>)
          </p>
        </div>
        <div className="min-h-[420px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Contract ID</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-[#1f2a44]">
                    <Link href={`/portal/contracts/${encodeURIComponent(row.agreementId)}`} className="hover:text-[#2f9ea3]">
                      {row.agreementId}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.action}</td>
                  <td className="px-4 py-3">{row.actor}</td>
                  <td className="px-4 py-3">{row.details}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>
                    No agreement history yet.
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
