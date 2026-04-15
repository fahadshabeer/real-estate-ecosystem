"use client";

import Link from "next/link";
import { Plus, Search, Send, Eye } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppContext } from "@/components/state/app-context";
import { DeveloperCell } from "@/components/ui/developer-cell";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { useBrokerDeveloperRelations } from "@/hooks/use-broker-developer-relations";
import { useCreateContractRequest } from "@/hooks/use-agreements";
import { runWithToast } from "@/lib/ui/toast";
import { DeveloperConnectionStatusPill } from "@/components/broker/developer-connection-status-pill";
import { FancySelect } from "@/components/ui/fancy-select";

export default function BrokerDevelopersPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const { rows, loading } = useBrokerDeveloperRelations(brokerId);
  const createRequest = useCreateContractRequest({ brokerId });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        [row.developer.id, row.developer.name, row.developer.email, row.developer.phone]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  return (
    <div className="space-y-5 pb-6">
      <section className="flex items-center justify-between gap-3 rounded-xl border border-[#dbe4eb] bg-white p-5">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">All Developers</h1>
          <p className="mt-1 text-sm text-[#607187]">Broker relationship directory and connection control center.</p>
        </div>
        <Link href="/broker/developers/search" className="inline-flex items-center gap-2 rounded-md bg-[#3aa4a8] px-4 py-2 text-sm font-medium text-white">
          <Plus className="h-4 w-4" />
          Request Developer
        </Link>
      </section>

      <section className="rounded-xl border border-[#dbe4eb] bg-white p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-3 py-2.5 md:col-span-2">
            <Search className="h-4 w-4 text-[#46a4a8]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
              placeholder="Search by developer ID, name, email or phone"
            />
          </div>
          <FancySelect
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="ui-select"
          >
            <option value="all">All Status</option>
            <option value="Invitation Sent">Invitation Sent</option>
            <option value="Connected">Connected</option>
            <option value="Agreement Pending">Agreement Pending</option>
            <option value="Agreement Active">Agreement Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Terminated">Terminated</option>
          </FancySelect>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{filteredRows.length}</span>)
          </p>
          <Link href="/broker/developers/search" className="inline-flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-xs text-[#4f6078]">
            <Search className="h-3.5 w-3.5" />
            Search Developer
          </Link>
        </div>
        <div className="min-h-[520px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Developer</th>
                <th className="px-4 py-3">Projects Available</th>
                <th className="px-4 py-3">Active Agreements</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeletonRows cols={5} rows={8} />}
              {!loading &&
                filteredRows.map((row) => (
                  <tr key={row.developer.id} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3">
                      <DeveloperCell developerId={row.developer.id} />
                    </td>
                    <td className="px-4 py-3">{row.projectsAvailable}</td>
                    <td className="px-4 py-3">{row.activeAgreements}</td>
                    <td className="px-4 py-3">
                      <DeveloperConnectionStatusPill status={row.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/broker/developers/${encodeURIComponent(row.developer.id)}`}
                          className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#355069]"
                          title="View profile"
                          aria-label="View profile"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          disabled={row.status !== "Terminated" && row.status !== "Invitation Sent"}
                          onClick={async () => {
                            try {
                              await runWithToast({
                                loading: "Sending request...",
                                success: "Connection request sent.",
                                action: () =>
                                  createRequest.mutateAsync({
                                    brokerId,
                                    developerId: row.developer.id,
                                    note: `Broker ${brokerId} requested connection with ${row.developer.id}.`,
                                    initiatedBy: "broker",
                                  }),
                              });
                            } catch {}
                          }}
                          className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#355069] disabled:opacity-50"
                          title="Send connection request"
                          aria-label="Send connection request"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && filteredRows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>
                    No developers found.
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
