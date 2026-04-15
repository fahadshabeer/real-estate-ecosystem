"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import Link from "next/link";
import { Eye, Pencil, Plus, Power, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "@/components/state/app-context";
import { useBrokerAgents, useDeleteAgent, useUpdateAgent } from "@/hooks/use-agents";
import { useBrokerPropertyAssignments } from "@/hooks/use-broker-inventory";
import { useBrokerSalesRequests } from "@/hooks/use-sales-control";
import { runWithToast } from "@/lib/ui/toast";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";

export default function BrokerAgentsPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";

  const agentsQuery = useBrokerAgents(brokerId);
  const assignmentsQuery = useBrokerPropertyAssignments(brokerId);
  const salesQuery = useBrokerSalesRequests(brokerId);
  const updateAgent = useUpdateAgent(brokerId);
  const deleteAgent = useDeleteAgent(brokerId);

  const myAgents = useMemo(() => agentsQuery.data?.pages.flatMap((p) => p.items) ?? [], [agentsQuery.data?.pages]);
  const assignments = assignmentsQuery.data ?? [];
  const sales = salesQuery.data ?? [];
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Disabled" | "Inactive">("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const performanceByAgentId = useMemo(() => {
    const map = new Map<string, { assigned: number; deals: number; submitted: number }>();
    for (const agent of myAgents) {
      map.set(agent.id, { assigned: 0, deals: 0, submitted: 0 });
    }
    for (const assignment of assignments) {
      const current = map.get(assignment.agentId);
      if (current) current.assigned += 1;
    }
    for (const row of sales) {
      if (!row.brokerAgentId) continue;
      const current = map.get(row.brokerAgentId);
      if (!current) continue;
      current.submitted += 1;
      if (row.status === "Approved") current.deals += 1;
    }
    return map;
  }, [assignments, myAgents, sales]);

  const filteredAgents = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return myAgents.filter((agent) => {
      const perf = performanceByAgentId.get(agent.id) ?? { assigned: 0, deals: 0, submitted: 0 };
      const computedStatus =
        agent.status === "Disabled" ? "Disabled" : perf.assigned > 0 || perf.submitted > 0 ? "Active" : "Inactive";
      const matchesSearch =
        !q ||
        [agent.name, agent.id, agent.email, agent.phone, computedStatus].join(" ").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" ? true : computedStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [myAgents, performanceByAgentId, statusFilter, tableSearch]);
  const isInitialLoading = (agentsQuery.isLoading || assignmentsQuery.isLoading || salesQuery.isLoading) && myAgents.length === 0;
  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAgents.slice(start, start + pageSize);
  }, [currentPage, filteredAgents]);

  useEffect(() => {
    setPage(1);
  }, [tableSearch, statusFilter]);

  return (
    <div className="space-y-5 pb-6">
      <section className="space-y-4 rounded-md border border-[#dbe4eb] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
            <Search className="h-4 w-4 text-[#46a4a8]" />
            <input
              value={tableSearch}
              onChange={(event) => setTableSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
              placeholder="Search"
            />
          </div>
          <Link
            href="/broker/agents/new"
            className="inline-flex items-center gap-2 rounded-md bg-[#3aa4a8] px-5 py-2.5 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> Add Agent
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{filteredAgents.length}</span>)
          </p>
          <div className="flex items-center gap-3 text-sm text-[#8f9aaa]">
            <span>Status</span>
            <FancySelect
              className="h-10 min-w-[160px] rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | "Active" | "Disabled" | "Inactive")}
            >
              <option value="all">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Disabled">Disabled</option>
            </FancySelect>
          </div>
        </div>
        <div className="min-h-[460px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Agent Name</th>
                <th className="px-4 py-3">Agent ID</th>
                <th className="px-4 py-3">Assigned Units</th>
                <th className="px-4 py-3">Deals Closed</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isInitialLoading && <TableSkeletonRows cols={6} rows={6} />}
              {!isInitialLoading && pageRows.map((agent) => (
                <tr key={agent.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 text-[#1f2a44]">{agent.name}</td>
                  <td className="px-4 py-3">{agent.id}</td>
                  <td className="px-4 py-3">{performanceByAgentId.get(agent.id)?.assigned ?? 0}</td>
                  <td className="px-4 py-3">{performanceByAgentId.get(agent.id)?.deals ?? 0}</td>
                  <td className="px-4 py-3">
                    {(() => {
                      const perf = performanceByAgentId.get(agent.id) ?? { assigned: 0, submitted: 0, deals: 0 };
                      const computedStatus =
                        agent.status === "Disabled" ? "Disabled" : perf.assigned > 0 || perf.submitted > 0 ? "Active" : "Inactive";
                      const classes =
                        computedStatus === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : computedStatus === "Inactive"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700";
                      return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${classes}`}>{computedStatus}</span>;
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/broker/agents/${encodeURIComponent(agent.id)}`}
                        title="View agent"
                        aria-label="View agent"
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href={`/broker/agents/${encodeURIComponent(agent.id)}/edit`}
                        title="Edit"
                        aria-label="Edit"
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-amber-400"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={async () => {
                          try {
                            await runWithToast({
                              loading: "Updating agent status...",
                              success: "Agent status updated.",
                              action: () =>
                                updateAgent.mutateAsync({
                                  agentId: agent.id,
                                  data: { status: agent.status === "Active" ? "Disabled" : "Active" },
                                }),
                            });
                          } catch {}
                        }}
                        title={agent.status === "Active" ? "Disable" : "Enable"}
                        aria-label={agent.status === "Active" ? "Disable" : "Enable"}
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-orange-400"
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await runWithToast({
                              loading: "Deleting agent...",
                              success: "Agent deleted.",
                              action: () => deleteAgent.mutateAsync(agent.id),
                            });
                          } catch {}
                        }}
                        disabled={
                          (performanceByAgentId.get(agent.id)?.assigned ?? 0) > 0 ||
                          (performanceByAgentId.get(agent.id)?.submitted ?? 0) > 0
                        }
                        title="Delete"
                        aria-label="Delete"
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-rose-500 disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isInitialLoading && filteredAgents.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 text-[#7f8a99]" colSpan={6}>
                    No agents found. Click Add Agent to create your first agent.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[#ecf1f5] px-6 py-4">
          <span className="text-sm text-[#9aa6b2]">
            Currently at Page: {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
            className="rounded-full border border-[#dbe4eb] bg-white px-3 py-1.5 text-sm text-[#4f6078] disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={
              (currentPage >= totalPages && !agentsQuery.hasNextPage) ||
              agentsQuery.isFetchingNextPage ||
              isInitialLoading
            }
            onClick={async () => {
              if (currentPage < totalPages) {
                setPage((prev) => prev + 1);
                return;
              }
              if (agentsQuery.hasNextPage && !agentsQuery.isFetchingNextPage) {
                await agentsQuery.fetchNextPage();
                setPage((prev) => prev + 1);
              }
            }}
            className="rounded-full border border-[#dbe4eb] bg-white px-3 py-1.5 text-sm text-[#4f6078] disabled:opacity-40"
          >
            {agentsQuery.isFetchingNextPage ? "Loading..." : "Next"}
          </button>
        </div>
      </section>
    </div>
  );
}
