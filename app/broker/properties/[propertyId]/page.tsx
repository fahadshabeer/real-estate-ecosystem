"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useVisibleBrokerProperties } from "@/hooks/use-properties";
import { useBrokerAgreements } from "@/hooks/use-agreements";
import { useBrokerPropertyAssignments } from "@/hooks/use-broker-inventory";
import { useBrokerSalesRequests } from "@/hooks/use-sales-control";
import { DeveloperCell } from "@/components/ui/developer-cell";
import { AgreementStatusPill } from "@/components/broker/agreement-status-pill";

const tabs = ["Overview", "Developer Info", "Agreement Info", "Activity"] as const;

export default function BrokerPropertyDetailPage() {
  const params = useParams<{ propertyId: string }>();
  const searchParams = useSearchParams();
  const agreementIdQuery = searchParams.get("agreementId");
  const propertyId = decodeURIComponent(params?.propertyId ?? "");
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");

  const propertiesQuery = useVisibleBrokerProperties(brokerId);
  const agreementsQuery = useBrokerAgreements(brokerId);
  const assignmentsQuery = useBrokerPropertyAssignments(brokerId);
  const salesQuery = useBrokerSalesRequests(brokerId);

  const properties = propertiesQuery.data ?? [];
  const agreements = useMemo(() => agreementsQuery.data?.pages.flatMap((page) => page.items) ?? [], [agreementsQuery.data?.pages]);
  const assignments = assignmentsQuery.data ?? [];
  const sales = salesQuery.data ?? [];

  const property =
    properties.find((row) => row.id === propertyId && (!agreementIdQuery || row.agreementId === agreementIdQuery)) ??
    properties.find((row) => row.id === propertyId);
  const agreement = property ? agreements.find((row) => row.id === property.agreementId) : null;
  const assignment = property ? assignments.find((row) => row.propertyId === property.id) : null;
  const salesRows = property ? sales.filter((row) => row.propertyId === property.id) : [];
  const loading =
    propertiesQuery.isLoading || agreementsQuery.isLoading || assignmentsQuery.isLoading || salesQuery.isLoading;
  const queryError =
    propertiesQuery.error || agreementsQuery.error || assignmentsQuery.error || salesQuery.error;

  if (loading && !property) {
    return (
      <div className="rounded-md border border-[#dbe4eb] bg-white p-6 text-sm text-[#607187]">
        Loading property details...
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {queryError instanceof Error ? queryError.message : "Unable to load property details."}
      </div>
    );
  }

  if (!property) {
    return (
      <div className="space-y-4">
        <p className="rounded-md border border-[#dbe4eb] bg-white p-4 text-sm text-[#607187]">Property not found.</p>
        <Link href="/broker/properties" className="inline-flex rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-sm text-[#355069]">
          Back to Inventory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">{property.id}</h1>
        <p className="mt-1 text-sm text-[#607187]">{property.projectName} · Unit {property.unitNumber}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/broker/properties"
            className="inline-flex items-center gap-1 rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-3 py-1.5 text-xs text-[#355069]"
          >
            Back to Inventory
          </Link>
          <Link
            href={`/broker/agreements/${encodeURIComponent(property.agreementId)}`}
            className="inline-flex items-center gap-1 rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-3 py-1.5 text-xs text-[#355069]"
          >
            Open Agreement
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/broker/sales"
            className="inline-flex items-center gap-1 rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-3 py-1.5 text-xs text-[#355069]"
          >
            Submit Sale
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-2 text-sm ${
                activeTab === tab
                  ? "bg-[#3aa4a8] font-semibold text-white"
                  : "border border-[#dbe4eb] bg-white text-[#607187] hover:bg-[#f5f9fb]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        {activeTab === "Overview" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Meta label="Property Code" value={property.id} />
            <Meta label="Project" value={property.projectName} />
            <Meta label="Type" value={property.propertyType} />
            <Meta label="Price" value={`${property.price.toLocaleString()} QAR`} />
            <Meta label="Size" value={property.size} />
            <Meta label="Status" value={property.status} />
            <Meta label="Location" value={property.location} />
            <Meta label="Payment Plan" value="As per agreement commercial terms" />
          </div>
        )}

        {activeTab === "Developer Info" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Meta label="Developer" value={<DeveloperCell developerId={property.developerId} />} />
            <Meta label="Project" value={property.projectName} />
            <Meta label="Shared Date" value={new Date(property.sharedDate).toLocaleDateString()} />
            <Meta label="Contact Summary" value="Will be enabled in next phase." />
          </div>
        )}

        {activeTab === "Agreement Info" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Meta label="Agreement ID" value={property.agreementId} />
            <Meta label="Agreement Status" value={agreement ? <AgreementStatusPill status={agreement.status} /> : "-"} />
            <Meta label="Expiry Date" value={agreement?.validityEnd ?? "-"} />
            <Meta label="Agreement Type" value={agreement?.status === "Active" ? "Active rights" : "Restricted"} />
          </div>
        )}

        {activeTab === "Activity" && (
          <div className="space-y-2">
            <ActivityRow text={`Shared by developer under agreement ${property.agreementId}`} when={property.sharedDate} />
            {assignment && <ActivityRow text={`Assigned to agent ${assignment.agentId}`} when={assignment.assignedDate} />}
            {salesRows.map((row) => (
              <ActivityRow key={row.id} text={`Sale request ${row.id} is ${row.status}`} when={row.updatedAt} />
            ))}
            {salesRows.length === 0 && (
              <p className="rounded-md border border-[#ecf1f5] bg-[#f8fafc] p-3 text-sm text-[#7f8a99]">No property activity yet.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#ecf1f5] bg-[#f8fafc] p-3">
      <p className="text-xs text-[#7f8a99]">{label}</p>
      <div className="mt-1 text-sm text-[#1f2a44]">{value}</div>
    </div>
  );
}

function ActivityRow({ text, when }: { text: string; when: string }) {
  return (
    <div className="rounded-md border border-[#ecf1f5] bg-[#f8fafc] p-3">
      <p className="text-sm text-[#1f2a44]">{text}</p>
      <p className="mt-1 text-xs text-[#7f8a99]">{new Date(when).toLocaleString()}</p>
    </div>
  );
}
