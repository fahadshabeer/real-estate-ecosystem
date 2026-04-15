"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { DeveloperCell } from "@/components/ui/developer-cell";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { useBrokerDeveloperRelations } from "@/hooks/use-broker-developer-relations";
import { DeveloperConnectionStatusPill } from "@/components/broker/developer-connection-status-pill";

export default function BrokerSuspendedConnectionsPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const { rows, loading } = useBrokerDeveloperRelations(brokerId);

  const suspended = rows.filter((row) =>
    row.status === "Suspended" || row.agreements.some((agreement) => agreement.status === "Suspended"),
  );

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">Suspended Connections</h1>
        <p className="mt-1 text-sm text-[#607187]">Developers with suspended legal or inventory visibility access.</p>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{suspended.length}</span>)
          </p>
        </div>
        <div className="min-h-[420px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Developer</th>
                <th className="px-4 py-3">Suspension Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeletonRows cols={4} rows={6} />}
              {!loading &&
                suspended.map((row) => {
                  const suspendedAgreement = row.agreements.find((agreement) => agreement.status === "Suspended");
                  return (
                    <tr key={row.developer.id} className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-3"><DeveloperCell developerId={row.developer.id} /></td>
                      <td className="px-4 py-3">{suspendedAgreement ? new Date(suspendedAgreement.updatedAt).toLocaleDateString() : "-"}</td>
                      <td className="px-4 py-3"><DeveloperConnectionStatusPill status="Suspended" /></td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/broker/developers/${encodeURIComponent(row.developer.id)}`}
                          className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#355069]"
                          title="View history"
                          aria-label="View history"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              {!loading && suspended.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={4}>
                    No suspended connections.
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
