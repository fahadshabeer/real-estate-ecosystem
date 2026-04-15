"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Pencil } from "lucide-react";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useAppContext } from "@/components/state/app-context";
import { useBrokerAgent } from "@/hooks/use-agents";
import { useBrokerPropertyAssignments } from "@/hooks/use-broker-inventory";
import { useBrokerSalesRequests } from "@/hooks/use-sales-control";
import { useVisibleBrokerProperties } from "@/hooks/use-properties";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { DeveloperCell } from "@/components/ui/developer-cell";
import { SaleRequestStatusPill } from "@/components/broker/sale-request-status-pill";

export default function BrokerAgentProfilePage() {
  const params = useParams<{ agentId: string }>();
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const agentIdRaw = params?.agentId;
  const agentId = decodeURIComponent(Array.isArray(agentIdRaw) ? agentIdRaw[0] : agentIdRaw ?? "");

  const agentQuery = useBrokerAgent(agentId);
  const assignmentsQuery = useBrokerPropertyAssignments(brokerId);
  const salesQuery = useBrokerSalesRequests(brokerId);
  const propertiesQuery = useVisibleBrokerProperties(brokerId);
  const agent = agentQuery.data;

  const assignments = assignmentsQuery.data ?? [];
  const sales = salesQuery.data ?? [];
  const properties = propertiesQuery.data ?? [];

  const assignedRows = useMemo(() => {
    return assignments
      .filter((item) => item.agentId === agentId)
      .map((assignment) => {
        const property = properties.find((row) => row.id === assignment.propertyId);
        if (!property) return null;
        return { assignment, property };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  }, [agentId, assignments, properties]);

  const salesRows = useMemo(() => sales.filter((item) => item.brokerAgentId === agentId), [agentId, sales]);
  const approved = salesRows.filter((item) => item.status === "Approved").length;
  const conversion = assignedRows.length > 0 ? Math.round((approved / assignedRows.length) * 100) : 0;

  const loading = agentQuery.isLoading || assignmentsQuery.isLoading || salesQuery.isLoading || propertiesQuery.isLoading;

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link href="/broker/agents" className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078]" title="Back">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="font-display text-[22px] font-semibold text-[#1f2a44]">{agent?.name ?? "Agent Profile"}</h1>
              <p className="text-sm text-[#607187]">{agent?.id ?? "Loading..."}</p>
            </div>
          </div>
          {agent ? (
            <Link
              href={`/broker/agents/${encodeURIComponent(agent.id)}/edit`}
              className="ui-btn-secondary inline-flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          ) : null}
        </div>
      </section>

      {loading ? (
        <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
          <table className="min-w-full">
            <tbody>
              <TableSkeletonRows cols={4} rows={8} />
            </tbody>
          </table>
        </section>
      ) : !agent ? (
        <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <p className="text-sm text-rose-600">Agent not found.</p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <div className="rounded-md border border-[#dbe4eb] bg-white p-4">
              <p className="text-sm text-[#7f8a99]">Assigned Units</p>
              <p className="mt-1 text-xl font-semibold text-[#1f2a44]">{assignedRows.length}</p>
            </div>
            <div className="rounded-md border border-[#dbe4eb] bg-white p-4">
              <p className="text-sm text-[#7f8a99]">Submitted Sales</p>
              <p className="mt-1 text-xl font-semibold text-[#1f2a44]">{salesRows.length}</p>
            </div>
            <div className="rounded-md border border-[#dbe4eb] bg-white p-4">
              <p className="text-sm text-[#7f8a99]">Approved Sales</p>
              <p className="mt-1 text-xl font-semibold text-[#1f2a44]">{approved}</p>
            </div>
            <div className="rounded-md border border-[#dbe4eb] bg-white p-4">
              <p className="text-sm text-[#7f8a99]">Conversion</p>
              <p className="mt-1 text-xl font-semibold text-[#1f2a44]">{conversion}%</p>
            </div>
          </section>

          <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
            <h2 className="font-display text-lg text-[#1f2a44]">Overview</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="ui-label">Agent Name<input className="ui-input" readOnly value={agent.name} /></label>
              <label className="ui-label">Agent ID<input className="ui-input" readOnly value={agent.id} /></label>
              <label className="ui-label">Status<input className="ui-input" readOnly value={agent.status} /></label>
              <label className="ui-label">Phone<input className="ui-input" readOnly value={agent.phone} /></label>
              <label className="ui-label">Email<input className="ui-input" readOnly value={agent.email} /></label>
              <label className="ui-label">Joined<input className="ui-input" readOnly value={new Date(agent.createdAt).toLocaleString()} /></label>
            </div>
          </section>

          <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
            <div className="border-b border-[#ecf1f5] px-6 py-4">
              <h2 className="font-display text-lg text-[#1f2a44]">Assigned Properties</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-[#4f6078]">
                <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
                  <tr>
                    <th className="px-4 py-3">Property</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Developer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Assigned Date</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedRows.map((row) => (
                    <tr key={row.property.id} className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-3">{row.property.id}</td>
                      <td className="px-4 py-3">{row.property.projectName}</td>
                      <td className="px-4 py-3">
                        <DeveloperCell developerId={row.property.developerId} />
                      </td>
                      <td className="px-4 py-3">{row.property.status}</td>
                      <td className="px-4 py-3">{new Date(row.assignment.assignedDate).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/broker/properties/${encodeURIComponent(row.property.id)}?agreementId=${encodeURIComponent(row.property.agreementId)}`}
                          className="inline-flex items-center gap-1 rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-2 py-1 text-xs text-[#355069]"
                        >
                          Open
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {assignedRows.length === 0 ? (
                    <tr className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-5 text-[#7f8a99]" colSpan={6}>
                        No properties assigned yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
            <div className="border-b border-[#ecf1f5] px-6 py-4">
              <h2 className="font-display text-lg text-[#1f2a44]">Sales History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-[#4f6078]">
                <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
                  <tr>
                    <th className="px-4 py-3">Sale ID</th>
                    <th className="px-4 py-3">Property</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {salesRows.map((row) => (
                    <tr key={row.id} className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-3">{row.id}</td>
                      <td className="px-4 py-3">{row.propertyCode}</td>
                      <td className="px-4 py-3">{row.projectName}</td>
                      <td className="px-4 py-3">
                        <SaleRequestStatusPill status={row.status} />
                      </td>
                      <td className="px-4 py-3">{new Date(row.updatedAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/broker/sales/pending?requestId=${encodeURIComponent(row.id)}`}
                          className="inline-flex items-center gap-1 rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-2 py-1 text-xs text-[#355069]"
                        >
                          Open
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {salesRows.length === 0 ? (
                    <tr className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-5 text-[#7f8a99]" colSpan={6}>
                        No sales history yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
