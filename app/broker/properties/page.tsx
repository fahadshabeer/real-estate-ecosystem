"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Eye, Filter, Search, Send, UserPlus } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useVisibleBrokerProperties } from "@/hooks/use-properties";
import { useBrokerAgreements } from "@/hooks/use-agreements";
import { useBrokerAgents } from "@/hooks/use-agents";
import { useCreateSaleRequest, useBrokerSalesRequests } from "@/hooks/use-sales-control";
import { useAssignBrokerProperty, useBrokerPropertyAssignments } from "@/hooks/use-broker-inventory";
import { companyRepository } from "@/lib/backend/factory";
import { runWithToast } from "@/lib/ui/toast";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { DeveloperCell } from "@/components/ui/developer-cell";

export default function BrokerAllPropertiesPage() {
  const searchParams = useSearchParams();
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const propertiesQuery = useVisibleBrokerProperties(brokerId);
  const agreementsQuery = useBrokerAgreements(brokerId);
  const agentsQuery = useBrokerAgents(brokerId);
  const assignmentsQuery = useBrokerPropertyAssignments(brokerId);
  const salesQuery = useBrokerSalesRequests(brokerId);
  const createSale = useCreateSaleRequest();
  const assignProperty = useAssignBrokerProperty(brokerId);

  const properties = propertiesQuery.data ?? [];
  const agreements = useMemo(() => agreementsQuery.data?.pages.flatMap((page) => page.items) ?? [], [agreementsQuery.data?.pages]);
  const agents = useMemo(() => agentsQuery.data?.pages.flatMap((page) => page.items) ?? [], [agentsQuery.data?.pages]);
  const assignments = assignmentsQuery.data ?? [];
  const sales = salesQuery.data ?? [];

  const [search, setSearch] = useState("");
  const [developerFilter, setDeveloperFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agreementFilter, setAgreementFilter] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [actionPropertyId, setActionPropertyId] = useState<string | null>(null);
  const [saleNotes, setSaleNotes] = useState("Broker initiated sold request.");
  const [selectedAgentId, setSelectedAgentId] = useState("");

  const developerIds = [...new Set(properties.map((row) => row.developerId))];
  const developerNamesQuery = useQuery({
    queryKey: ["broker-inventory", "developer-names", developerIds.join("|")],
    enabled: developerIds.length > 0,
    queryFn: async () => {
      const rows = await Promise.all(developerIds.map((id) => companyRepository.getCompanyById(id)));
      return Object.fromEntries(rows.filter((row): row is NonNullable<typeof row> => Boolean(row)).map((row) => [row.id, row.name]));
    },
  });

  const projectOptions = [...new Set(properties.map((row) => row.projectName).filter(Boolean))];
  const typeOptions = [...new Set(properties.map((row) => row.propertyType).filter(Boolean))];
  const agreementOptions = [...new Set(properties.map((row) => row.agreementId))];
  const showInitialSkeleton =
    (propertiesQuery.isLoading || agreementsQuery.isLoading || agentsQuery.isLoading || assignmentsQuery.isLoading) &&
    properties.length === 0;
  const queryError =
    propertiesQuery.error ||
    agreementsQuery.error ||
    agentsQuery.error ||
    assignmentsQuery.error ||
    salesQuery.error ||
    developerNamesQuery.error;

  useEffect(() => {
    const developer = searchParams.get("developer");
    const project = searchParams.get("project");
    const propertyId = searchParams.get("propertyId");
    if (developer) setDeveloperFilter(developer);
    if (project) setProjectFilter(project);
    if (propertyId) {
      setSearch(propertyId);
      setActionPropertyId(propertyId);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;
    return properties.filter((row) => {
      const developerName = developerNamesQuery.data?.[row.developerId] ?? row.developerId;
      const matchesSearch =
        !q || [row.id, row.projectName, developerName].join(" ").toLowerCase().includes(q);
      const matchesDeveloper = developerFilter === "all" ? true : row.developerId === developerFilter;
      const matchesProject = projectFilter === "all" ? true : row.projectName === projectFilter;
      const matchesType = typeFilter === "all" ? true : row.propertyType === typeFilter;
      const matchesStatus = statusFilter === "all" ? true : row.status === statusFilter;
      const matchesAgreement = agreementFilter === "all" ? true : row.agreementId === agreementFilter;
      const matchesMin = min === null || row.price >= min;
      const matchesMax = max === null || row.price <= max;
      return (
        matchesSearch &&
        matchesDeveloper &&
        matchesProject &&
        matchesType &&
        matchesStatus &&
        matchesAgreement &&
        matchesMin &&
        matchesMax
      );
    });
  }, [
    agreementFilter,
    developerFilter,
    developerNamesQuery.data,
    maxPrice,
    minPrice,
    projectFilter,
    properties,
    search,
    statusFilter,
    typeFilter,
  ]);

  const activeAgreementIds = new Set(
    agreements.filter((row) => row.status === "Active" || row.status === "Renewed").map((row) => row.id),
  );

  const assigningProperty = actionPropertyId ? filtered.find((row) => row.id === actionPropertyId) ?? null : null;
  const assignedAgent = assigningProperty
    ? assignments.find((row) => row.propertyId === assigningProperty.id)
    : null;

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">All Properties</h1>
        <p className="mt-1 text-sm text-[#607187]">Sales-ready inventory from active developer agreements only.</p>
      </section>

      <section className="rounded-xl border border-[#dbe4eb] bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-3 py-2.5 lg:col-span-2">
            <Search className="h-4 w-4 text-[#46a4a8]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
              placeholder="Search by property code, project, developer"
            />
          </div>
          <FancySelect value={developerFilter} onChange={(event) => setDeveloperFilter(event.target.value)} className="ui-select">
            <option value="all">All Developers</option>
            {developerIds.map((id) => (
              <option key={id} value={id}>{developerNamesQuery.data?.[id] ?? id}</option>
            ))}
          </FancySelect>
          <FancySelect value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="ui-select">
            <option value="all">All Projects</option>
            {projectOptions.map((project) => (
              <option key={project} value={project}>{project}</option>
            ))}
          </FancySelect>
          <FancySelect value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="ui-select">
            <option value="all">All Types</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </FancySelect>
          <FancySelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="ui-select">
            <option value="all">All Status</option>
            <option value="Available">Available</option>
            <option value="Reserved">Reserved</option>
            <option value="Sold">Sold</option>
          </FancySelect>
          <FancySelect value={agreementFilter} onChange={(event) => setAgreementFilter(event.target.value)} className="ui-select">
            <option value="all">All Agreements</option>
            {agreementOptions.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </FancySelect>
          <input value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Min Price (QAR)" className="ui-input" />
          <input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Max Price (QAR)" className="ui-input" />
        </div>
      </section>

      {queryError && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {queryError instanceof Error ? queryError.message : "Unable to load broker inventory data."}
        </section>
      )}

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">Total(<span className="font-bold">{filtered.length}</span>)</p>
          <span className="inline-flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-3 py-1.5 text-xs text-[#607187]">
            <Filter className="h-3.5 w-3.5" />
            QAR Range Enabled
          </span>
        </div>
        <div className="min-h-[560px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Property Code</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Developer</th>
                <th className="px-4 py-3">Agreement</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {showInitialSkeleton && <TableSkeletonRows cols={8} rows={8} />}
              {!showInitialSkeleton &&
                filtered.map((property) => {
                  const assignment = assignments.find((row) => row.propertyId === property.id);
                  const assignedAgentName = assignment
                    ? agents.find((agent) => agent.id === assignment.agentId)?.name ?? assignment.agentId
                    : null;
                  const agreementActive = activeAgreementIds.has(property.agreementId);
                  const canAssign = property.status === "Available" && agreementActive;
                  const hasPendingSale = sales.some(
                    (row) =>
                      row.propertyId === property.id &&
                      row.status === "Pending",
                  );
                  const canSubmitSale = property.status === "Available" && agreementActive && !hasPendingSale;
                  return (
                    <tr key={`${property.id}-${property.agreementId}`} className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-3 font-medium text-[#1f2a44]">{property.id}</td>
                      <td className="px-4 py-3">{property.projectName}</td>
                      <td className="px-4 py-3"><DeveloperCell developerId={property.developerId} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span>{property.agreementId}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${agreementActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                            {agreementActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{property.propertyType}</td>
                      <td className="px-4 py-3">{property.price.toLocaleString()} QAR</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${property.status === "Available" ? "bg-emerald-100 text-emerald-700" : property.status === "Reserved" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                          {property.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/broker/properties/${encodeURIComponent(property.id)}?agreementId=${encodeURIComponent(property.agreementId)}`} className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#355069]" title="View">
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            type="button"
                            disabled={!canAssign || assignProperty.isPending}
                            onClick={() => {
                              setActionPropertyId(property.id);
                              setSelectedAgentId(assignment?.agentId ?? "");
                            }}
                            className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#355069] disabled:opacity-50"
                            title={canAssign ? "Assign Agent" : "Unit is not assignable"}
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={!canSubmitSale || createSale.isPending}
                            onClick={async () => {
                              try {
                                await runWithToast({
                                  loading: "Submitting sale request...",
                                  success: "Sale request submitted.",
                                  action: () =>
                                    createSale.mutateAsync({
                                      developerId: property.developerId,
                                      brokerId,
                                      agreementId: property.agreementId,
                                      propertyId: property.id,
                                      propertyCode: property.id,
                                      projectName: property.projectName,
                                      unitNumber: property.unitNumber,
                                      propertyPrice: property.price,
                                      brokerAgentId: assignment?.agentId ?? "AGT-2026-0012",
                                      requestNotes: saleNotes,
                                    }),
                                });
                              } catch {}
                            }}
                            className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#355069] disabled:opacity-50"
                            title={canSubmitSale ? "Submit Sale" : "Sale cannot be submitted for this unit"}
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {assignedAgentName && <p className="mt-1 text-[11px] text-[#7f8a99]">Assigned: {assignedAgentName}</p>}
                      </td>
                    </tr>
                  );
                })}
              {!showInitialSkeleton && filtered.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={8}>No properties match current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {assigningProperty && (
        <section className="rounded-xl border border-[#dbe4eb] bg-white p-4">
          <h2 className="font-display text-lg text-[#1f2a44]">Assign Agent</h2>
          <p className="mt-1 text-sm text-[#607187]">{assigningProperty.id} · {assigningProperty.projectName} · {assigningProperty.agreementId}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <FancySelect value={selectedAgentId} onChange={(event) => setSelectedAgentId(event.target.value)} className="ui-select">
              <option value="">Select Agent</option>
              {agents.filter((row) => row.status === "Active").map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.name} ({agent.id})</option>
              ))}
            </FancySelect>
            <input value={saleNotes} onChange={(event) => setSaleNotes(event.target.value)} className="ui-input" placeholder="Sale notes" />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={!selectedAgentId || assignProperty.isPending}
              className="ui-btn-primary disabled:opacity-50"
              onClick={async () => {
                if (!selectedAgentId) return;
                try {
                  await runWithToast({
                    loading: "Assigning property...",
                    success: "Property assigned to agent.",
                    action: () =>
                      assignProperty.mutateAsync({
                        brokerId,
                        propertyId: assigningProperty.id,
                        agreementId: assigningProperty.agreementId,
                        agentId: selectedAgentId,
                      }),
                  });
                  setActionPropertyId(null);
                } catch {}
              }}
            >
              Save Assignment
            </button>
            <button type="button" className="ui-btn-secondary" onClick={() => setActionPropertyId(null)}>Cancel</button>
          </div>
        </section>
      )}

      {!propertiesQuery.isLoading && properties.length === 0 && (
        <section className="rounded-xl border border-[#dbe4eb] bg-white p-6">
          <h3 className="font-display text-lg font-semibold text-[#1f2a44]">No inventory available yet</h3>
          <p className="mt-1 text-sm text-[#607187]">
            Properties will appear here only when developer connection is active, agreement is active, and property is mapped.
          </p>
        </section>
      )}
    </div>
  );
}
