"use client";

import Link from "next/link";
import { Eye, Power, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppContext } from "@/components/state/app-context";
import { useBrokerAgents, useUpdateAgent } from "@/hooks/use-agents";
import { runWithToast } from "@/lib/ui/toast";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";

export default function BrokerDisabledAgentsPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const agentsQuery = useBrokerAgents(brokerId);
  const updateAgent = useUpdateAgent(brokerId);

  const [search, setSearch] = useState("");
  const rows = useMemo(
    () => (agentsQuery.data?.pages.flatMap((page) => page.items) ?? []).filter((agent) => agent.status === "Disabled"),
    [agentsQuery.data?.pages],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => (!q ? true : [row.name, row.id, row.email, row.phone].join(" ").toLowerCase().includes(q)));
  }, [rows, search]);

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
        <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
          <Search className="h-4 w-4 text-[#46a4a8]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
            placeholder="Search disabled agents"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{filtered.length}</span>)
          </p>
        </div>
        <div className="min-h-[560px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Agent Name</th>
                <th className="px-4 py-3">Agent ID</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agentsQuery.isLoading && <TableSkeletonRows cols={6} rows={8} />}
              {!agentsQuery.isLoading &&
                filtered.map((agent) => (
                  <tr key={agent.id} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3 font-medium text-[#1f2a44]">{agent.name}</td>
                    <td className="px-4 py-3">{agent.id}</td>
                    <td className="px-4 py-3">{agent.phone}</td>
                    <td className="px-4 py-3">{agent.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">Disabled</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/broker/agents/${encodeURIComponent(agent.id)}`}
                          className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078]"
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-emerald-600"
                          title="Enable"
                          onClick={async () => {
                            try {
                              await runWithToast({
                                loading: "Enabling agent...",
                                success: "Agent enabled.",
                                action: () => updateAgent.mutateAsync({ agentId: agent.id, data: { status: "Active" } }),
                              });
                            } catch {}
                          }}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!agentsQuery.isLoading && filtered.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={6}>
                    No disabled agents found.
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
