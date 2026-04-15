"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAppContext } from "@/components/state/app-context";
import { useVisibleBrokerProperties } from "@/hooks/use-properties";
import { useBrokerAgents } from "@/hooks/use-agents";
import { useBrokerPropertyAssignments, useRemoveBrokerPropertyAssignment } from "@/hooks/use-broker-inventory";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { runWithToast } from "@/lib/ui/toast";

export default function BrokerAssignedPropertiesPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const propertiesQuery = useVisibleBrokerProperties(brokerId);
  const agentsQuery = useBrokerAgents(brokerId);
  const assignmentsQuery = useBrokerPropertyAssignments(brokerId);
  const removeAssignment = useRemoveBrokerPropertyAssignment(brokerId);

  const properties = propertiesQuery.data ?? [];
  const agents = useMemo(() => agentsQuery.data?.pages.flatMap((page) => page.items) ?? [], [agentsQuery.data?.pages]);
  const assignments = assignmentsQuery.data ?? [];

  const rows = assignments.map((assignment) => ({
    ...assignment,
    property: properties.find((property) => property.id === assignment.propertyId),
    agent: agents.find((agent) => agent.id === assignment.agentId),
  }));
  const showInitialSkeleton =
    (propertiesQuery.isLoading || agentsQuery.isLoading || assignmentsQuery.isLoading) &&
    rows.length === 0;
  const queryError = propertiesQuery.error || agentsQuery.error || assignmentsQuery.error;

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">Assigned to Agents</h1>
        <p className="mt-1 text-sm text-[#607187]">Agent assignment control for broker inventory execution.</p>
      </section>

      {queryError && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {queryError instanceof Error ? queryError.message : "Unable to load property assignments."}
        </section>
      )}

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">Total(<span className="font-bold">{rows.length}</span>)</p>
        </div>
        <div className="min-h-[460px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Assigned Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {showInitialSkeleton && <TableSkeletonRows cols={5} rows={6} />}
              {!showInitialSkeleton &&
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3">{row.property?.id ?? row.propertyId}</td>
                    <td className="px-4 py-3">{row.agent?.name ?? row.agentId}</td>
                    <td className="px-4 py-3">{new Date(row.assignedDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{row.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/broker/properties?propertyId=${encodeURIComponent(row.propertyId)}`}
                          className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-2.5 py-1.5 text-xs text-[#355069]"
                        >
                          Reassign
                        </Link>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await runWithToast({
                                loading: "Removing assignment...",
                                success: "Assignment removed.",
                                action: () =>
                                  removeAssignment.mutateAsync({
                                    brokerId,
                                    propertyId: row.propertyId,
                                  }),
                              });
                            } catch {}
                          }}
                          className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-2.5 py-1.5 text-xs text-rose-600"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!showInitialSkeleton && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>No assignments yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
