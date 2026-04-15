"use client";

import { Medal, Search, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppContext } from "@/components/state/app-context";
import { useBrokerAgents } from "@/hooks/use-agents";
import { useBrokerPropertyAssignments } from "@/hooks/use-broker-inventory";
import { useBrokerSalesRequests } from "@/hooks/use-sales-control";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";

type Row = {
  id: string;
  name: string;
  assigned: number;
  submitted: number;
  approved: number;
  conversion: number;
  status: "Active" | "Inactive" | "Disabled";
};

export default function BrokerAgentPerformancePage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const agentsQuery = useBrokerAgents(brokerId);
  const assignmentsQuery = useBrokerPropertyAssignments(brokerId);
  const salesQuery = useBrokerSalesRequests(brokerId);
  const [search, setSearch] = useState("");

  const agents = useMemo(() => agentsQuery.data?.pages.flatMap((page) => page.items) ?? [], [agentsQuery.data?.pages]);
  const assignments = assignmentsQuery.data ?? [];
  const sales = salesQuery.data ?? [];

  const rows = useMemo<Row[]>(() => {
    const computed = agents.map((agent) => {
      const assigned = assignments.filter((item) => item.agentId === agent.id).length;
      const submitted = sales.filter((item) => item.brokerAgentId === agent.id).length;
      const approved = sales.filter((item) => item.brokerAgentId === agent.id && item.status === "Approved").length;
      const conversion = assigned > 0 ? Math.round((approved / assigned) * 100) : 0;
      const status: Row["status"] =
        agent.status === "Disabled" ? "Disabled" : assigned > 0 || submitted > 0 ? "Active" : "Inactive";
      return { id: agent.id, name: agent.name, assigned, submitted, approved, conversion, status };
    });
    return computed.sort((a, b) => b.approved - a.approved || b.conversion - a.conversion || a.name.localeCompare(b.name));
  }, [agents, assignments, sales]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => (!q ? true : [row.name, row.id, row.status].join(" ").toLowerCase().includes(q)));
  }, [rows, search]);

  return (
    <div className="space-y-5 pb-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <p className="text-sm text-[#7f8a99]">Top Performer</p>
          <p className="mt-1 text-lg font-semibold text-[#1f2a44]">{rows[0]?.name ?? "N/A"}</p>
          <p className="mt-1 text-sm text-[#4f6078]">{rows[0]?.approved ?? 0} approved sales</p>
        </div>
        <div className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <p className="text-sm text-[#7f8a99]">Average Conversion</p>
          <p className="mt-1 text-lg font-semibold text-[#1f2a44]">
            {rows.length > 0 ? Math.round(rows.reduce((sum, row) => sum + row.conversion, 0) / rows.length) : 0}%
          </p>
          <p className="mt-1 text-sm text-[#4f6078]">Across all active agents</p>
        </div>
        <div className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <p className="text-sm text-[#7f8a99]">Submitted Sales</p>
          <p className="mt-1 text-lg font-semibold text-[#1f2a44]">{sales.length}</p>
          <p className="mt-1 text-sm text-[#4f6078]">Pending + approved + rejected</p>
        </div>
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
        <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
          <Search className="h-4 w-4 text-[#46a4a8]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
            placeholder="Search agent name or ID"
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
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Assigned Units</th>
                <th className="px-4 py-3">Submitted Sales</th>
                <th className="px-4 py-3">Approved Sales</th>
                <th className="px-4 py-3">Conversion %</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(agentsQuery.isLoading || assignmentsQuery.isLoading || salesQuery.isLoading) && (
                <TableSkeletonRows cols={7} rows={8} />
              )}
              {!agentsQuery.isLoading &&
                !assignmentsQuery.isLoading &&
                !salesQuery.isLoading &&
                filtered.map((row, index) => (
                  <tr key={row.id} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3 font-semibold text-[#1f2a44]">
                      <span className="inline-flex items-center gap-1">
                        {index === 0 ? <Medal className="h-3.5 w-3.5 text-amber-500" /> : null}
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-[#1f2a44]">{row.name}</p>
                        <p className="text-xs text-[#7f8a99]">{row.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{row.assigned}</td>
                    <td className="px-4 py-3">{row.submitted}</td>
                    <td className="px-4 py-3">{row.approved}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[#1f7d79]">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {row.conversion}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-semibold ${
                          row.status === "Active"
                            ? "bg-emerald-100 text-emerald-700"
                            : row.status === "Inactive"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              {!agentsQuery.isLoading && !assignmentsQuery.isLoading && !salesQuery.isLoading && filtered.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={7}>
                    No agent performance data found.
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
