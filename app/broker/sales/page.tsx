"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import { useMemo, useState } from "react";
import { useAppContext } from "@/components/state/app-context";
import { useVisibleBrokerProperties } from "@/hooks/use-properties";
import { useBrokerAgreements } from "@/hooks/use-agreements";
import { useBrokerAgents } from "@/hooks/use-agents";
import { useBrokerSalesRequests, useCreateSaleRequest } from "@/hooks/use-sales-control";
import { runWithToast } from "@/lib/ui/toast";
import { SaleRequestStatusPill } from "@/components/broker/sale-request-status-pill";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { DeveloperCell } from "@/components/ui/developer-cell";

export default function BrokerNewSaleRequestPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const propertiesQuery = useVisibleBrokerProperties(brokerId);
  const agreementsQuery = useBrokerAgreements(brokerId);
  const agentsQuery = useBrokerAgents(brokerId);
  const salesQuery = useBrokerSalesRequests(brokerId);
  const createSaleRequest = useCreateSaleRequest();

  const properties = propertiesQuery.data ?? [];
  const agreements = useMemo(() => agreementsQuery.data?.pages.flatMap((page) => page.items) ?? [], [agreementsQuery.data?.pages]);
  const agents = useMemo(() => agentsQuery.data?.pages.flatMap((page) => page.items) ?? [], [agentsQuery.data?.pages]);
  const sales = salesQuery.data ?? [];

  const [propertyId, setPropertyId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [notes, setNotes] = useState("Buyer ready / reservation requested.");

  const selectedProperty = properties.find((row) => row.id === propertyId) ?? null;
  const selectedAgreement = selectedProperty ? agreements.find((row) => row.id === selectedProperty.agreementId) ?? null : null;
  const hasPendingForProperty = selectedProperty
    ? sales.some((row) => row.propertyId === selectedProperty.id && row.status === "Pending")
    : false;

  const canSubmit =
    Boolean(selectedProperty) &&
    Boolean(selectedAgreement) &&
    (selectedAgreement!.status === "Active" || selectedAgreement!.status === "Renewed") &&
    selectedProperty!.status === "Available" &&
    !hasPendingForProperty;

  const pendingRows = sales.filter((row) => row.status === "Pending").slice(0, 8);
  const showInitialSkeleton =
    (propertiesQuery.isLoading || agreementsQuery.isLoading || agentsQuery.isLoading || salesQuery.isLoading) &&
    pendingRows.length === 0;
  const queryError =
    propertiesQuery.error || agreementsQuery.error || agentsQuery.error || salesQuery.error;

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">New Sale Request</h1>
        <p className="mt-1 text-sm text-[#607187]">Submit sales with legal clarity and full request traceability.</p>
      </section>

      {queryError && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {queryError instanceof Error ? queryError.message : "Unable to load sales module data."}
        </section>
      )}

      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="ui-label">
            Property
            <FancySelect value={propertyId} onChange={(event) => setPropertyId(event.target.value)} className="ui-select">
              <option value="">Select visible property</option>
              {properties.map((row) => (
                <option key={`${row.id}-${row.agreementId}`} value={row.id}>
                  {row.id} · {row.projectName} · {row.price.toLocaleString()} QAR
                </option>
              ))}
            </FancySelect>
          </label>

          <label className="ui-label">
            Submitted by Agent (future-ready)
            <FancySelect value={agentId} onChange={(event) => setAgentId(event.target.value)} className="ui-select">
              <option value="">Select agent (optional)</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.id})
                </option>
              ))}
            </FancySelect>
          </label>

          <label className="ui-label">
            Developer (auto linked)
            <input value={selectedProperty?.developerId ?? ""} readOnly className="ui-input" />
          </label>

          <label className="ui-label">
            Agreement (auto linked)
            <input value={selectedProperty?.agreementId ?? ""} readOnly className="ui-input" />
          </label>

          <label className="ui-label sm:col-span-2">
            Notes
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="ui-textarea" />
          </label>

          <label className="ui-label sm:col-span-2">
            Attachments (Future Placeholder)
            <input className="ui-input" readOnly value="Buyer documents placeholder (coming in next phase)" />
          </label>
        </div>

        <div className="mt-4 rounded-lg border border-[#ecf1f5] bg-[#f8fafc] p-3 text-xs text-[#607187]">
          Submission rules: agreement must be active, property must be visible and available.
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={!canSubmit || createSaleRequest.isPending}
            className="ui-btn-primary disabled:opacity-50"
            onClick={async () => {
              if (!selectedProperty || !selectedAgreement) return;
              try {
                await runWithToast({
                  loading: "Submitting sale request...",
                  success: "Request submitted successfully.",
                  action: () =>
                    createSaleRequest.mutateAsync({
                      developerId: selectedProperty.developerId,
                      brokerId,
                      agreementId: selectedProperty.agreementId,
                      propertyId: selectedProperty.id,
                      propertyCode: selectedProperty.id,
                      projectName: selectedProperty.projectName,
                      unitNumber: selectedProperty.unitNumber,
                      propertyPrice: selectedProperty.price,
                      brokerAgentId: agentId || undefined,
                      requestNotes: notes,
                    }),
                });
                setPropertyId("");
                setAgentId("");
              } catch {}
            }}
          >
            {createSaleRequest.isPending ? "Submitting..." : "Submit Sale Request"}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">Recent Pending Requests</p>
        </div>
        <div className="min-h-[280px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Request ID</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Developer</th>
                <th className="px-4 py-3">Agreement</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {showInitialSkeleton && <TableSkeletonRows cols={5} rows={6} />}
              {!showInitialSkeleton && pendingRows.map((row) => (
                <tr key={row.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.id}</td>
                  <td className="px-4 py-3">{row.propertyCode}</td>
                  <td className="px-4 py-3"><DeveloperCell developerId={row.developerId} /></td>
                  <td className="px-4 py-3">{row.agreementId}</td>
                  <td className="px-4 py-3"><SaleRequestStatusPill status={row.status} /></td>
                </tr>
              ))}
              {!showInitialSkeleton && pendingRows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>No pending requests yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
