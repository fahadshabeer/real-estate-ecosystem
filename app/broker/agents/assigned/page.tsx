"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import Link from "next/link";
import { Eye, Search, UserCog, UserMinus } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppContext } from "@/components/state/app-context";
import { useBrokerAgents } from "@/hooks/use-agents";
import {
  useAssignBrokerProperty,
  useBrokerPropertyAssignments,
  useRemoveBrokerPropertyAssignment,
} from "@/hooks/use-broker-inventory";
import { useVisibleBrokerProperties } from "@/hooks/use-properties";
import { runWithToast } from "@/lib/ui/toast";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { DeveloperCell } from "@/components/ui/developer-cell";

export default function BrokerAgentAssignedPropertiesPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const agentsQuery = useBrokerAgents(brokerId);
  const assignmentsQuery = useBrokerPropertyAssignments(brokerId);
  const propertiesQuery = useVisibleBrokerProperties(brokerId);
  const removeAssignment = useRemoveBrokerPropertyAssignment(brokerId);
  const assignProperty = useAssignBrokerProperty(brokerId);

  const agents = useMemo(() => agentsQuery.data?.pages.flatMap((page) => page.items) ?? [], [agentsQuery.data?.pages]);
  const assignments = assignmentsQuery.data ?? [];
  const properties = propertiesQuery.data ?? [];

  const [search, setSearch] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState("");

  const rows = useMemo(() => {
    return assignments
      .map((assignment) => {
        const property = properties.find((item) => item.id === assignment.propertyId);
        const agent = agents.find((item) => item.id === assignment.agentId);
        if (!property || !agent) return null;
        return { assignment, property, agent };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  }, [agents, assignments, properties]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (!q) return true;
      return [row.property.id, row.property.projectName, row.agent.name, row.agent.id, row.property.developerId]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
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
            placeholder="Search property, project, agent"
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
                <th className="px-4 py-3">Property Code</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Developer</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Assigned Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(agentsQuery.isLoading || assignmentsQuery.isLoading || propertiesQuery.isLoading) && (
                <TableSkeletonRows cols={7} rows={8} />
              )}
              {!agentsQuery.isLoading &&
                !assignmentsQuery.isLoading &&
                !propertiesQuery.isLoading &&
                filtered.map((row) => (
                  <tr key={`${row.assignment.propertyId}-${row.assignment.agentId}`} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.property.id}</td>
                    <td className="px-4 py-3">{row.property.projectName}</td>
                    <td className="px-4 py-3">
                      <DeveloperCell developerId={row.property.developerId} />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-[#1f2a44]">{row.agent.name}</p>
                        <p className="text-xs text-[#7f8a99]">{row.agent.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{new Date(row.assignment.assignedDate).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        Assigned
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/broker/properties/${encodeURIComponent(row.property.id)}?agreementId=${encodeURIComponent(row.property.agreementId)}`}
                          className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078]"
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078]"
                          title="Reassign"
                          onClick={() => {
                            setSelectedPropertyId(row.property.id);
                            setSelectedAgentId(row.agent.id);
                          }}
                        >
                          <UserCog className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-rose-500"
                          title="Remove"
                          onClick={async () => {
                            try {
                              await runWithToast({
                                loading: "Removing assignment...",
                                success: "Assignment removed.",
                                action: () =>
                                  removeAssignment.mutateAsync({ brokerId, propertyId: row.property.id }),
                              });
                            } catch {}
                          }}
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!agentsQuery.isLoading && !assignmentsQuery.isLoading && !propertiesQuery.isLoading && filtered.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={7}>
                    No assigned properties found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedPropertyId && (
        <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <h2 className="font-display text-lg text-[#1f2a44]">Reassign Property</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="ui-label">
              Property
              <input className="ui-input" readOnly value={selectedPropertyId} />
            </label>
            <label className="ui-label">
              Agent
              <FancySelect className="ui-select" value={selectedAgentId} onChange={(event) => setSelectedAgentId(event.target.value)}>
                <option value="">Select agent</option>
                {agents
                  .filter((agent) => agent.status === "Active")
                  .map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.id})
                    </option>
                  ))}
              </FancySelect>
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className="ui-btn-secondary"
              onClick={() => {
                setSelectedPropertyId(null);
                setSelectedAgentId("");
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ui-btn-primary"
              disabled={!selectedAgentId}
              onClick={async () => {
                const property = properties.find((item) => item.id === selectedPropertyId);
                if (!property || !selectedAgentId) return;
                try {
                  await runWithToast({
                    loading: "Reassigning property...",
                    success: "Property reassigned.",
                    action: () =>
                      assignProperty.mutateAsync({
                        brokerId,
                        agreementId: property.agreementId,
                        propertyId: property.id,
                        agentId: selectedAgentId,
                      }),
                  });
                  setSelectedPropertyId(null);
                  setSelectedAgentId("");
                } catch {}
              }}
            >
              Save Reassignment
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
