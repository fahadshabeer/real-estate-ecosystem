"use client";

import Link from "next/link";
import { Eye, FileText, Home } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { DeveloperCell } from "@/components/ui/developer-cell";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { useBrokerDeveloperRelations } from "@/hooks/use-broker-developer-relations";
import { DeveloperConnectionStatusPill } from "@/components/broker/developer-connection-status-pill";

export default function BrokerConnectedDevelopersPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const { rows, loading } = useBrokerDeveloperRelations(brokerId);

  const connected = rows.filter((row) =>
    row.status === "Connected" || row.status === "Agreement Pending" || row.status === "Agreement Active",
  );

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">Connected Developers</h1>
        <p className="mt-1 text-sm text-[#607187]">Daily operational view of active developer business relationships.</p>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{connected.length}</span>)
          </p>
        </div>
        <div className="min-h-[520px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Developer</th>
                <th className="px-4 py-3">Active Agreements</th>
                <th className="px-4 py-3">Visible Projects</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeletonRows cols={5} rows={8} />}
              {!loading &&
                connected.map((row) => (
                  <tr key={row.developer.id} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3"><DeveloperCell developerId={row.developer.id} /></td>
                    <td className="px-4 py-3">{row.activeAgreements}</td>
                    <td className="px-4 py-3">{row.projectsAvailable}</td>
                    <td className="px-4 py-3"><DeveloperConnectionStatusPill status={row.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/broker/developers/${encodeURIComponent(row.developer.id)}`}
                          className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#355069]"
                          title="Open profile"
                          aria-label="Open profile"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href="/broker/agreements"
                          className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#355069]"
                          title="Open agreements"
                          aria-label="Open agreements"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href="/broker/properties"
                          className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#355069]"
                          title="Open inventory"
                          aria-label="Open inventory"
                        >
                          <Home className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && connected.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>
                    No connected developers yet.
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
